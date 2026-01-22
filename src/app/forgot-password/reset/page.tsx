'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    validateRequired,
    checkPasswordStrength,
    validatePassword,
    validatePasswordMatch,
    getRequiredError,
    getPasswordError,
    getPasswordMatchError,
} from '@/utils/validationUtils';
import { clearOTP } from '@/utils/otpUtils';

export default function ResetPassword() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});

    useEffect(() => {
        // Check if OTP was verified
        const isVerified = sessionStorage.getItem('otpVerified');
        const flow = sessionStorage.getItem('otpFlow');

        if (isVerified !== 'true' || flow !== 'forgot-password') {
            router.push('/forgot-password');
        }
    }, [router]);

    const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
        if (field === 'password') setPassword(value);
        else setConfirmPassword(value);

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleBlur = (field: 'password' | 'confirmPassword') => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field: 'password' | 'confirmPassword') => {
        let error: string | undefined;

        if (field === 'password') {
            if (!validateRequired(password)) {
                error = getRequiredError('Password Baru');
            } else if (!validatePassword(password)) {
                const strength = checkPasswordStrength(password);
                error = getPasswordError(strength);
            }
        } else {
            if (!validateRequired(confirmPassword)) {
                error = getRequiredError('Konfirmasi Password');
            } else if (!validatePasswordMatch(password, confirmPassword)) {
                error = getPasswordMatchError();
            }
        }

        setErrors(prev => ({ ...prev, [field]: error }));
        return !error;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched({ password: true, confirmPassword: true });

        const isPasswordValid = validateField('password');
        const isConfirmValid = validateField('confirmPassword');

        if (!isPasswordValid || !isConfirmValid) return;

        setIsSubmitting(true);

        try {
            // Simulate API call to reset password
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success
            setSuccess(true);
            clearOTP();
            sessionStorage.removeItem('otpVerified');
            sessionStorage.removeItem('otpFlow');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            console.error('Error resetting password:', err);
            setErrors({ password: 'Terjadi kesalahan. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const passwordStrength = checkPasswordStrength(password);

    if (success) {
        return (
            <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-4xl text-primary"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-primary mb-4">Password Berhasil Diubah!</h1>
                    <p className="text-gray-600 mb-8">
                        Password anda telah berhasil diperbarui. Anda akan segera dialihkan ke halaman login.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block bg-primary hover:bg-primary-dark text-white font-medium px-8 py-3 rounded-full transition shadow-md"
                    >
                        Ke Halaman Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Reset Password</h1>
                        <p className="text-sm text-primary">Buat password baru yang kuat untuk akun anda</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Password Baru */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Password Baru</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukkan password baru"
                                value={password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.password && errors.password
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.password && errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                            )}
                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-2 text-[10px] md:text-xs">
                                        <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasUppercase ? '✓' : '○'} Huruf Besar
                                        </span>
                                        <span className={passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasLowercase ? '✓' : '○'} Huruf Kecil
                                        </span>
                                        <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasNumber ? '✓' : '○'} Angka
                                        </span>
                                        <span className={passwordStrength.hasSymbol ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasSymbol ? '✓' : '○'} Simbol
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Konfirmasi Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Ulangi password baru"
                                value={confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                onBlur={() => handleBlur('confirmPassword')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.confirmPassword && errors.confirmPassword
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.confirmPassword && errors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Show Password Checkbox */}
                        <div className="flex items-center space-x-2 pt-1">
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

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Memperbarui Password...
                                    </span>
                                ) : (
                                    'Simpan Password Baru'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
