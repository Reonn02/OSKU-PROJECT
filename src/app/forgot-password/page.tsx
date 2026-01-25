'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import {
    validateRequired,
    validateEmail,
    getRequiredError,
    getEmailError,
} from '@/utils/validationUtils';
import { generateOTP } from '@/utils/otpUtils';

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);

    // Determine back link and text based on role
    const backLink = role === 'petugas' ? '/petugas/login' : '/login';
    const backText = role === 'petugas' ? 'Kembali ke Login Petugas' : t('auth.forgot_password.back_login');

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (error) setError(undefined);
    };

    const handleBlur = () => {
        setTouched(true);
        validateField(email);
    };

    const validateField = (value: string) => {
        let err: string | undefined;
        if (!validateRequired(value)) {
            err = getRequiredError(t('auth.forgot_password.label'));
        } else if (!validateEmail(value)) {
            err = getEmailError();
        }
        setError(err);
        return !err;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched(true);

        if (!validateField(email)) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate OTP
            const otp = generateOTP();

            // Send OTP via API endpoint
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: otp,
                    type: 'forgot-password'
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.error || t('auth.forgot_password.error_generic'));
                setIsSubmitting(false);
                return;
            }

            // Store OTP and email for verification
            sessionStorage.setItem('otpFlow', 'forgot-password');
            sessionStorage.setItem('otpEmail', email);
            sessionStorage.setItem('otpCode', otp);
            sessionStorage.setItem('otpExpiry', (Date.now() + 5 * 60 * 1000).toString()); // 5 minutes

            // Pass role to next page if needed, or query param
            if (role) {
                router.push(`/forgot-password/verify?role=${role}`);
            } else {
                router.push('/forgot-password/verify');
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            setError(t('auth.forgot_password.error_generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <div className="absolute top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link
                        href={backLink}
                        className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-key text-3xl text-primary"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">{t('auth.forgot_password.title')}</h1>
                        <p className="text-sm text-primary">{t('auth.forgot_password.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">{t('auth.forgot_password.label')}</label>
                            <input
                                type="email"
                                placeholder={t('auth.forgot_password.placeholder')}
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={handleBlur}
                                className={`w-full px-4 py-3 rounded-xl border ${touched && error
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched && error && (
                                <p className="text-xs text-red-500 mt-1">{error}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        {t('auth.forgot_password.sending')}
                                    </span>
                                ) : (
                                    t('auth.forgot_password.button')
                                )}
                            </button>
                        </div>

                        {/* Back to Login Link */}
                        <div className="text-center">
                            <Link href={backLink} className="text-sm text-primary hover:underline font-medium">
                                {backText}
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default function ForgotPassword() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
