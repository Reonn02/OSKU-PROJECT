'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarAdmin from '@/components/SidebarAdmin';
import NavbarAdmin from '@/components/NavbarAdmin';
import PrediksiAdmin from '@/components/PrediksiAdmin';
import KonfirmasiLogout from '@/components/konfirmasiLogout';

export default function PrediksiPage() {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const router = useRouter();

    const handleTabChange = (tab: string) => {
        if (tab === 'dashboard') {
            router.push('/admin/dashboard');
        } else if (tab === 'nasabah') {
            router.push('/admin/nasabah');
        } else if (tab === 'petugas') {
            router.push('/admin/petugas');
        } else if (tab === 'berita') {
            router.push('/admin/berita');
        } else if (tab === 'bank-sampah') {
            router.push('/admin/bank-sampah');
        } else if (tab === 'berita-kegiatan') {
            router.push('/admin/berita-kegiatan');
        } else if (tab === 'prediksi') {
            // Already on this page
        } else if (tab === 'profil') {
            router.push('/admin/dashboard?tab=profil');
        } else if (tab === 'bantuan') {
            router.push('/admin/dashboard?tab=bantuan');
        }
    };

    return (
        <div className="min-h-screen bg-tertiary font-sans text-gray-900 flex">
            {/* Sidebar */}
            <SidebarAdmin
                activeTab="prediksi"
                onTabChange={handleTabChange}
                isCollapsed={isSidebarCollapsed}
            />

            {/* Main Content */}
            <div className={`flex-grow ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col transition-all duration-300 ease-in-out`}>
                <NavbarAdmin
                    onLogout={() => setShowLogoutModal(true)}
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                <main className="p-6 lg:p-10 space-y-4 max-w-[1600px] mx-auto w-full">
                    <PrediksiAdmin />
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <KonfirmasiLogout
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}
        </div>
    );
}
