'use client';

import Link from 'next/link';
import { useState, Suspense, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { showStandaloneToast } from '@/components/shared/Toast';
import { loginAdmin } from '@/app/actions/auth';
import { useAdmin } from '@/contexts/AdminContext';

function AdminLoginContent() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { refreshAdmin } = useAdmin();

    const [state, formAction, isPending] = useActionState(loginAdmin, { success: false, error: '' });

    useEffect(() => {
        if (state.success) {
            showStandaloneToast('success', 'Login Berhasil', 'Selamat datang!');

            // Trigger context refresh to potentially load data if needed, 
            // though context primarily fetches from client-side Supabase.
            // Since we are moving to cookies, client-side Supabase might lose session 
            // if we don't sync it, but for Admin we mainly used localStorage.
            // We set localStorage as a flag for UI components that check it.
            localStorage.setItem('adminLoggedIn', 'true');

            // Refresh context (which might fail if it relies on client supabase, 
            // but we are pivoting to server actions. Context might need update later.)
            refreshAdmin();

            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 1000);
        } else if (state.error) {
            showStandaloneToast('error', 'Login Gagal', state.error);
        }
    }, [state, router, refreshAdmin]);

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

                    <form action={formAction} className="space-y-4">
                        {state.error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                {state.error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
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
                                disabled={isPending}
                                className="block w-full bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 rounded-full transition shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? (
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
