'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface KonfirmasiLogoutProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export default function KonfirmasiLogout({ onCancel, onConfirm }: KonfirmasiLogoutProps) {
    useEffect(() => {
        // Lock scroll
        document.body.style.overflow = 'hidden';

        // Restore scroll on unmount
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
            <div className="max-w-4xl w-full flex flex-col items-center text-center">
                <div className="mb-12 w-full max-w-2xl px-4">
                    <Image
                        src="/images/OskuImage2.svg"
                        alt="Logout Confirmation"
                        width={800}
                        height={500}
                        className="w-full h-auto object-contain"
                        priority
                    />
                </div>

                <h2 className="text-2xl md:text-4xl font-bold text-primary mb-12">Apakah anda ingin keluar?</h2>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-primary font-bold py-4 rounded-full transition-all duration-300 text-sm flex items-center justify-center shadow-sm cursor-pointer border-none"
                    >
                        Tidak
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full transition-all duration-300 text-sm cursor-pointer border-none shadow-md hover:shadow-lg"
                    >
                        Ya
                    </button>
                </div>
            </div>
        </div>
    );
}
