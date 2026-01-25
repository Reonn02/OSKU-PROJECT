'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInNasabah } from '@/lib/authService';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

export default function Login() {
    const router = useRouter();
    const { t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError(t('auth.login.error_required_email'));
            return;
        }

        if (!password.trim()) {
            setError(t('auth.login.error_required_password'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Sign in with Supabase Auth
            const result = await signInNasabah(email, password);

            if (!result.success) {
                // Use a generic error or specific translation if available
                setError(result.error || t('auth.login.error_generic'));
                setIsSubmitting(false);
                return;
            }

            // Check if user has nasabah record
            if (result.user) {
                const { data: nasabahData, error: nasabahError } = await supabase
                    .from('nasabah')
                    .select('id, name')
                    .eq('auth_user_id', result.user.id)
                    .single();

                if (nasabahError || !nasabahData) {
                    setError('Akun tidak ditemukan. Silakan daftar terlebih dahulu.'); // This might be better translated too if possible, but keeping it simple for now or adding to dict
                    // Sign out since no nasabah record
                    await supabase.auth.signOut();
                    setIsSubmitting(false);
                    return;
                }

                // Store nasabah info in sessionStorage for dashboard
                sessionStorage.setItem('nasabahId', nasabahData.id);
                sessionStorage.setItem('nasabahName', nasabahData.name);

                // Show success message
                setShowSuccess(true);

                // Redirect to dashboard after brief delay
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(t('auth.login.error_generic'));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <div className="absolute top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-between items-center">
                    <Link href="/" title={t('auth.login.back')} className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">{t('auth.login.title')}</h1>
                        <p className="text-sm text-primary">{t('auth.login.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                <i className="fas fa-exclamation-circle mr-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">{t('auth.login.email')}</label>
                            <input
                                type="email"
                                placeholder={t('auth.login.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">{t('auth.login.password')}</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.login.password_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                            />
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
                                    {t('auth.login.show_password')}
                                </label>
                            </div>
                            <Link href="/forgot-password" title="" className="text-xs text-primary hover:underline font-medium">
                                {t('auth.login.forgot_password')}
                            </Link>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('auth.login.processing') : t('auth.login.button')}
                            </button>
                        </div>

                        {/* Register Link */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-600">
                                {t('auth.login.no_account')} <Link href="/register" className="text-primary hover:underline font-medium">{t('auth.login.register_link')}</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </main>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-tertiary rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <i className="fas fa-check text-white text-lg"></i>
                        </div>
                        <div>
                            <p className="text-primary font-bold text-sm">{t('auth.login.success_title')}</p>
                            <p className="text-primary text-xs">{t('auth.login.success_desc')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
