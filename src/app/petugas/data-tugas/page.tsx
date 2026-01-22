'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sendOTPEmail, generateOTP } from '@/utils/otpUtils';

const BANK_SAMPAH_DATA = [
    {
        id: 1,
        name: 'Bank Sampah PPSU Kelurahan Ciracas',
        address: 'Jl. Raya Ciracas RT 07 RW 03',
        time: 'Senin - Jum\'at : 8:00 - 16:30',
        image: '/images/location1.svg'
    },
    {
        id: 2,
        name: 'Bank Sampah Maju Mandiri',
        address: 'Jl. Raya Ciracas RT 02 RW 04',
        time: 'Senin - Jum\'at : 8:00 - 16:30',
        image: '/images/location1.svg'
    },
    {
        id: 3,
        name: 'Bank Sampah Pelangi 76',
        address: 'Jl. Penganten Ali II RT 07 RW 06',
        time: 'Senin - Jum\'at : 8:00 - 16:30',
        image: '/images/location1.svg'
    },
    {
        id: 4,
        name: 'Bank Sampah KWMT',
        address: 'Jl. Komplek Kebersihan RT 01 RW 09',
        time: 'Senin - Jum\'at : 8:00 - 16:30',
        image: '/images/location1.svg'
    }
];

function PetugasDataTugasContent() {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [selectedBank, setSelectedBank] = useState<typeof BANK_SAMPAH_DATA[0] | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const SECRET_TOKEN = 'petugas-osku-2025';

    useEffect(() => {
        if (token === SECRET_TOKEN) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    }, [token]);

    const handleSelectBank = (bank: typeof BANK_SAMPAH_DATA[0]) => {
        setSelectedBank(bank);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        if (!selectedBank) return;

        setIsLoading(true);
        const email = sessionStorage.getItem('otpEmail');

        let targetEmail = email;
        if (!targetEmail) {
            console.log('Simulation Mode: No email found, using default.');
            targetEmail = 'petugas.simulasi@osku.id';
            sessionStorage.setItem('otpEmail', targetEmail);
        }

        try {
            const otpCode = generateOTP();
            const success = await sendOTPEmail(targetEmail, otpCode);

            if (success) {
                // Store selected bank info
                sessionStorage.setItem('selectedBank', JSON.stringify(selectedBank));
                // Redirect to OTP with flow param
                router.push('/verify-otp?flow=petugas');
            } else {
                alert('Gagal mengirim OTP. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error in handling bank selection:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
            setShowModal(false);
        }
    };

    if (isAuthorized === null) return null;

    if (isAuthorized === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan atau akses ditolak.</p>
                    <Link href="/" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full transition shadow-md">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative overflow-x-hidden">

            <main className="flex-grow flex flex-col items-center justify-center p-4 py-20 md:py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">Tempat Bertugas</h1>
                    <p className="text-sm text-primary/70">Pilih bank sampah tempat Anda bertugas</p>
                </div>

                <div className="w-full max-w-[95vw] lg:max-w-6xl bg-white border border-gray-100 rounded-[32px] p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative text-primary">
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide snap-x snap-mandatory"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {BANK_SAMPAH_DATA.map((bank) => (
                            <div
                                key={bank.id}
                                className="flex-shrink-0 w-[280px] md:w-[320px] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col snap-start"
                            >
                                <div className="h-44 bg-[#E5E7EB] flex items-center justify-center p-6">
                                    <Image
                                        src={bank.image}
                                        alt="Bank Sampah"
                                        width={160}
                                        height={120}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-lg font-bold mb-2 line-clamp-2 min-h-[3.5rem]">
                                        {bank.name}
                                    </h3>
                                    <p className="text-xs text-primary/70 mb-4 line-clamp-1">
                                        {bank.address}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-primary/70 mb-6">
                                        <i className="far fa-clock"></i>
                                        <span>{bank.time}</span>
                                    </div>
                                    <button
                                        onClick={() => handleSelectBank(bank)}
                                        className="w-full bg-[#378142] hover:bg-primary-dark text-white font-medium py-3 rounded-xl transition shadow-sm text-sm mt-auto"
                                    >
                                        Bertugas Disini
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Custom Scrollbar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-1.5 bg-gray-200 rounded-full overflow-hidden hidden md:block">
                        <div className="h-full bg-gray-400 rounded-full w-1/2 mx-auto"></div>
                    </div>
                </div>

                <div className="mt-12 text-xs text-primary/60">
                    2025 OSKU All right reserved.
                </div>
            </main>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                                <i className="fas fa-question text-3xl"></i>
                            </div>
                            <h2 className="text-xl font-bold text-primary mb-2">Konfirmasi Pilihan</h2>
                            <p className="text-sm text-gray-600 mb-8">
                                Apakah anda yakin ingin bertugas di <span className="font-bold text-primary">{selectedBank?.name}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 rounded-full border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                                >
                                    Tidak
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary-dark transition flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                    ) : 'Ya'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PetugasDataTugas() {
    return (
        <Suspense fallback={null}>
            <PetugasDataTugasContent />
        </Suspense>
    );
}
