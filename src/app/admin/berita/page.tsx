'use client';

import { useState, useEffect } from 'react';
import SidebarAdmin from '@/components/SidebarAdmin';
import NavbarAdmin from '@/components/NavbarAdmin';
import BeritaAdmin from '@/components/BeritaAdmin';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import { useRouter } from 'next/navigation';

export default function AdminBeritaPage() {
    const [activeTab, setActiveTab] = useState('berita');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const router = useRouter();

    // TEMPORARY: Commented for dev access
    /*
    useEffect(() => {
        // Check if user is logged in as admin
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userRole = localStorage.getItem('userRole');

        if (!isLoggedIn || userRole !== 'admin') {
            router.push('/');
        }
    }, [router]);
    */

    const handleTabChange = (tab: string) => {
        if (tab === 'dashboard') {
            router.push('/admin/dashboard');
        } else if (tab === 'nasabah') {
            router.push('/admin/nasabah');
        } else if (tab === 'petugas') {
            router.push('/admin/petugas');
        } else if (tab === 'bank-sampah') {
            router.push('/admin/bank-sampah');
        } else if (tab === 'berita-kegiatan') {
            router.push('/admin/berita-kegiatan');
        } else if (tab === 'prediksi') {
            router.push('/admin/prediksi');
        } else if (tab === 'profil') {
            router.push('/admin/dashboard?tab=profil');
        } else if (tab === 'bantuan') {
            router.push('/admin/dashboard?tab=bantuan');
        } else {
            setActiveTab(tab);
        }
    };

    return (
        <div className="min-h-screen bg-tertiary font-sans text-gray-900 flex">
            {/* Sidebar */}
            <SidebarAdmin
                activeTab={activeTab}
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
                    {activeTab === 'berita' && (
                        <BeritaAdmin />
                    )}

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
