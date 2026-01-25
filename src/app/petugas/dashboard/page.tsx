'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarPetugas from '@/components/petugas/SidebarPetugas';
import NavbarPetugas from '@/components/petugas/NavbarPetugas';
import WasteChart from '@/components/shared/WasteChart';
import KonfirmasiLogout from '@/components/shared/konfirmasiLogout';
import ProfilePetugas from '@/components/petugas/ProfilePetugas';
import NasabahPetugas from '@/components/petugas/NasabahPetugas';
import PersetujuanPetugas from '@/components/petugas/PersetujuanPetugas';
import PenyetoranPetugas from '@/components/petugas/PenyetoranPetugas';
import HargaSampahPetugas from '@/components/petugas/HargaSampahPetugas';
import LaporanPetugas from '@/components/petugas/LaporanPetugas';
import KonfirmasiPetugas from '@/components/petugas/Konfirmasi';
import BantuanContent from '@/components/landing/BantuanContent';
import YearPicker from '@/components/shared/YearPicker';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { usePenyetoran } from '@/contexts/PenyetoranContext';
import { getAllNasabah, getTotalSaldo, getTotalNasabah, formatSaldo, getNasabahByBankSampah } from '@/data/nasabahData';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PetugasDashboard() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'dashboard';
    const [activeTab, setActiveTab] = useState(initialTab);
    const router = useRouter();

    // Sync tab with URL parameter changes
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('petugasLoggedIn');
        localStorage.removeItem('petugasData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        router.push('/');
    };
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [priceSortField, setPriceSortField] = useState<'type' | 'per' | 'price'>('type');
    const [priceSortOrder, setPriceSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filterWasteType, setFilterWasteType] = useState<string>('Semua');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showAllWasteTypes, setShowAllWasteTypes] = useState(false);
    const [petugasBankId, setPetugasBankId] = useState<string | null>(null);
    const [selectedWasteFilter, setSelectedWasteFilter] = useState('');

    // Get banks from context
    const { banks } = useBankSampah();

    // Get penyetoran from context
    const { penyetoranList, fetchPenyetoranByBank } = usePenyetoran();

    // Load petugas bank ID from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const petugasData = JSON.parse(savedData);
                setPetugasBankId(petugasData.bankSampahId);
                setPetugasBankName(petugasData.bankSampahNama);
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, []);

    // Fetch penyetoran when bank ID is available
    useEffect(() => {
        if (petugasBankId) {
            fetchPenyetoranByBank(petugasBankId);
        }
    }, [petugasBankId, fetchPenyetoranByBank]);

    // Generate dynamic colors for chart segments using HSL for infinite scalability
    const generateColors = (count: number): string[] => {
        const baseColors = [
            '#D9F2E1', // Light green
            '#378142', // Medium green
            '#135B1D', // Dark green
            '#38A169', // Bright green
            '#68D391', // Lighter green
            '#276749', // Deep green
            '#9AE6B4', // Pale green
            '#22543D', // Forest green
            '#48BB78', // Fresh green
            '#2F855A', // Rich green
        ];

        if (count <= baseColors.length) {
            return baseColors.slice(0, count);
        }

        // Generate additional colors using HSL if more than base colors needed
        const colors = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
            const hue = 120 + ((i - baseColors.length) * 30) % 60; // Stay in green range (90-150)
            const saturation = 40 + (i % 4) * 15;
            const lightness = 30 + (i % 5) * 12;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    };

    // Load dynamic summary data from penyetoran and nasabah
    const [summaryStats, setSummaryStats] = useState([
        { label: 'petugas.dashboard.total_nasabah', value: '0', icon: '/icon/nasabah.svg' },
        { label: 'petugas.dashboard.total_balance', value: 'Rp. 0', icon: '/icon/miniMoney.svg' },
        { label: 'petugas.dashboard.total_withdraw', value: 'Rp. 0', icon: '/icon/Pencairan.svg' },
        { label: 'petugas.dashboard.total_deposit', value: '0', icon: '/icon/LogoPenyetoran.svg' },
    ]);

    const [petugasBankName, setPetugasBankName] = useState<string | null>(null);

    // Penyetoran values from database (amount per waste type)
    const [penyetoranValues, setPenyetoranValues] = useState<Record<string, { value: number; unit: string }>>({});

    // Derive wasteTypes dynamically from BankSampahContext - ONLY from current petugas's bank
    const wasteTypes = useMemo(() => {
        // Get only the current petugas's bank
        const currentBank = banks.find(bank => bank.id === petugasBankId);

        if (!currentBank) return [];

        return (currentBank.wasteTypes || []).map(wt => ({
            label: wt.nama,
            desc: `Total penyetoran sampah ${wt.nama.toLowerCase()} seluruh nasabah`,
            value: penyetoranValues[wt.nama]?.value?.toString() || '0',
            unit: wt.satuan
        }));
    }, [banks, penyetoranValues, petugasBankId]);

    // Load penyetoran data from database and nasabah data
    useEffect(() => {
        const loadSummaryData = async () => {
            try {
                // Get dynamic nasabah data filtered by bank name
                let totalNasabah = 0;
                let totalSaldo = 0;

                if (petugasBankName) {
                    const nasabahList = await getNasabahByBankSampah(petugasBankName);
                    totalNasabah = nasabahList.length;
                    totalSaldo = nasabahList.reduce((acc, curr) => acc + curr.saldo, 0);
                } else {
                    // Fallback if no bank name (though ideally shouldn't happen for logged in petugas with bank)
                    totalNasabah = await getTotalNasabah();
                    totalSaldo = await getTotalSaldo();
                }

                // Filter penyetoran by year
                const penyetoranFiltered = penyetoranList.filter(item => {
                    if (!item.tanggal) return false;
                    const d = new Date(item.tanggal);
                    return d.getFullYear() === selectedYear;
                });

                // Calculate total penyetoran from filtered list
                const totalPenyetoran = penyetoranFiltered.length;

                // Also calculate Total Saldo from FILTERED transactions (Revenue for the year)
                // instead of total user balance (which is static/current).
                // This makes the Dashboard consistent with the year filter.
                const totalSaldoFiltered = penyetoranFiltered.reduce((acc, curr) => acc + (Number(curr.total_harga) || 0), 0);
                const formattedSaldo = formatSaldo(totalSaldoFiltered);

                // Calculate Total Pencairan dynamically for the SELECTED YEAR
                let totalPencairanValue = 0;
                if (petugasBankId) {
                    const startOfYear = `${selectedYear}-01-01`;
                    const endOfYear = `${selectedYear}-12-31T23:59:59`;

                    const { data: pencairanData } = await supabase
                        .from('pencairan')
                        .select('jumlah')
                        .eq('bank_sampah_id', petugasBankId)
                        .eq('status', 'completed')
                        .gte('tanggal_selesai', startOfYear)
                        .lte('tanggal_selesai', endOfYear);

                    if (pencairanData) {
                        totalPencairanValue = pencairanData.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
                    }
                }

                // Calculate penyetoran values per waste type (using filtered list)
                const values: Record<string, { value: number; unit: string }> = {};
                penyetoranFiltered.forEach((item) => {
                    const wasteType = item.waste_type_name || 'Unknown';
                    if (!values[wasteType]) {
                        values[wasteType] = { value: 0, unit: 'kg' };
                    }
                    values[wasteType].value += item.berat || 0;
                });
                setPenyetoranValues(values);

                // Update summary stats with dynamic values
                setSummaryStats([
                    { label: 'petugas.dashboard.total_nasabah', value: totalNasabah.toString(), icon: '/icon/nasabah.svg' },
                    { label: 'petugas.dashboard.total_balance', value: formattedSaldo, icon: '/icon/miniMoney.svg' },
                    { label: 'petugas.dashboard.total_withdraw', value: formatSaldo(totalPencairanValue), icon: '/icon/Pencairan.svg' },
                    { label: 'petugas.dashboard.total_deposit', value: totalPenyetoran.toString(), icon: '/icon/LogoPenyetoran.svg' },
                ]);
            } catch (error) {
                console.error('Error loading summary data:', error);
            }
        };

        loadSummaryData();
    }, [penyetoranList, petugasBankName, petugasBankId, selectedYear]);

    // Derive priceList dynamically from BankSampahContext - ONLY from current petugas's bank
    const priceList = useMemo(() => {
        // Get only the current petugas's bank
        const currentBank = banks.find(bank => bank.id === petugasBankId);

        if (!currentBank) return [];

        return (currentBank.wasteTypes || []).map(wt => ({
            type: wt.nama,
            per: wt.satuan.charAt(0).toUpperCase() + wt.satuan.slice(1), // Capitalize first letter
            price: `Rp. ${wt.hargaPerSatuan.toLocaleString('id-ID')}`,
            priceNum: wt.hargaPerSatuan
        }));
    }, [banks, petugasBankId]);

    const sortedPriceList = [...priceList].sort((a, b) => {
        if (priceSortField === 'price') {
            return priceSortOrder === 'asc' ? a.priceNum - b.priceNum : b.priceNum - a.priceNum;
        }
        const valA = a[priceSortField].toLowerCase();
        const valB = b[priceSortField].toLowerCase();
        if (priceSortOrder === 'asc') return valA.localeCompare(valB);
        return valB.localeCompare(valA);
    });

    const toggleSort = (field: 'type' | 'per' | 'price') => {
        if (priceSortField === field) {
            setPriceSortOrder(priceSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setPriceSortField(field);
            setPriceSortOrder('asc');
        }
    };

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

    const [penyetoranChartData, setPenyetoranChartData] = useState(defaultChartData);
    const [saldoChartData, setSaldoChartData] = useState(defaultChartData);
    const [pencairanChartData, setPencairanChartData] = useState(defaultChartData);

    useEffect(() => {
        const processCharts = async () => {
            // Clone default structure deeply
            const newPenyetoranData = JSON.parse(JSON.stringify(defaultChartData));
            const newSaldoData = JSON.parse(JSON.stringify(defaultChartData));
            const newPencairanData = JSON.parse(JSON.stringify(defaultChartData));

            // 1. Process Penyetoran (Weight & Money In)
            if (penyetoranList && penyetoranList.length > 0) {
                penyetoranList.forEach(item => {
                    if (!item.tanggal) return;
                    const date = new Date(item.tanggal);
                    if (date.getFullYear() === selectedYear) {
                        const monthIdx = date.getMonth();

                        // Filter logic for Weight Chart
                        if (!selectedWasteFilter || item.waste_type_name === selectedWasteFilter) {
                            newPenyetoranData[monthIdx].value += Number(item.berat) || 0;
                        }

                        // Total Money includes all unless we want to filter that too. 
                        // Usually "Total Saldo" implies everything, but let's keep it consistent:
                        // If we filter weight, we arguably should filter money too IF the chart had a filter.
                        // But the second chart has showWasteFilter={false}, so it should probably show TOTAL.
                        // So we ONLY filter newPenyetoranData.
                        newSaldoData[monthIdx].value += Number(item.total_harga) || 0;
                    }
                });
            }

            // 2. Fetch and Process Pencairan (Withdrawals)
            if (petugasBankId) {
                try {
                    const { data: pencairanData } = await supabase
                        .from('pencairan')
                        .select('jumlah, tanggal_selesai, status')
                        .eq('bank_sampah_id', petugasBankId)
                        .eq('status', 'completed');

                    if (pencairanData) {
                        pencairanData.forEach((item: any) => {
                            if (!item.tanggal_selesai) return;
                            const date = new Date(item.tanggal_selesai);
                            if (date.getFullYear() === selectedYear) {
                                const monthIdx = date.getMonth();
                                newPencairanData[monthIdx].value += Number(item.jumlah) || 0;
                            }
                        });
                    }
                } catch (err) {
                    console.error("Error fetching pencairan chart data", err);
                }
            }

            // Scale Money Values to Millions (jt)
            newSaldoData.forEach((d: any) => d.value = d.value / 1000000);
            newPencairanData.forEach((d: any) => d.value = d.value / 1000000);

            setPenyetoranChartData(newPenyetoranData);
            setSaldoChartData(newSaldoData);
            setPencairanChartData(newPencairanData);
        };

        processCharts();
    }, [penyetoranList, selectedYear, petugasBankId, selectedWasteFilter]);

    return (
        <div className="min-h-screen bg-tertiary font-sans text-gray-900 flex">
            {/* Sidebar */}
            <SidebarPetugas
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isCollapsed={isSidebarCollapsed}
            />

            {/* Main Content */}
            <div className={`flex-grow ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col transition-all duration-300 ease-in-out`}>
                <NavbarPetugas
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
                                    <h1 className="text-2xl font-bold text-primary">{t('petugas.dashboard.title')}</h1>
                                </div>
                                <YearPicker
                                    selectedYear={selectedYear}
                                    onYearChange={setSelectedYear}
                                />
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {summaryStats.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Image src={stat.icon} alt={stat.label} width={20} height={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{t(stat.label)}</p>
                                            <p className="text-xl font-bold text-primary">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Waste Breakdown & Donut Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                                {/* Waste Breakdown (Left) - Top 5 only */}
                                <div className="lg:col-span-7 space-y-4">
                                    {(() => {
                                        // Sort by value and take top 5
                                        const sortedWasteTypes = [...wasteTypes]
                                            .map(w => ({ ...w, numValue: parseInt(w.value) || 0 }))
                                            .sort((a, b) => b.numValue - a.numValue);

                                        const displayWasteTypes = sortedWasteTypes.slice(0, 5);
                                        const hasMore = sortedWasteTypes.length > 5;

                                        return (
                                            <>
                                                {displayWasteTypes.map((waste) => (
                                                    <div key={waste.label} className="rounded-[32px] shadow-[0_8px_30_rgb(0,0,0,0.04)] flex items-center overflow-hidden group hover:shadow-md transition-all h-[100px] cursor-pointer">
                                                        <div className="w-[45%] h-full bg-primary-light flex flex-col justify-center px-8 text-white relative rounded-l-[32px] shadow-[-10px_0_20px_rgba(0,0,0,0.1)]">
                                                            <p className="font-bold text-lg mb-1">{waste.label}</p>
                                                            <p className="text-[10px] opacity-80 leading-tight max-w-[150px]">{waste.desc}</p>
                                                        </div>
                                                        <div className="w-[55%] h-full flex items-center justify-start px-10 bg-white">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-2xl font-bold text-primary">{waste.value}</span>
                                                                <span className="text-xs font-bold text-primary opacity-60">{waste.unit}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {hasMore && (
                                                    <button
                                                        onClick={() => setShowAllWasteTypes(true)}
                                                        className="w-full py-4 text-center text-primary font-bold text-sm hover:bg-tertiary/50 rounded-2xl transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <i className="fas fa-plus-circle"></i>
                                                        {t('petugas.dashboard.all_waste_types')} ({sortedWasteTypes.length} {t('common.unit').toLowerCase()})
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Sumber Sampah Chart (Right) */}
                                <div className="lg:col-span-5 bg-white rounded-[64px]shadow-sm flex flex-col items-center">
                                    <div className="w-full bg-primary-light py-4 rounded-t-2xl mb-8">
                                        <h3 className="text-center text-white font-bold">{t('petugas.dashboard.waste_source')}</h3>
                                    </div>

                                    {/* Dynamic Doughnut Chart Calculation */}
                                    {(() => {
                                        // Sort waste types by value (descending) and filter non-zero
                                        const sortedWasteTypes = [...wasteTypes]
                                            .map(w => ({ ...w, numValue: parseInt(w.value) || 0 }))
                                            .filter(w => w.numValue > 0)
                                            .sort((a, b) => b.numValue - a.numValue);

                                        // Take top 5 for display
                                        const displayWasteTypes = sortedWasteTypes.slice(0, 5);

                                        // Calculate total and percentages
                                        const total = displayWasteTypes.reduce((acc, curr) => acc + curr.numValue, 0);

                                        if (total === 0) {
                                            return (
                                                <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                                                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400 text-sm font-medium">Belum ada data</span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        let currentAngle = 0;
                                        const colors = generateColors(displayWasteTypes.length);

                                        const chartData = displayWasteTypes.map((waste, index) => {
                                            const value = waste.numValue;
                                            const percentage = (value / total) * 100;
                                            const angle = (value / total) * 360;
                                            const color = colors[index];

                                            const segment = {
                                                percentage,
                                                angle,
                                                startAngle: currentAngle,
                                                color,
                                                label: Math.round(percentage) + '%',
                                                wasteLabel: waste.label
                                            };

                                            currentAngle += angle;
                                            return segment;
                                        });

                                        const gradientString = chartData.map((d, i) => {
                                            const start = chartData.slice(0, i).reduce((sum, item) => sum + item.percentage, 0);
                                            const end = start + d.percentage;
                                            return `${d.color} ${start}% ${end}%`;
                                        }).join(', ');

                                        return (
                                            <div className="relative w-64 h-64 mb-8">
                                                {/* Chart */}
                                                <div
                                                    className="w-full h-full rounded-full"
                                                    style={{
                                                        background: `conic-gradient(${gradientString})`
                                                    }}
                                                ></div>

                                                {/* Inner White Circle (Donut) */}
                                                <div className="absolute inset-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                                </div>

                                                {/* Labels */}
                                                {chartData.map((data, i) => {
                                                    const centerAngle = chartData.slice(0, i).reduce((sum, item) => sum + item.angle, 0) + (data.angle / 2);
                                                    const left = 50 + (Math.cos((centerAngle - 90) * Math.PI / 180) * 38);
                                                    const top = 50 + (Math.sin((centerAngle - 90) * Math.PI / 180) * 38);

                                                    return (
                                                        <span
                                                            key={i}
                                                            className="absolute text-xs font-bold text-primary bg-white/80 px-1 py-0.5 rounded shadow-sm backdrop-blur-[1px]"
                                                            style={{
                                                                left: `${left}%`,
                                                                top: `${top}%`,
                                                                transform: 'translate(-50%, -50%)'
                                                            }}
                                                        >
                                                            {data.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Dynamic Legend */}
                                    {(() => {
                                        // Sort and get top 5 with values > 0
                                        const sortedWasteTypes = [...wasteTypes]
                                            .map(w => ({ ...w, numValue: parseInt(w.value) || 0 }))
                                            .filter(w => w.numValue > 0)
                                            .sort((a, b) => b.numValue - a.numValue);

                                        const displayWasteTypes = sortedWasteTypes.slice(0, 5);
                                        const hasMore = sortedWasteTypes.length > 5;
                                        const colors = generateColors(displayWasteTypes.length);

                                        if (displayWasteTypes.length === 0) {
                                            return (
                                                <p className="text-gray-400 text-xs mb-4">Belum ada data jenis sampah</p>
                                            );
                                        }

                                        return (
                                            <>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                                                    {displayWasteTypes.map((waste, index) => (
                                                        <div key={waste.label} className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: colors[index] }}
                                                            ></div>
                                                            <span className="text-xs font-bold text-primary truncate">{waste.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {hasMore && (
                                                    <button
                                                        onClick={() => setShowAllWasteTypes(true)}
                                                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                                                    >
                                                        <i className="fas fa-plus-circle"></i>
                                                        Lihat Semua ({sortedWasteTypes.length} jenis)
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Bar Charts Section */}
                            <div className="space-y-6 mt-8">
                                <WasteChart
                                    title={t('petugas.dashboard.total_deposit_waste')}
                                    unit="kg"
                                    initialData={penyetoranChartData}
                                    showWasteFilter={true}
                                    onWasteTypeChange={setSelectedWasteFilter}
                                    maxY={125}
                                    yAxisSteps={[
                                        { label: '125kg', value: 125 },
                                        { label: '100kg', value: 100 },
                                        { label: '75kg', value: 75 },
                                        { label: '50kg', value: 50 },
                                        { label: '25kg', value: 25 },
                                        { label: '0', value: 0 },
                                    ]}
                                    showExportButton={true}
                                />
                                <WasteChart
                                    title={t('petugas.dashboard.total_balance_collected')}
                                    unit="jt"
                                    initialData={saldoChartData}
                                    showWasteFilter={false}
                                    maxY={150}
                                    yAxisSteps={[
                                        { label: '150jt', value: 150 },
                                        { label: '100jt', value: 100 },
                                        { label: '75jt', value: 75 },
                                        { label: '50jt', value: 50 },
                                        { label: '25jt', value: 25 },
                                        { label: '0', value: 0 },
                                    ]}
                                    showExportButton={true}
                                />
                                <WasteChart
                                    title={t('admin.dashboard.chart_withdraw')}
                                    unit="jt"
                                    initialData={pencairanChartData}
                                    showWasteFilter={false}
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

                            {/* Bottom Row: Price List Only */}
                            <div className="mb-10 mt-8">
                                {/* Price List */}
                                <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-primary flex items-center gap-2 text-xl">
                                            <Image src="/icon/pricetag.svg" alt="Price" width={24} height={24} /> {t('petugas.dashboard.waste_price_list')}
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('harga-sampah')}
                                            className="text-xs text-primary font-bold px-6 py-2.5 rounded-full hover:bg-primary hover:text-white bg-tertiary cursor-pointer transition-all shadow-sm"
                                        >
                                            {t('petugas.dashboard.manage_price')}
                                        </button>
                                    </div>
                                    <div className="overflow-hidden border border-[#E2F2E7] rounded-3xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#E2F2E7] text-[#3B8A51] font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('type')}>
                                                        <div className="flex items-center justify-between">
                                                            {t('common.waste_type')} <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'type' ? 'opacity-100' : ''}`}></i>
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('per')}>
                                                        <div className="flex items-center justify-between">
                                                            {t('common.unit')} <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'per' ? 'opacity-100' : ''}`}></i>
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('price')}>
                                                        <div className="flex items-center justify-between">
                                                            {t('common.price')} <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'price' ? 'opacity-100' : ''}`}></i>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {sortedPriceList.map((price, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-8 py-6 font-bold text-[#3B8A51] text-base">{price.type}</td>
                                                        <td className="px-8 py-6 text-gray-500 font-medium">{price.per}</td>
                                                        <td className="px-8 py-6 font-bold text-[#3B8A51] text-base">{price.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profil' && <ProfilePetugas />}
                    {activeTab === 'nasabah' && <NasabahPetugas />}
                    {activeTab === 'persetujuan' && <PersetujuanPetugas />}
                    {activeTab === 'konfirmasi' && <KonfirmasiPetugas />}
                    {activeTab === 'penyetoran' && <PenyetoranPetugas />}
                    {activeTab === 'harga-sampah' && <HargaSampahPetugas />}
                    {activeTab === 'laporan' && <LaporanPetugas />}
                    {activeTab === 'bantuan' && <BantuanContent role="petugas" />}
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <KonfirmasiLogout
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />
            )}

            {/* All Waste Types Modal */}
            {showAllWasteTypes && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-primary px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Semua Jenis Sampah</h3>
                            <button
                                onClick={() => setShowAllWasteTypes(false)}
                                className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {(() => {
                                const sortedWasteTypes = [...wasteTypes]
                                    .map(w => ({ ...w, numValue: parseInt(w.value) || 0 }))
                                    .sort((a, b) => b.numValue - a.numValue);

                                const colors = generateColors(sortedWasteTypes.length);

                                return (
                                    <div className="space-y-3">
                                        {sortedWasteTypes.map((waste, index) => (
                                            <div key={waste.label} className="flex items-center justify-between p-4 bg-tertiary/30 rounded-xl hover:bg-tertiary/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: colors[index] }}
                                                    ></div>
                                                    <div>
                                                        <p className="font-bold text-primary">{waste.label}</p>
                                                        <p className="text-xs text-gray-500">{waste.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary text-lg">{waste.value}</p>
                                                    <p className="text-xs text-gray-500">{waste.unit}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowAllWasteTypes(false)}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


