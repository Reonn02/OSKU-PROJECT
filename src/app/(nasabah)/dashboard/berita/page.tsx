'use client';

import Link from 'next/link';
import Image from 'next/image';
import BackToTop from '@/components/BackToTop';
import { useState, useEffect } from 'react';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import NavbarNasabah from '@/components/NavbarNasabah';
import { useBerita } from '@/contexts/BeritaContext';

export default function BeritaPage() {
    const { berita } = useBerita();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [displayName, setDisplayName] = useState<string>('-');

    useEffect(() => {
        try {
            const userProfileStr = sessionStorage.getItem('userProfile');
            if (userProfileStr) {
                const userProfile = JSON.parse(userProfileStr);
                setDisplayName(userProfile.fullName || '-');
            }
        } catch (error) {
            console.error('Error reading user profile:', error);
            setDisplayName('-');
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <NavbarNasabah
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userName={displayName}
                setShowLogoutModal={setShowLogoutModal}
            />

            <main className="container mx-auto px-4 pt-6 pb-24 md:pb-8 max-w-5xl">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-xs text-primary-light mb-6">
                    <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <span className="font-bold text-primary">Berita</span>
                </div>



                {/* News Banner */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-10 flex flex-col md:flex-row justify-between items-center shadow-sm relative overflow-hidden min-h-[160px]">
                    <div className="z-10 text-center md:text-left">
                        <h3 className="text-primary font-bold text-xl sm:text-2xl mb-1 sm:mb-2 text-center md:text-left">Pantau Berita Terkini !</h3>
                        <p className="text-[16px] text-primary-light mb-4 sm:mb-6">Jangan sampai melewati informasi penting dari kami</p>
                    </div>
                    <div className="absolute right-0 bottom-0 pointer-events-none hidden md:flex w-1/3 h-full items-end justify-end">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[2] ">
                            <Image src="/images/imageBerita.svg" alt="" width={100} height={100} />
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-6 sm:mb-8">Berita terkini</h1>

                <div className="space-y-6 mb-12">
                    {berita.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
                            <i className="fas fa-newspaper text-5xl text-gray-300 mb-4"></i>
                            <p className="text-gray-400 font-medium">Belum ada berita tersedia</p>
                            <p className="text-gray-300 text-xs mt-2">Berita akan muncul di sini ketika admin menambahkan berita baru</p>
                        </div>
                    ) : (
                        berita.map((news) => (
                            <div key={news.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-[#E9F2EC] px-6 py-3 flex items-center space-x-3">
                                    <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                                        <Image src="/icon/megaphone.svg" alt="" width={14} height={14} className="brightness-0 invert" />
                                    </div>
                                    <h3 className="font-bold text-primary text-sm">{news.judul}</h3>
                                </div>
                                <div className="p-5 sm:p-8">
                                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mb-4 sm:mb-6">
                                        {news.ringkasan}
                                    </p>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <span className="text-[10px] text-primary font-medium">{news.tanggal} | {news.author}</span>
                                        <Link href={`/dashboard/berita/${news.id}`} className="bg-primary hover:bg-primary-dark text-white text-[10px] sm:text-xs font-medium py-2 sm:py-2.5 px-6 sm:px-8 rounded-xl transition shadow-sm w-full sm:w-auto text-center">
                                            Selengkapnya
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center space-x-2">
                    <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs flex items-center justify-center font-bold">1</button>
                    <button className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-50">2</button>
                    <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs flex items-center justify-center hover:bg-primary-dark transition">
                        <i className="fas fa-chevron-right text-[10px]"></i>
                    </button>
                </div>
            </main>



            {
                showLogoutModal && (
                    <KonfirmasiLogout onCancel={() => setShowLogoutModal(false)} />
                )
            }

            {/* Dark Support Footer */}
            <footer className="bg-[#0B141F] pt-12 pb-6 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col items-center gap-8 mb-12">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Image src="/icon/logoOsku3.svg" alt="OSKU Logo" width={140} height={50} className="h-12 w-auto brightness-0 invert" />
                        </div>

                        {/* Support Card */}
                        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-lg border border-gray-100 flex flex-col items-center text-center max-w-sm mx-auto relative z-10">
                            <h4 className="font-bold text-[#3B8A51] mb-2 text-xl">Kontak support</h4>
                            <p className="text-gray-500 text-xs mb-6 max-w-[220px] leading-relaxed">
                                Jika terjadi kendala terkait sistem hubungi kontak berikut :
                            </p>
                            <a href="tel:+620000000000" className="inline-flex items-center bg-[#3B8A51] hover:bg-[#2F6E41] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 group">
                                <i className="fas fa-phone-alt mr-3 text-xs group-hover:rotate-12 transition-transform"></i>
                                +620000000000
                            </a>
                        </div>
                    </div>

                    <div className="flex justify-center pt-6 border-t border-gray-800">
                        <p className="text-gray-500 text-[10px]">©2025 OSKU All right reserved.</p>
                    </div>
                </div>
            </footer>

            <BackToTop />
        </div >
    );
}
