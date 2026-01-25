'use client';

import Link from 'next/link';
import Image from 'next/image';
import BackToTop from '@/components/shared/BackToTop';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import KonfirmasiLogout from '@/components/shared/konfirmasiLogout';
import NavbarNasabah from '@/components/nasabah/NavbarNasabah';
import { useBerita } from '@/contexts/BeritaContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DetailBeritaPage() {
    const params = useParams();
    const router = useRouter();
    const { berita } = useBerita();
    const { nasabah, signOut } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [displayName, setDisplayName] = useState<string>('-');

    useEffect(() => {
        if (nasabah?.name) {
            setDisplayName(nasabah.name);
        } else {
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
        }
    }, [nasabah]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    // Find the specific news item by ID
    const newsItem = berita.find(item => item.id === params.id);

    // If news not found, show error
    if (!newsItem) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-12 text-center max-w-md">
                    <i className="fas fa-exclamation-circle text-5xl text-red-400 mb-4"></i>
                    <h1 className="text-2xl font-bold text-gray-700 mb-2">Berita Tidak Ditemukan</h1>
                    <p className="text-gray-400 mb-6">Berita yang Anda cari tidak ada atau sudah dihapus</p>
                    <Link href="/dashboard/berita" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full inline-block transition">
                        Kembali ke Daftar Berita
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <NavbarNasabah
                activeTab="dashboard"
                userName={displayName}
                setShowLogoutModal={setShowLogoutModal}
            />

            <main className="container mx-auto px-4 pt-6 pb-24 md:pb-8 max-w-5xl">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-xs text-primary-light mb-10">
                    <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <Link href="/dashboard/berita" className="hover:underline">Berita</Link>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <span className="font-bold text-primary">Detail</span>
                </div>

                {/* News Content Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                    <div className="bg-[#E9F2EC] px-6 py-3 flex items-center space-x-3">
                        <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
                            <Image src="/icon/megaphone.svg" alt="" width={14} height={14} className="brightness-0 invert" />
                        </div>
                        <h3 className="font-bold text-primary text-sm">{newsItem.judul}</h3>
                    </div>
                    <div className="p-8 md:p-12">
                        <div className="space-y-4 mb-10">
                            <p className="text-xs text-[#3D7A4D] font-medium leading-[1.8] whitespace-pre-line">
                                {newsItem.kontenLengkap}
                            </p>
                        </div>

                        <div className="pt-6">
                            <span className="text-[12px] text-primary font-bold">{newsItem.tanggal} | {newsItem.author}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-start">
                    <Link href="/dashboard/berita" className="flex items-center space-x-2 text-primary font-bold text-xs hover:underline">
                        <i className="fas fa-arrow-left"></i>
                        <span>Kembali ke daftar berita</span>
                    </Link>
                </div>
            </main>



            {showLogoutModal && (
                <KonfirmasiLogout onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
            )}

            {/* Dark Support Footer */}
            <footer className="bg-[#0B141F] pt-12 pb-6 px-4 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12">
                        {/* Logo Left */}
                        <div className="flex items-center">
                            <Image src="/icon/logoOsku3.svg" alt="OSKU Logo" width={140} height={50} className="h-12 w-auto brightness-0 invert" />
                        </div>

                        {/* Support Right */}
                        <div className="flex flex-col items-center md:items-end text-center md:text-right">
                            <h4 className="font-bold text-white mb-2 text-lg">Kontak support</h4>
                            <p className="text-gray-400 text-xs mb-4 max-w-[200px] leading-relaxed">
                                Jika terjadi kendala terkait sistem hubungi kontak berikut :
                            </p>
                            <div className="flex items-center text-primary-light">
                                <i className="far fa-envelope mr-2"></i>
                                <span className="text-xs font-medium">support@osku-banksampah.id</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center pt-6 border-t border-gray-800">
                        <p className="text-gray-500 text-[10px]">©2025 OSKU All right reserved.</p>
                    </div>
                </div>
            </footer>

            <BackToTop />
        </div>
    );
}
