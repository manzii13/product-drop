import prisma from '../src/prisma';

async function main() {
    await prisma.product.createMany({
        data: [
            { name: 'Nike Air Jordan 1 Limited', description: 'Exclusive drop - only 50 pairs', price: 299.99, totalStock: 50, currentStock: 50, imageUrl: 'https://via.placeholder.com/400x300?text=Jordan+1' },
            { name: 'Supreme Box Logo Tee', description: 'Limited edition drop', price: 89.99, totalStock: 30, currentStock: 30, imageUrl: 'https://via.placeholder.com/400x300?text=Supreme+Tee' },
            { name: 'PS5 Console Bundle', description: 'Limited bundle with 2 games', price: 599.99, totalStock: 10, currentStock: 10, imageUrl: 'https://via.placeholder.com/400x300?text=PS5+Bundle' },
        ],
    });
    console.log('Seeded products!');
}

main().catch(console.error).finally(() => prisma.$disconnect());