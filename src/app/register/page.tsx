'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    validateRequired,
    validateEmail,
    checkPasswordStrength,
    validatePassword,
    validatePasswordMatch,
    getRequiredError,
    getEmailError,
    getPasswordError,
    getPasswordMatchError,
} from '@/utils/validationUtils';

interface FormData {
    fullName: string;
    email: string;
    phoneNumber: string;
    nik: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    nik?: string;
    password?: string;
    confirmPassword?: string;
}

export default function Register() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phoneNumber: '',
        nik: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleBlur = (field: keyof FormData) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, formData[field]);
    };

    const validateField = (field: keyof FormData, value: string) => {
        let error: string | undefined;

        switch (field) {
            case 'fullName':
                if (!validateRequired(value)) {
                    error = getRequiredError('Nama Lengkap');
                }
                break;
            case 'email':
                if (!validateRequired(value)) {
                    error = getRequiredError('Email');
                } else if (!validateEmail(value)) {
                    error = getEmailError();
                }
                break;
            case 'phoneNumber':
                if (!validateRequired(value)) {
                    error = getRequiredError('Nomor HP');
                } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(value.replace(/[\s-]/g, ''))) {
                    error = 'Nomor HP tidak valid. Contoh: 08123456789';
                }
                break;
            case 'nik':
                if (!validateRequired(value)) {
                    error = getRequiredError('NIK');
                } else if (!/^[0-9]{16}$/.test(value)) {
                    error = 'NIK harus 16 digit angka';
                }
                break;
            case 'password':
                if (!validateRequired(value)) {
                    error = getRequiredError('Password');
                } else if (!validatePassword(value)) {
                    const strength = checkPasswordStrength(value);
                    error = getPasswordError(strength);
                }
                break;
            case 'confirmPassword':
                if (!validateRequired(value)) {
                    error = getRequiredError('Konfirmasi Password');
                } else if (!validatePasswordMatch(formData.password, value)) {
                    error = getPasswordMatchError();
                }
                break;
        }

        setErrors(prev => ({ ...prev, [field]: error }));
        return !error;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        // Validate all fields
        if (!validateRequired(formData.fullName)) {
            newErrors.fullName = getRequiredError('Nama Lengkap');
            isValid = false;
        }

        if (!validateRequired(formData.email)) {
            newErrors.email = getRequiredError('Email');
            isValid = false;
        } else if (!validateEmail(formData.email)) {
            newErrors.email = getEmailError();
            isValid = false;
        }

        if (!validateRequired(formData.phoneNumber)) {
            newErrors.phoneNumber = getRequiredError('Nomor HP');
            isValid = false;
        } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
            newErrors.phoneNumber = 'Nomor HP tidak valid. Contoh: 08123456789';
            isValid = false;
        }

        if (!validateRequired(formData.nik)) {
            newErrors.nik = getRequiredError('NIK');
            isValid = false;
        } else if (!/^[0-9]{16}$/.test(formData.nik)) {
            newErrors.nik = 'NIK harus 16 digit angka';
            isValid = false;
        }

        if (!validateRequired(formData.password)) {
            newErrors.password = getRequiredError('Password');
            isValid = false;
        } else if (!validatePassword(formData.password)) {
            const strength = checkPasswordStrength(formData.password);
            newErrors.password = getPasswordError(strength);
            isValid = false;
        }

        if (!validateRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = getRequiredError('Konfirmasi Password');
            isValid = false;
        } else if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
            newErrors.confirmPassword = getPasswordMatchError();
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({
            fullName: true,
            email: true,
            phoneNumber: true,
            nik: true,
            password: true,
            confirmPassword: true,
        });

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // OTP BYPASS FOR TESTING
            /*
            const otp = generateOTP();
            const emailSent = await sendOTPEmail(formData.email, otp);

            if (!emailSent) {
                setErrors(prev => ({ ...prev, email: 'Gagal mengirim OTP. Silakan coba lagi.' }));
                setIsSubmitting(false);
                return;
            }
            */

            // Store registration data in sessionStorage
            sessionStorage.setItem('registrationData', JSON.stringify({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                nik: formData.nik,
                password: formData.password,
            }));

            // Set email for data-diri
            sessionStorage.setItem('otpEmail', formData.email);

            // Redirect to data-diri page to complete profile
            router.push('/data-diri');
        } catch (error) {
            console.error('Error sending OTP:', error);
            setErrors(prev => ({ ...prev, email: 'Gagal mengirim OTP. Silakan coba lagi.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const passwordStrength = checkPasswordStrength(formData.password);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link href="/" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Registrasi Nasabah</h1>
                        <p className="text-sm text-primary">Daftarkan akun nasabah anda dan mulai menabung di OSKU</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nama Lengkap */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Nama Lengkap</label>
                            <input
                                type="text"
                                placeholder="Nama Lengkap"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                                onBlur={() => handleBlur('fullName')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.fullName && errors.fullName
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.fullName && errors.fullName && (
                                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.email && errors.email
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.email && errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Nomor HP */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Nomor HP</label>
                            <input
                                type="tel"
                                placeholder="08123456789"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/[^0-9+]/g, ''))}
                                onBlur={() => handleBlur('phoneNumber')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.phoneNumber && errors.phoneNumber
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.phoneNumber && errors.phoneNumber && (
                                <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
                            )}
                        </div>

                        {/* NIK */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">NIK</label>
                            <input
                                type="text"
                                placeholder="16 digit NIK"
                                maxLength={16}
                                value={formData.nik}
                                onChange={(e) => handleInputChange('nik', e.target.value.replace(/\D/g, ''))}
                                onBlur={() => handleBlur('nik')}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.nik && errors.nik
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                            />
                            {touched.nik && errors.nik && (
                                <p className="text-xs text-red-500 mt-1">{errors.nik}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={formData.password}
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
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-gray-600">Keamanan Password:</p>
                                    <div className="flex gap-2 text-xs">
                                        <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasUppercase ? '✓' : '○'} Huruf Besar
                                        </span>
                                        <span className={passwordStrength.hasLowercase ? 'text-green-600' : 'text-gray-400'}>
                                            {passwordStrength.hasLowercase ? '✓' : '○'} Huruf Kecil
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-xs">
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
                                placeholder="Konfirmasi Password"
                                value={formData.confirmPassword}
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
                                {isSubmitting ? 'Memproses...' : 'Daftar'}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center pt-2">
                            <p className="text-xs text-gray-600">
                                Sudah punya akun? <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
