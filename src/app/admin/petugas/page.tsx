'use client';

import { useState, useEffect } from 'react';
import SidebarAdmin from '@/components/SidebarAdmin';
import NavbarAdmin from '@/components/NavbarAdmin';
import PetugasAdmin from '@/components/PetugasAdmin';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import { useRouter } from 'next/navigation';

export default function AdminPetugasPage() {
    const [activeTab, setActiveTab] = useState('petugas');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        router.push('/');
    };

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
        } else if (tab === 'berita') {
            router.push('/admin/berita');
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

                <main className="p-6 lg:p-10 space-y-6 max-w-[1600px] mx-auto w-full">
                    {activeTab === 'petugas' && (
                        <PetugasAdmin />
                    )}

                    {/* Placeholder for other tabs if they navigate back to this page */}
                    {activeTab !== 'petugas' && (
                        <div className="bg-white rounded-[32px] p-8 shadow-sm">
                            <h2 className="text-2xl font-bold text-primary mb-4 capitalize">{activeTab}</h2>
                            <p className="text-gray-500">{activeTab} management content</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <KonfirmasiLogout
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />
            )}
        </div>
    );
}
