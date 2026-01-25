'use client';

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import BackToTop from "@/components/shared/BackToTop";
import { useBankSampah } from '@/contexts/BankSampahContext';
import Image from "next/image";
import { useEffect, useState } from 'react';



// Helper to check if open
const checkOperationalStatus = (openTime: string, closeTime: string) => {
    // Current time in WIB (UTC+7)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wibTime = new Date(utc + (3600000 * 7));

    const currentHour = wibTime.getHours();
    const currentMinute = wibTime.getMinutes();
    const currentDay = wibTime.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Parse operating hours (Format HH:mm)
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    // Check if weekend (Sunday) - Assuming closed on Sunday, modify if needed
    if (currentDay === 0) {
        return false;
    }

    const currentTimeValue = currentHour * 60 + currentMinute;
    const openTimeValue = openH * 60 + openM;
    const closeTimeValue = closeH * 60 + closeM;

    return currentTimeValue >= openTimeValue && currentTimeValue < closeTimeValue;
};

export default function LokasiPage() {
    const { banks } = useBankSampah();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [scrollPercentage, setScrollPercentage] = useState(0);

    useEffect(() => {
        // Set initial time and update every minute to keep status fresh
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const wibTime = new Date(utc + (3600000 * 7));
            setCurrentTime(wibTime);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleKontakLayanan = (kontakLayanan?: string) => {
        if (kontakLayanan) {
            // Format nomor telepon untuk WhatsApp (menghapus karakter non-digit)
            const phoneNumber = kontakLayanan.replace(/\D/g, '');
            // Tambahkan kode negara Indonesia jika belum ada
            const formattedPhone = phoneNumber.startsWith('62') ? phoneNumber : '62' + phoneNumber.replace(/^0/, '');
            const whatsappUrl = `https://wa.me/${formattedPhone}`;
            window.open(whatsappUrl, '_blank');
        } else {
            alert('Nomor kontak layanan belum tersedia untuk bank sampah ini.');
        }
    };

    return (
        <div className="font-sans antialiased text-gray-900 bg-white">
            <Navbar />
            {/* Main Content */}
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Lokasi Bank Sampah</h1>
                        <p className="text-primary max-w-2xl mx-auto">Temukan lokasi bank sampah terdekat di sekitar Anda</p>
                    </div>

                    {/* Location Cards */}
                    <div className="mb-12">
                        {/* Using Grid for neater layout instead of horizontal scroll for better visibility on desktop, match screenshot roughly */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {banks.length === 0 ? (
                                <div className="col-span-full text-center py-20 text-gray-400">
                                    <i className="fas fa-store text-5xl mb-4"></i>
                                    <p className="font-bold">Belum ada bank sampah terdaftar</p>
                                </div>
                            ) : (
                                banks.map((loc) => {
                                    const isOpen = checkOperationalStatus(loc.openTime, loc.closeTime);
                                    return (
                                        <div key={loc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                                            <div className="h-36 bg-gray-100 relative flex items-center justify-center">
                                                <Image src={loc.image} alt={loc.nama} width={200} height={144} className="w-auto h-28 object-contain" />
                                                <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow">
                                                    <i className="fas fa-location-dot text-primary"></i>
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-bold text-primary leading-tight pr-2">{loc.nama}</h3>
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded ${isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {isOpen ? 'Buka' : 'Tutup'}
                                                    </span>
                                                </div>

                                                <p className="text-gray-500 text-sm mb-4">{loc.alamat}</p>

                                                <div className="mt-auto">
                                                    <div className="flex items-center text-xs text-gray-500 mb-4">
                                                        <i className="far fa-clock mr-2 text-primary"></i>
                                                        <span>{loc.openDay} - {loc.closeDay} : {loc.openTime} - {loc.closeTime}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleKontakLayanan(loc.kontakLayanan)}
                                                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-[64px] transition shadow-sm group"
                                                    >
                                                        <i className="fab fa-whatsapp text-lg group-hover:scale-110 transition-transform cursor-pointer"></i>
                                                        <span>Kontak Layanan</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
