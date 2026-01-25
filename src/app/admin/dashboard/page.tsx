'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SidebarAdmin from '@/components/admin/SidebarAdmin';
import NavbarAdmin from '@/components/admin/NavbarAdmin';
import WasteChart from '@/components/shared/WasteChart';
import KonfirmasiLogout from '@/components/shared/konfirmasiLogout';
import YearPicker from '@/components/shared/YearPicker';
import ProfilAdmin from '@/components/admin/ProfilAdmin';
import BantuanContent from '@/components/landing/BantuanContent';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminDashboard() {
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        router.push('/');
    };

    // Read tab from URL query parameter
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'profil') {
            setActiveTab('profil');
        } else if (tabParam === 'bantuan') {
            setActiveTab('bantuan');
        }
    }, [searchParams]);

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

    // Chart data handling
    const defaultChartData = [
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

    const [saldoChartData, setSaldoChartData] = useState(defaultChartData);
    const [pencairanChartData, setPencairanChartData] = useState(defaultChartData);

    // Summary Stats State - Using Keys
    const [stats, setStats] = useState([
        { label: 'admin.dashboard.total_nasabah', value: '0', icon: '/icon/nasabah.svg' },
        { label: 'admin.dashboard.total_petugas', value: '0', icon: '/icon/Petugas.svg' },
        { label: 'admin.dashboard.total_income', value: 'Rp. 0', icon: '/icon/miniMoney.svg' },
        { label: 'admin.dashboard.total_withdraw', value: 'Rp. 0', icon: '/icon/Pencairan.svg' },
    ]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const startOfYear = `${selectedYear}-01-01`;
            const endOfYear = `${selectedYear}-12-31T23:59:59`;

            try {
                // 1. Fetch Counts (Filtered by Year)
                const { count: nasabahCount } = await supabase
                    .from('nasabah')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfYear)
                    .lte('created_at', endOfYear);

                const { count: petugasCount } = await supabase
                    .from('petugas')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startOfYear)
                    .lte('created_at', endOfYear);

                // 2. Fetch Total Pemasukan (Sum of Penyetoran) - Filtered by Year
                const { data: penyetoranData } = await supabase
                    .from('penyetoran')
                    .select('total_harga')
                    .gte('tanggal', startOfYear)
                    .lte('tanggal', endOfYear);

                const totalPemasukan = penyetoranData?.reduce((sum, item) => sum + (item.total_harga || 0), 0) || 0;

                // 3. Fetch Total Pencairan (Sum of Completed Withdrawals) - Filtered by Year
                const { data: pencairanData } = await supabase
                    .from('pencairan')
                    .select('jumlah')
                    .eq('status', 'completed')
                    .gte('tanggal_selesai', startOfYear)
                    .lte('tanggal_selesai', endOfYear);

                const totalPencairan = pencairanData?.reduce((sum, item) => sum + (item.jumlah || 0), 0) || 0;

                // Update Stats with KEYS
                setStats([
                    { label: 'admin.dashboard.new_nasabah', value: nasabahCount?.toString() || '0', icon: '/icon/nasabah.svg' },
                    { label: 'admin.dashboard.new_petugas', value: petugasCount?.toString() || '0', icon: '/icon/Petugas.svg' },
                    { label: 'admin.dashboard.total_income', value: `Rp. ${totalPemasukan.toLocaleString('id-ID')}`, icon: '/icon/miniMoney.svg' },
                    { label: 'admin.dashboard.total_withdraw', value: `Rp. ${totalPencairan.toLocaleString('id-ID')}`, icon: '/icon/Pencairan.svg' },
                ]);

                // 4. Chart Data (Filtered by Year)
                fetchChartData(startOfYear, endOfYear);

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };

        const fetchChartData = async (start: string, end: string) => {
            const newSaldoData = JSON.parse(JSON.stringify(defaultChartData));
            const newPencairanData = JSON.parse(JSON.stringify(defaultChartData));

            try {
                // 1. Fetch Total Saldo (Penyetoran) - Global
                const { data: penyetoranData } = await supabase
                    .from('penyetoran')
                    .select('total_harga, tanggal')
                    .gte('tanggal', start)
                    .lte('tanggal', end);

                if (penyetoranData) {
                    penyetoranData.forEach(item => {
                        if (!item.tanggal) return;
                        const date = new Date(item.tanggal);
                        newSaldoData[date.getMonth()].value += Number(item.total_harga) || 0;
                    });
                }

                // 2. Fetch Total Cair (Pencairan) - Global
                const { data: pencairanData } = await supabase
                    .from('pencairan')
                    .select('jumlah, tanggal_selesai')
                    .eq('status', 'completed')
                    .gte('tanggal_selesai', start)
                    .lte('tanggal_selesai', end);

                if (pencairanData) {
                    pencairanData.forEach(item => {
                        if (!item.tanggal_selesai) return;
                        const date = new Date(item.tanggal_selesai);
                        newPencairanData[date.getMonth()].value += Number(item.jumlah) || 0;
                    });
                }

                // Scale to Millions
                newSaldoData.forEach((d: any) => d.value = d.value / 1000000);
                newPencairanData.forEach((d: any) => d.value = d.value / 1000000);

                setSaldoChartData(newSaldoData);
                setPencairanChartData(newPencairanData);

            } catch (error) {
                console.error('Error fetching admin chart data:', error);
            }
        };

        fetchDashboardData();
    }, [selectedYear]);

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
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Page Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <Image src="/icon/Dashboard.svg" alt="Dashboard" width={24} height={24} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-primary">{t('admin.dashboard.title')}</h1>
                                </div>
                                <YearPicker
                                    selectedYear={selectedYear}
                                    onYearChange={setSelectedYear}
                                />
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Image src={stat.icon} alt={stat.label} width={20} height={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary opacity-60 uppercase tracking-wider">{t(stat.label)}</p>
                                            <p className="text-xl font-bold text-primary">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Detailed Charts Section */}
                            <div className="space-y-6 mt-8">
                                {/* Only Saldo charts for Admin */}

                                <WasteChart
                                    title={t('admin.dashboard.chart_balance')}
                                    unit="jt"
                                    initialData={saldoChartData}
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
                                    title={t('admin.dashboard.chart_withdraw')}
                                    unit="jt"
                                    initialData={pencairanChartData}
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
                    onConfirm={handleLogout}
                />
            )}
        </div>
    );
}
