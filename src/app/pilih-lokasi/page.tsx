'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { generateOTP, sendOTPEmail } from '@/utils/otpUtils';
import { signUpNasabah } from '@/lib/authService';
import Image from 'next/image';

export default function PilihLokasi() {
    const router = useRouter();
    const { banks } = useBankSampah();
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if user came from previous steps
    useEffect(() => {
        const registrationData = sessionStorage.getItem('registrationData');
        if (!registrationData) {
            router.push('/register');
        }
    }, [router]);

    const handleSelectBank = async (bankId: string, bankName: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setSelectedBankId(bankId);

        try {
            // Get current registration data
            const registrationDataStr = sessionStorage.getItem('registrationData');
            if (!registrationDataStr) {
                throw new Error('Registration data not found');
            }

            const registrationData = JSON.parse(registrationDataStr);

            // Add selected bank
            const completeProfileData = {
                ...registrationData,
                bankSampahId: bankId,
                bankSampahName: bankName,
                createdAt: new Date().toISOString(),
            };

            const email = completeProfileData.email;
            const password = completeProfileData.password;

            if (!email || !password) {
                throw new Error('Email or password not found');
            }

            // Step 1: Sign up with Supabase Auth
            const authResult = await signUpNasabah(email, password);

            if (!authResult.success) {
                alert(authResult.error || 'Gagal mendaftar. Silakan coba lagi.');
                setIsSubmitting(false);
                setSelectedBankId('');
                return;
            }

            // Store auth user id for later use
            if (authResult.user) {
                completeProfileData.authUserId = authResult.user.id;
            }

            // Save complete profile
            sessionStorage.setItem('userProfile', JSON.stringify(completeProfileData));
            sessionStorage.setItem('otpFlow', 'register');

            // Step 2: Send OTP via custom SMTP
            const otp = generateOTP();
            const emailSent = await sendOTPEmail(email, otp);

            if (!emailSent) {
                alert('Gagal mengirim OTP. Silakan coba lagi.');
                setIsSubmitting(false);
                setSelectedBankId('');
                return;
            }

            // Redirect to OTP verification
            router.push('/verify-otp');
        } catch (error) {
            console.error('Error selecting bank:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
            setIsSubmitting(false);
            setSelectedBankId('');
        }
    };

    // Helper function to check if bank is open now
    const checkOperationalStatus = (openTime: string, closeTime: string): boolean => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

        // Check if it's Sunday (0) - closed
        if (currentDay === 0) {
            return false;
        }

        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [openHour, openMinute] = openTime.split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(':').map(Number);

        const openMinutes = openHour * 60 + openMinute;
        const closeMinutes = closeHour * 60 + closeMinute;

        return currentTime >= openMinutes && currentTime <= closeMinutes;
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center p-4 py-8">
                <div className="w-full max-w-6xl mb-4 flex justify-start">
                    <Link href="/data-diri" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>

                <div className="w-full max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Lokasi Bank Sampah</h1>
                        <p className="text-sm text-primary">Berikut adalah daftar Bank Sampah yang aktif di Kelurahan Ciracas.</p>
                        <p className="text-sm text-primary">Silakan pilih lokasi yang paling dekat dengan Anda</p>
                    </div>

                    {/* Bank Cards Grid */}
                    {banks.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 mb-2">Belum ada bank sampah terdaftar</p>
                            <p className="text-xs text-gray-400">Silakan hubungi admin</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {banks.map((bank) => {
                                const isOpen = checkOperationalStatus(bank.openTime, bank.closeTime);
                                const isSelected = selectedBankId === bank.id;

                                return (
                                    <div
                                        key={bank.id}
                                        className={`bg-white rounded-3xl shadow-md border-2 overflow-hidden hover:shadow-xl transition-all flex flex-col ${isSelected ? 'border-primary' : 'border-gray-100'
                                            }`}
                                    >
                                        {/* Bank Image */}
                                        <div className="h-44 bg-gray-100 relative flex items-center justify-center p-6">
                                            <Image
                                                src={bank.image}
                                                alt={bank.nama}
                                                width={180}
                                                height={140}
                                                className="w-auto h-32 object-contain"
                                            />
                                        </div>

                                        {/* Bank Info */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            {/* Name & Status */}
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-base font-bold text-primary leading-tight flex-1 pr-2">
                                                    {bank.nama}
                                                </h3>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {isOpen ? 'Buka' : 'Tutup'}
                                                </span>
                                            </div>

                                            {/* Address */}
                                            <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                                                <i className="fas fa-map-marker-alt mr-1 text-primary"></i>
                                                {bank.alamat}
                                            </p>

                                            {/* Hours */}
                                            <div className="flex items-center text-xs text-gray-600 mb-6">
                                                <i className="far fa-clock mr-2 text-primary"></i>
                                                <span>Senin - Sabtu : {bank.openTime} - {bank.closeTime}</span>
                                            </div>

                                            {/* Select Button */}
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => handleSelectBank(bank.id, bank.nama)}
                                                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-full transition shadow-sm text-sm cursor-pointer"
                                                >
                                                    Pilih Lokasi Ini
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
