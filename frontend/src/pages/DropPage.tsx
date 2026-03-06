import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import client from '../api/client';

export const DropPage = () => {
    const { data: products, isLoading, error } = useProducts();

    const handleLogout = async () => {
        try {
            await client.post('/auth/logout');
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout failed:', err);
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-black text-white p-6 flex justify-between items-center">
                <div className="text-center flex-1">
                    <h1 className="text-3xl font-bold"> Limited Drop</h1>
                    <p className="text-gray-400 text-sm mt-1">Stock refreshes every 5 seconds</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
                >
                    Logout
                </button>
            </header>

            <main className="max-w-6xl mx-auto p-8">
                {isLoading && <p className="text-center text-gray-500">Loading drops...</p>}
                {error && <p className="text-center text-red-500">Failed to load products</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </main>
        </div>
    );
};