import { useState } from 'react';
import client from '../api/client';

interface Props { onLogin: () => void; }

export const LoginPage = ({ onLogin }: Props) => {
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const res = await client.post(endpoint, form);
            localStorage.setItem('token', res.data.data.token);
            onLogin();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-96 space-y-4">
                <h1 className="text-2xl font-bold text-center">Limited Drop</h1>
                <p className="text-gray-500 text-center text-sm">{isRegister ? 'Create account' : 'Sign in to reserve'}</p>
                {isRegister && (
                    <input className="w-full border rounded p-2" placeholder="Name"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                )}
                <input className="w-full border rounded p-2" placeholder="Email" type="email"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <input className="w-full border rounded p-2" placeholder="Password" type="password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button onClick={handleSubmit} className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                    {isRegister ? 'Register' : 'Login'}
                </button>
                <p className="text-center text-sm text-gray-500 cursor-pointer hover:underline"
                    onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
                </p>
            </div>
        </div>
    );
};