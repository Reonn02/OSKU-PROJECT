'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import SidebarPetugas from '@/components/SidebarPetugas';
import NavbarPetugas from '@/components/NavbarPetugas';
import WasteChart from '@/components/WasteChart';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import ProfilePetugas from '@/components/ProfilePetugas';
import NasabahPetugas from '@/components/NasabahPetugas';
import PersetujuanPetugas from '@/components/PersetujuanPetugas';
import PenyetoranPetugas from '@/components/PenyetoranPetugas';
import HargaSampahPetugas from '@/components/HargaSampahPetugas';
import LaporanPetugas from '@/components/LaporanPetugas';
import KonfirmasiPetugas from '@/components/Konfirmasi';
import BantuanContent from '@/components/BantuanContent';
import YearPicker from '@/components/YearPicker';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { getAllNasabah, getTotalSaldo, getTotalNasabah, formatSaldo } from '@/data/nasabahData';

export default function PetugasDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [priceSortField, setPriceSortField] = useState<'type' | 'per' | 'price'>('type');
    const [priceSortOrder, setPriceSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filterWasteType, setFilterWasteType] = useState<string>('Semua');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showAllWasteTypes, setShowAllWasteTypes] = useState(false);

    // Get banks from context
    const { banks } = useBankSampah();

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
        { label: 'Jumlah Nasabah', value: '0', icon: '/icon/nasabah.svg' },
        { label: 'Total Saldo', value: 'Rp. 0', icon: '/icon/miniMoney.svg' },
        { label: 'Total Pencairan', value: 'Rp. 0', icon: '/icon/Pencairan.svg' },
        { label: 'Total Penyetoran', value: '0', icon: '/icon/LogoPenyetoran.svg' },
    ]);

    // Penyetoran values from localStorage (amount per waste type)
    const [penyetoranValues, setPenyetoranValues] = useState<Record<string, { value: number; unit: string }>>({});

    // The current petugas's bank ID (hardcoded for now - in production would come from auth)
    const CURRENT_PETUGAS_BANK_ID = '1'; // Bank Sampah PPSU Kelurahan Ciracas

    // Derive wasteTypes dynamically from BankSampahContext - ONLY from current petugas's bank
    const wasteTypes = useMemo(() => {
        // Get only the current petugas's bank
        const currentBank = banks.find(bank => bank.id === CURRENT_PETUGAS_BANK_ID);

        if (!currentBank) return [];

        return (currentBank.wasteTypes || []).map(wt => ({
            label: wt.nama,
            desc: `Total penyetoran sampah ${wt.nama.toLowerCase()} seluruh nasabah`,
            value: penyetoranValues[wt.nama]?.value?.toString() || '0',
            unit: wt.satuan
        }));
    }, [banks, penyetoranValues]);

    // Load penyetoran data from localStorage and nasabah data
    useEffect(() => {
        const loadSummaryData = async () => {
            try {
                // Get dynamic nasabah data (now async)
                const totalNasabah = await getTotalNasabah();
                const totalSaldo = await getTotalSaldo();
                const formattedSaldo = formatSaldo(totalSaldo);

                const summary = localStorage.getItem('penyetoran_summary');
                let totalPenyetoran = 0;

                if (summary) {
                    const data = JSON.parse(summary);

                    // Extract penyetoran values for each waste type
                    const values: Record<string, { value: number; unit: string }> = {};
                    Object.keys(data).forEach(key => {
                        if (key !== 'totalPenyetoran' && key !== 'totalPemasukan' && data[key]?.value !== undefined) {
                            values[key] = {
                                value: data[key].value,
                                unit: data[key].unit || 'kg'
                            };
                        }
                    });
                    setPenyetoranValues(values);
                    totalPenyetoran = data.totalPenyetoran || 0;
                }

                // Update summary stats with dynamic values
                setSummaryStats([
                    { label: 'Jumlah Nasabah', value: totalNasabah.toString(), icon: '/icon/nasabah.svg' },
                    { label: 'Total Saldo', value: formattedSaldo, icon: '/icon/miniMoney.svg' },
                    { label: 'Total Pencairan', value: 'Rp. 0', icon: '/icon/Pencairan.svg' },
                    { label: 'Total Penyetoran', value: totalPenyetoran.toString(), icon: '/icon/LogoPenyetoran.svg' },
                ]);
            } catch (error) {
                console.error('Error loading summary data:', error);
            }
        };

        loadSummaryData();
        const interval = setInterval(loadSummaryData, 2000);
        return () => clearInterval(interval);
    }, []);

    // Derive priceList dynamically from BankSampahContext - ONLY from current petugas's bank
    const priceList = useMemo(() => {
        // Get only the current petugas's bank
        const currentBank = banks.find(bank => bank.id === CURRENT_PETUGAS_BANK_ID);

        if (!currentBank) return [];

        return (currentBank.wasteTypes || []).map(wt => ({
            type: wt.nama,
            per: wt.satuan.charAt(0).toUpperCase() + wt.satuan.slice(1), // Capitalize first letter
            price: `Rp. ${wt.hargaPerSatuan.toLocaleString('id-ID')}`,
            priceNum: wt.hargaPerSatuan
        }));
    }, [banks]);

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
                                {summaryStats.map((stat) => (
                                    <div key={stat.label} className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Image src={stat.icon} alt={stat.label} width={20} height={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-xl font-bold text-primary">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Waste Breakdown & Donut Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
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
                                                        Lihat Semua Jenis Sampah ({sortedWasteTypes.length} jenis)
                                                    </button>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Sumber Sampah Chart (Right) */}
                                <div className="lg:col-span-5 bg-white rounded-[64px]shadow-sm flex flex-col items-center">
                                    <div className="w-full bg-primary-light py-4 rounded-t-2xl mb-8">
                                        <h3 className="text-center text-white font-bold">Sumber Sampah</h3>
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
                            <div className="space-y-8 mt-8">
                                <WasteChart
                                    title="Total Penyetoran Sampah"
                                    unit="kg"
                                    initialData={barChartData}
                                    showWasteFilter={true}
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
                                    title="Total Saldo Terkumpul"
                                    unit="jt"
                                    initialData={barChartData}
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
                                    title="Total Saldo Cair"
                                    unit="jt"
                                    initialData={barChartData}
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
                                            <Image src="/icon/pricetag.svg" alt="Price" width={24} height={24} /> Daftar Harga Sampah
                                        </h3>
                                        <button
                                            onClick={() => setActiveTab('harga-sampah')}
                                            className="text-xs text-primary font-bold px-6 py-2.5 rounded-full hover:bg-primary hover:text-white bg-tertiary cursor-pointer transition-all shadow-sm"
                                        >
                                            Atur Harga
                                        </button>
                                    </div>
                                    <div className="overflow-hidden border border-[#E2F2E7] rounded-3xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-[#E2F2E7] text-[#3B8A51] font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('type')}>
                                                        <div className="flex items-center justify-between">
                                                            Jenis Sampah <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'type' ? 'opacity-100' : ''}`}></i>
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('per')}>
                                                        <div className="flex items-center justify-between">
                                                            Satuan <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'per' ? 'opacity-100' : ''}`}></i>
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-5 cursor-pointer hover:bg-[#d4ecd9] transition-colors" onClick={() => toggleSort('price')}>
                                                        <div className="flex items-center justify-between">
                                                            Harga <i className={`fas fa-sort text-xs ml-2 opacity-50 ${priceSortField === 'price' ? 'opacity-100' : ''}`}></i>
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


