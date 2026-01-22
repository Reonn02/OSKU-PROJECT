'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SidebarAdmin from '@/components/SidebarAdmin';
import NavbarAdmin from '@/components/NavbarAdmin';
import WasteChart from '@/components/WasteChart';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import YearPicker from '@/components/YearPicker';
import ProfilAdmin from '@/components/ProfilAdmin';
import BantuanContent from '@/components/BantuanContent';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';

// Summary stats - akan diambil dari database
const SUMMARY_STATS = [
    { label: 'Jumlah Nasabah', value: '0', icon: '/icon/nasabah.svg' },
    { label: 'Total Petugas', value: '0', icon: '/icon/Petugas.svg' },
    { label: 'Total Pemasukan', value: 'Rp. 0', icon: '/icon/miniMoney.svg' },
    { label: 'Total Pencairan', value: 'Rp. 0', icon: '/icon/Pencairan.svg' },
];

// Waste types - akan diambil dari database
const WASTE_TYPES: any[] = [];

// Bank sampah data - akan diambil dari database
const BANK_SAMPAH_DATA: any[] = [];

export default function AdminDashboard() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const router = useRouter();

    // Read tab from URL query parameter
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'profil') {
            setActiveTab('profil');
        } else if (tabParam === 'bantuan') {
            setActiveTab('bantuan');
        }
    }, [searchParams]);

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
        if (tab === 'nasabah') {
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
            router.push('/admin/prediksi');
        } else {
            setActiveTab(tab);
        }
    };

    // Chart data - akan diambil dari database
    const barChartData = [
        { label: 'JAN', value: 0 },
        { label: 'FEB', value: 0 },
        { label: 'MAR', value: 0 },
        { label: 'APR', value: 0 },
        { label: 'MAY', value: 0 },
        { label: 'JUN', value: 0 },
        { label: 'JUL', value: 0 },
        { label: 'AUG', value: 0 },
        { label: 'SEP', value: 0 },
        { label: 'OCT', value: 0 },
        { label: 'NOV', value: 0 },
        { label: 'DEC', value: 0 },
    ];

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
                    {activeTab === 'dashboard' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {/* Page Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <Image src="/icon/Dashboard.svg" alt="Dashboard" width={24} height={24} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
                                </div>
                                <YearPicker
                                    selectedYear={selectedYear}
                                    onYearChange={setSelectedYear}
                                />
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {SUMMARY_STATS.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Image src={stat.icon} alt={stat.label} width={20} height={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary opacity-60 uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-xl font-bold text-primary">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>



                            {/* Detailed Charts Section */}
                            <div className="space-y-8 mt-8">
                                {/* Only Saldo charts for Admin */}

                                <WasteChart
                                    title="Total Saldo Bank Sampah"
                                    unit="jt"
                                    initialData={barChartData}
                                    showWasteFilter={false}
                                    showBankSampahFilter={false}
                                    showExportButton={true}
                                    selectedYear={selectedYear}
                                    maxY={150}
                                    yAxisSteps={[
                                        { label: '150jt', value: 150 },
                                        { label: '100jt', value: 100 },
                                        { label: '75jt', value: 75 },
                                        { label: '50jt', value: 50 },
                                        { label: '25jt', value: 25 },
                                        { label: '0', value: 0 },
                                    ]}
                                />
                                <WasteChart
                                    title="Total Saldo Cair"
                                    unit="jt"
                                    initialData={barChartData}
                                    showWasteFilter={false}
                                    showBankSampahFilter={false}
                                    maxY={50}
                                    yAxisSteps={[
                                        { label: '50jt', value: 50 },
                                        { label: '40jt', value: 40 },
                                        { label: '30jt', value: 30 },
                                        { label: '20jt', value: 20 },
                                        { label: '10jt', value: 10 },
                                        { label: '0', value: 0 },
                                    ]}
                                    showExportButton={true}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'profil' && (
                        <ProfilAdmin />
                    )}

                    {activeTab === 'bantuan' && (
                        <BantuanContent role="admin" />
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
