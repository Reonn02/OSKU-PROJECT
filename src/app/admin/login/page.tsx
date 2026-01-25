'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, DbAdmin } from '@/lib/supabase';
import { showStandaloneToast } from '@/components/shared/Toast';

function AdminLoginContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!email.trim()) {
            showStandaloneToast('warning', 'Email Kosong', 'Silakan masukkan email Anda.');
            return;
        }

        if (!password.trim()) {
            showStandaloneToast('warning', 'Password Kosong', 'Silakan masukkan password Anda.');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Attempting login for:', email.trim().toLowerCase());

            // Query admin from database
            const { data, error } = await supabase
                .rpc('get_admin_by_email', { p_email: email.trim().toLowerCase() })
                .single();

            const admin = data as DbAdmin | null;

            if (error || !admin) {
                console.warn('Login failed:', error);
                showStandaloneToast('error', 'Login Gagal', 'Email tidak ditemukan dalam sistem.');
                setIsLoading(false);
                return;
            }

            // Check password
            if (admin.password !== password) {
                showStandaloneToast('error', 'Login Gagal', 'Password yang Anda masukkan salah.');
                setIsLoading(false);
                return;
            }

            // Login successful
            showStandaloneToast('success', 'Login Berhasil', `Selamat datang, ${admin.nama}!`);

            // Save admin session to localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminData', JSON.stringify({
                id: admin.id,
                nama: admin.nama,
                email: admin.email,
                role: admin.role,
                kelurahan: admin.kelurahan
            }));

            // Redirect to dashboard after short delay for toast to show
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Login error:', err);
            showStandaloneToast('error', 'Error', 'Terjadi kesalahan saat login. Silakan coba lagi.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link href="/" title="" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Login Admin</h1>
                        <p className="text-sm text-primary">Masuk ke dashboard administrator untuk mengelola sistem OSKU</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed pr-12"
                                />
                            </div>
                        </div>

                        {/* Show Password Checkbox & Forgot Password */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show-password"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                                />
                                <label htmlFor="show-password" className="text-xs text-primary select-none cursor-pointer">
                                    Tampilkan Password
                                </label>
                            </div>
                            <Link href="/forgot-password" title="" className="text-xs text-primary hover:underline font-medium">
                                Lupa Password?
                            </Link>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="block w-full bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 rounded-full transition shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Memproses...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default function AdminLogin() {
    return (
        <Suspense fallback={null}>
            <AdminLoginContent />
        </Suspense>
    );
}
