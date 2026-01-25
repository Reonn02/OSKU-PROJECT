'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { maskEmail } from '@/utils/otpUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

function ForgotPasswordVerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const { t } = useLanguage();
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Determine back link
    const backLink = role ? `/forgot-password?role=${role}` : '/forgot-password';

    useEffect(() => {
        // Get email from sessionStorage
        const storedEmail = sessionStorage.getItem('otpEmail');
        const flow = sessionStorage.getItem('otpFlow');

        if (!storedEmail || flow !== 'forgot-password') {
            // Redirect to forgot-password if no email or wrong flow
            router.push(backLink);
            return;
        }
        setEmail(storedEmail);

        // Focus first input
        inputRefs.current[0]?.focus();
    }, [router, backLink]);

    useEffect(() => {
        // Countdown timer
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-verify when all digits are entered
        if (value && index === 5 && newOtp.every(digit => digit !== '')) {
            verifyOTPCode(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Move to previous input if current is empty
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();

        // Check if pasted data is 6 digits
        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            setError('');
            inputRefs.current[5]?.focus();

            // Auto-verify
            verifyOTPCode(pastedData);
        }
    };

    const verifyOTPCode = async (otpCode: string) => {
        setIsVerifying(true);
        setError('');

        try {
            // Get stored OTP and expiry
            const storedOTP = sessionStorage.getItem('otpCode');
            const otpExpiry = sessionStorage.getItem('otpExpiry');

            if (!storedOTP || !otpExpiry) {
                setError(t('auth.otp.error_generic'));
                setIsVerifying(false);
                return;
            }

            // Check if OTP is expired
            if (Date.now() > parseInt(otpExpiry)) {
                setError(t('auth.otp.error_expired'));
                setOtp(new Array(6).fill(''));
                inputRefs.current[0]?.focus();
                setIsVerifying(false);
                return;
            }

            // Verify OTP
            if (otpCode === storedOTP) {
                // Mark OTP as verified
                sessionStorage.setItem('otpVerified', 'true');

                // Show success animation briefly
                await new Promise(resolve => setTimeout(resolve, 500));

                // Redirect to reset password page with role if present
                if (role) {
                    router.push(`/forgot-password/reset?role=${role}`);
                } else {
                    router.push('/forgot-password/reset');
                }
            } else {
                setError(t('auth.otp.error_invalid'));
                setOtp(new Array(6).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError(t('auth.otp.error_generic'));
            console.error('OTP verification error:', err);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(30);
        setError('');
        setOtp(new Array(6).fill(''));

        try {
            // Generate new OTP
            const newOTP = (Math.floor(100000 + Math.random() * 900000)).toString();

            // Send OTP via API
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    otp: newOTP,
                    type: 'forgot-password'
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update stored OTP
                sessionStorage.setItem('otpCode', newOTP);
                sessionStorage.setItem('otpExpiry', (Date.now() + 5 * 60 * 1000).toString());
                console.log('✅ OTP berhasil dikirim ulang');
            } else {
                setError(t('auth.otp.error_generic'));
            }
        } catch (err) {
            setError(t('auth.otp.error_generic'));
            console.error('Resend OTP error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <div className="absolute top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md mb-4 flex justify-start">
                    <Link href={backLink} title="" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-md border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-envelope text-3xl text-primary"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">{t('auth.otp.title')}</h1>
                        <p className="text-sm text-gray-600 mb-2">
                            {t('auth.otp.subtitle')}
                        </p>
                        <p className="text-sm font-medium text-primary">
                            {maskEmail(email)}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* OTP Input */}
                        <div>
                            <label className="text-xs text-primary font-medium block mb-3 text-center">
                                {t('auth.otp.label')}
                            </label>
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        disabled={isVerifying}
                                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 ${error
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                            : digit
                                                ? 'border-primary bg-secondary focus:border-primary focus:ring-primary'
                                                : 'border-gray-300 focus:border-primary focus:ring-primary'
                                            } focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                ))}
                            </div>
                            {error && (
                                <p className="text-xs text-red-500 mt-3 text-center">{error}</p>
                            )}
                        </div>

                        {/* Resend OTP */}
                        <div className="text-center">
                            {canResend ? (
                                <button
                                    onClick={handleResendOTP}
                                    className="text-sm text-primary hover:underline font-medium"
                                >
                                    {t('auth.otp.resend_link')}
                                </button>
                            ) : (
                                <p className="text-sm text-gray-600">
                                    {t('auth.otp.wait_text')} {' '}
                                    <span className="font-medium text-primary">{resendTimer} {t('auth.otp.seconds')}</span>
                                </p>
                            )}
                        </div>

                        {/* Verify Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => verifyOTPCode(otp.join(''))}
                                disabled={otp.some(digit => !digit) || isVerifying}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        {t('auth.otp.verifying')}
                                    </span>
                                ) : (
                                    t('auth.otp.verify_button')
                                )}
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-500">
                                {t('auth.otp.help_text')} {' '}
                                {canResend ? (
                                    <button
                                        onClick={handleResendOTP}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {t('auth.otp.resend')}
                                    </button>
                                ) : (
                                    <span className="text-gray-400">{t('auth.otp.wait_text')} {resendTimer} {t('auth.otp.seconds')}</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ForgotPasswordVerifyOTP() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordVerifyOTPContent />
        </Suspense>
    );
}
