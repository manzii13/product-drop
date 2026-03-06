import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import reservationRoutes from './routes/reservation.routes';
import prisma from './prisma';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://product-drop.netlify.app',
    process.env.FRONTEND_URL || ''
  ],
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);
app.use(generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', reservationRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Metrics
app.get('/metrics', async (_, res) => {
    const [users, products, reservations, orders] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.reservation.count(),
        prisma.order.count(),
    ]);
    const pending = await prisma.reservation.count({ where: { status: 'PENDING' } });
    res.json({ users, products, reservations, orders, pendingReservations: pending });
});

app.use(errorHandler);

export default app;