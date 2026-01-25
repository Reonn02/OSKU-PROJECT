'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DesktopOnlyGuardProps {
    children: React.ReactNode;
}

export default function DesktopOnlyGuard({ children }: DesktopOnlyGuardProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkWidth = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);

    if (!isMounted) return null;

    if (isMobile) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#F8FBF9] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-700">
                    {/* Logo Section */}
                    <div className="flex justify-center mb-8">
                        <Image
                            src="/icon/logoOsku2.svg"
                            alt="OSKU Logo"
                            width={120}
                            height={60}
                            priority
                            className="h-12 w-auto"
                        />
                    </div>

                    {/* Illustration Section */}
                    <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-6 drop-shadow-2xl">
                        <Image
                            src="/images/OskuImage2.svg"
                            alt="Desktop Only Illustration"
                            fill
                            className="object-contain"
                        />
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        <h1 className="text-2xl font-black text-[#3B8A51] tracking-tight">
                            Akses Terbatas!
                        </h1>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed px-4">
                            Halaman ini <span className="text-[#3B8A51] font-bold">hanya dapat dibuka melalui halaman desktop</span> untuk memastikan pengalaman terbaik dalam mengelola data.
                        </p>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm inline-block">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-xl bg-[#E2F2E7] flex items-center justify-center text-[#3B8A51]">
                                <i className="fas fa-desktop"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status Perangkat</p>
                                <p className="text-xs font-bold text-[#3B8A51]">Desktop-Ready Required</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Hint */}
                    <p className="text-[10px] text-gray-400 font-medium">
                        Silakan gunakan PC atau Laptop Anda untuk melanjutkan.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
