#  Limited-Stock Product Drop System

> A high-concurrency reservation system built to handle 100+ simultaneous users competing for limited stock — without overselling, race conditions, or data corruption.

---

##  Links

| Resource | URL |
|---|---|
|  Live App | [https://your-app.pxxl.app](https://pxxl.app) |
|  GitHub | [[https://github.com/yourusername/product-drop](https://github.com/manzii13/product-drop.git)] |
|  Loom Walkthrough | [5-8 min explanation](https://loom.com) |

---

##  Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   React + TypeScript Frontend (Vite)                           │
│   ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│   │ ProductCard │  │CountdownTimer│  │   ReserveButton     │  │
│   │  Component  │  │  (5min live) │  │  (loading states)   │  │
│   └─────────────┘  └──────────────┘  └─────────────────────┘  │
│          │                │                    │               │
│   ┌──────────────────────────────────────────────┐            │
│   │         TanStack Query (5s auto-refresh)      │            │
│   │         Custom Hooks: useProducts,            │            │
│   │         useReservation, useCountdown          │            │
│   └──────────────────────────────────────────────┘            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                │
│                                                                 │
│   Node.js + Express + TypeScript                               │
│                                                                 │
│   Middleware Stack:                                             │
│   [CORS] → [Helmet] → [Rate Limiter] → [Request Logger]        │
│         → [Auth (JWT)] → [Zod Validator] → [Controller]        │
│                                                                 │
│   Routes:                                                       │
│   POST /api/auth/register    POST /api/auth/login              │
│   GET  /api/products         POST /api/products                │
│   POST /api/reserve          POST /api/checkout                │
│   GET  /api/my               GET  /health                      │
│   GET  /metrics                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Prisma ORM
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│                                                                 │
│   PostgreSQL                                                    │
│                                                                 │
│   ┌──────────┐  ┌─────────────┐  ┌───────────────────────┐    │
│   │   User   │  │   Product   │  │      Reservation      │    │
│   │          │  │             │  │   (expires in 5 min)  │    │
│   └──────────┘  └─────────────┘  └───────────────────────┘    │
│                                                                 │
│   ┌──────────┐  ┌──────────────────────────────────────────┐  │
│   │  Order   │  │  InventoryLog (full audit trail)         │  │
│   └──────────┘  └──────────────────────────────────────────┘  │
│                                                                 │
│   Serializable Transactions (race condition prevention)      │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKGROUND JOBS                            │
│                                                                 │
│   node-cron (runs every 60 seconds)                            │
│   → Find PENDING reservations past expiresAt                   │
│   → Mark as EXPIRED                                            │
│   → Restore stock atomically                                   │
│   → Log to InventoryLog                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

##  How Race Conditions Were Handled

This is the **most critical part** of the system. Here's the exact approach:

### The Problem
Imagine 100 users all check stock simultaneously — they all see `stock = 1`. Without protection, all 100 could successfully reserve the same item, causing `stock = -99`.

### The Solution: Serializable Transactions + Row-Level Locking

```typescript
// reservation.service.ts — The core race condition fix
return await prisma.$transaction(async (tx) => {
  // 1. SELECT FOR UPDATE — locks the row at database level
  //    Any other transaction trying to read this row will WAIT
  const product = await tx.$queryRaw`
    SELECT id, "currentStock", name, price
    FROM "Product"
    WHERE id = ${productId}
    FOR UPDATE  ← THIS IS THE KEY
  `;

  // 2. Check stock INSIDE the lock
  if (prod.currentStock < quantity) {
    throw new Error('Insufficient stock');
  }

  // 3. Deduct and create reservation atomically
  await tx.product.update({ data: { currentStock: { decrement: quantity } } });
  await tx.reservation.create({ data: { ... } });

}, { isolationLevel: 'Serializable' }); // ← Strongest isolation level
```

**Why this works:**
- `FOR UPDATE` acquires a row-level lock — only one transaction can hold it at a time
- `Serializable` isolation means concurrent transactions are executed as if they ran sequentially
- If two requests arrive simultaneously, one gets the lock and processes; the other waits, then sees the updated (decremented) stock
- Stock can **never go negative** because the check and decrement happen inside the same atomic lock

---

##  Schema Design Decisions

### Why a separate `InventoryLog` table?
Every stock change (reservation, checkout, expiry) is logged with `stockBefore` and `stockAfter`. This creates a full audit trail — critical for debugging disputes ("why did my reservation fail?") and for reconciling stock discrepancies in production.

### Why `currentStock` separate from `totalStock`?
- `totalStock` = what was originally available (never changes)
- `currentStock` = what's actually available right now (decrements on reserve, increments on expiry)
- This lets you show "X of Y remaining" and calculate sell-through rate

### Why `expiresAt` stored as a timestamp instead of a duration?
Storing the absolute expiry time makes queries simple: `WHERE expiresAt < NOW()`. If we stored duration, we'd need to calculate expiry on every query. The cron job and the frontend countdown both just compare against this single timestamp.

### Why `Reservation` has its own status enum?
`PENDING → COMPLETED` (via checkout) or `PENDING → EXPIRED` (via cron). This makes it trivial to query active reservations, report on conversion rates, and prevent double-checkout.

### Why UUID primary keys instead of auto-increment?
- Safe to expose in URLs (no sequential enumeration attacks)
- Works correctly in distributed systems if you ever shard
- `reservationId` in the API response is safe to return to clients

---

##  Trade-offs

| Decision | Benefit | Cost |
|---|---|---|
| Serializable isolation | Zero race conditions | Higher DB lock contention, slower throughput |
| 5-minute reservation window | Prevents stock hoarding | May frustrate slow users |
| Cron-based expiry (1 min interval) | Simple, reliable | Up to 60s delay before stock restored |
| Monolithic Express app | Easy to deploy, debug | Harder to scale individual components |
| JWT stateless auth | No session store needed | Can't instantly revoke tokens |
| PostgreSQL for everything | ACID guarantees, simple ops | Single point of failure |

---

##  What Would Break at 10,000 Concurrent Users

### 1. Database Connection Pool Exhaustion
PostgreSQL default max connections: ~100. At 10k users, connection pool fills up instantly. Every request that can't get a connection fails.

### 2. Serializable Transaction Bottleneck
With `FOR UPDATE` row locks, concurrent requests for the same product queue up serially. At 10k users hitting one product, you get a massive lock queue — most requests timeout.

### 3. Single Node.js Process
Node.js is single-threaded. One process can handle ~1,000 concurrent connections reasonably. At 10k, response times degrade badly.

### 4. Cron Job Stampede
The expiry cron queries the entire `Reservation` table every minute. At scale with millions of reservations, this becomes a slow full table scan.

### 5. No Caching
Every `/api/products` call hits PostgreSQL. At 10k users refreshing every 5 seconds = 2,000 DB queries/second just for product reads.

---

##  How to Scale It

### Phase 1 — Vertical + Connection Pooling (0→1k users)
```
Add PgBouncer connection pooler in front of PostgreSQL
Scale Node.js with PM2 cluster mode (use all CPU cores)
```

### Phase 2 — Caching Layer (1k→10k users)
```
Add Redis for:
  - Product stock cache (invalidate on reservation/expiry)
  - Rate limiting (distributed, not in-memory)
  - Session store

Use Redis distributed locks instead of DB-level FOR UPDATE:
  SET lock:product:{id} 1 EX 5 NX  ← atomic lock with 5s expiry
```

### Phase 3 — Horizontal Scaling (10k→100k users)
```
Multiple Node.js instances behind a load balancer (nginx/ALB)
Read replicas for PostgreSQL (all GET requests → replica)
Separate reservation service as its own microservice
Move expiry cron to a dedicated worker process
Partition InventoryLog table by date
```

### Phase 4 — Event-Driven Architecture (100k+ users)
```
Replace synchronous reservation with a queue (Redis/RabbitMQ/Kafka)
User clicks Reserve → message queued → worker processes reservation
→ WebSocket/SSE pushes result back to user
This decouples the burst of clicks from the DB writes
```

---

##  Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm v9+

### Backend
```bash
cd backend
npm install
cp .env.example .env          # Fill in your DATABASE_URL
npx prisma migrate dev        # Run migrations
npx ts-node prisma/seed.ts    # Seed test products
npm run dev                   # Start on port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # Start on port 5173
```

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/productdrop?schema=public"
JWT_SECRET="your-secret-key-minimum-32-chars"
PORT=3001
NODE_ENV=development
```

---

##  API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products (paginated, filterable) |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products` | Create product |

**Query params:** `?page=1&limit=10&sortBy=price&sortOrder=asc`

### Reservations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/reserve` |  | Reserve a product (5 min window) |
| POST | `/api/checkout` |  | Complete purchase |
| GET | `/api/my` |  | My reservations |

### System
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/metrics` | Basic metrics (users, orders, etc.) |

---

##  Testing

### Backend
```bash
cd backend
npm test
```
Tests cover: reservation logic, expiry logic, concurrency simulation

### Frontend
```bash
cd frontend
npm test
```
Tests cover: timer logic, API error handling, UI states

---

##  Tech Stack

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Zod, JWT, node-cron, bcryptjs

**Frontend:** React, TypeScript, Vite, TanStack Query, Axios, Tailwind CSS

**Infrastructure:** Render (backend), Pxxl (frontend), PostgreSQL (managed)

---


