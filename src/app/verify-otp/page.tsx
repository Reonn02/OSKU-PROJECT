'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addNasabah } from '@/data/nasabahData';
import { clearOTP, maskEmail, resendOTP, verifyOTP } from '@/utils/otpUtils';

export default function VerifyOTP() {
    const router = useRouter();
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if user came from registration
    useEffect(() => {
        const userProfile = sessionStorage.getItem('userProfile');
        const flow = sessionStorage.getItem('otpFlow');
        const storedEmail = sessionStorage.getItem('otpEmail');
        if (!userProfile || flow !== 'register') {
            router.push('/register');
            return;
        }
        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            try {
                const parsed = JSON.parse(userProfile);
                if (parsed?.email) {
                    setEmail(parsed.email);
                }
            } catch {
                // ignore
            }
        }
    }, [router]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
        setCanResend(true);
    }, [resendTimer]);

    const handleChange = (index: number, value: string) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (error) {
            setError('');
        }

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, index) => {
            if (index < 6) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);

        // Focus last filled input or last input
        const lastIndex = Math.min(pastedData.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleSubmit = async () => {
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            alert('Mohon masukkan 6 digit OTP');
            return;
        }

        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const isValid = verifyOTP(otpValue);
            if (!isValid) {
                setError('Kode OTP tidak valid atau sudah kadaluarsa');
                setOtp(new Array(6).fill(''));
                inputRefs.current[0]?.focus();
                return;
            }

            // Get user profile from session
            const userProfileStr = sessionStorage.getItem('userProfile');
            if (userProfileStr) {
                const userProfile = JSON.parse(userProfileStr);

                // Step 1: Confirm user email via API (using service role key)
                if (userProfile.authUserId) {
                    try {
                        const confirmRes = await fetch('/api/confirm-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userProfile.authUserId }),
                        });

                        if (confirmRes.ok) {
                            console.log('✅ User email confirmed via API');
                        } else {
                            console.warn('⚠️ Could not confirm user email, continuing anyway');
                        }
                    } catch (confirmError) {
                        console.warn('⚠️ Error confirming user:', confirmError);
                    }
                }

                // Step 2: Save new nasabah to Supabase database
                const result = await addNasabah({
                    authUserId: userProfile.authUserId, // Link to Supabase Auth user
                    username: userProfile.fullName.split(' ')[0], // First name as username
                    name: userProfile.fullName,
                    email: userProfile.email,
                    phone: userProfile.phoneNumber,
                    nik: userProfile.nik,
                    bankSampah: userProfile.bankSampahName || 'Bank Sampah PPSU Kelurahan Ciracas',
                    address: userProfile.address || '',
                    rt: userProfile.rt || '',
                    rw: userProfile.rw || '',
                    kelurahan: userProfile.kelurahan || 'Ciracas',
                    kecamatan: userProfile.kecamatan || 'Ciracas',
                    kota: userProfile.kota || 'Jakarta Timur',
                    provinsi: userProfile.provinsi || 'DKI Jakarta',
                    kodepos: userProfile.postalCode || '13720',
                });

                if (result) {
                    console.log('✅ New nasabah saved to Supabase:', userProfile.fullName);
                } else {
                    console.error('❌ Failed to save nasabah to Supabase');
                    setError('Gagal menyimpan data nasabah. Silakan coba lagi.');
                    return;
                }
            }

            // Show success notification
            setShowSuccess(true);

            clearOTP();
            sessionStorage.removeItem('otpFlow');
            sessionStorage.removeItem('registrationData');
            sessionStorage.removeItem('userProfile');

            // Wait 2 seconds then redirect to login
            await new Promise(resolve => setTimeout(resolve, 2000));
            router.push('/login');
        } catch (error) {
            console.error('Error verifying OTP:', error);
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setCanResend(false);
        setResendTimer(30);
        setError('');
        setOtp(new Array(6).fill(''));

        try {
            const ok = await resendOTP();
            if (!ok) {
                setError('Gagal mengirim ulang OTP. Silakan coba lagi.');
            }
        } catch (err) {
            console.error('Resend OTP error:', err);
            setError('Gagal mengirim ulang OTP. Silakan coba lagi.');
        }
    };

    const isComplete = otp.every(digit => digit !== '');

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link href="/pilih-lokasi" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>

                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-envelope text-primary text-3xl"></i>
                        </div>
                        <h1 className="text-3xl font-bold text-primary mb-2">Verifikasi OTP</h1>
                        <p className="text-sm text-primary">Masukkan 6 digit kode yang telah dikirim ke email Anda</p>
                        {email && (
                            <p className="text-sm font-medium text-primary mt-2">
                                {maskEmail(email)}
                            </p>
                        )}
                    </div>

                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-3 mb-8">
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
                                onPaste={handlePaste}
                                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                    {error && (
                        <p className="text-xs text-red-500 -mt-6 mb-6 text-center">{error}</p>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!isComplete || isSubmitting}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                        {isSubmitting ? 'Memverifikasi...' : 'Verifikasi'}
                    </button>

                    {/* Resend OTP */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Tidak menerima kode?</p>
                        <button
                            onClick={() => {
                                void handleResendOTP();
                            }}
                            className="text-sm text-primary font-semibold hover:underline"
                            disabled={!canResend}
                        >
                            {canResend ? 'Kirim Ulang OTP' : `Kirim Ulang dalam ${resendTimer} detik`}
                        </button>
                    </div>
                </div>
            </main>

            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-tertiary rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <i className="fas fa-check text-white text-lg"></i>
                        </div>
                        <div>
                            <p className="text-primary font-bold text-sm">Registrasi Berhasil!</p>
                            <p className="text-primary text-xs">Mengalihkan ke dashboard...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
