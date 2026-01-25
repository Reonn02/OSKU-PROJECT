'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import YearPicker from '@/components/YearPicker';
import { showStandaloneToast } from './Toast';
import { usePencairan } from '@/contexts/PencairanContext';

interface PetugasData {
    id: string;
    nama: string;
    email: string;
    noHp: string | null;
    bankSampahId: string | null;
    bankSampahNama: string | null;
}

interface DataItem {

    id: string;
    id_pengajuan: string;
    id_nasabah: string;
    name: string;
    amount: number;
    date: string;
    status: string;
    reason: string;
    processed_at: string | null;
    raw_date: string; // Store original ISO string for filtering
    raw_processed_at: string | null;
}

const STATUS_OPTIONS = ['Diproses', 'Disetujui', 'Ditolak'];

export default function PersetujuanPetugas() {
    const { pencairanList, historyList, loading, fetchPencairanByBank, approvePencairan, rejectPencairan } = usePencairan();
    const [activeFilter, setActiveFilter] = useState('Semua');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [petugasBankId, setPetugasBankId] = useState<string | null>(null);
    const [petugasId, setPetugasId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render trigger

    // History section states
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyFilter, setHistoryFilter] = useState('Disetujui'); // Default to Disetujui instead of Semua
    const itemsPerPage = 10;

    // Load petugas's bank ID from localStorage and fetch from database
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const petugasData = JSON.parse(savedData) as PetugasData;
                setPetugasBankId(petugasData.bankSampahId);
                setPetugasId(petugasData.id);
                if (petugasData.bankSampahId) {
                    fetchPencairanByBank(petugasData.bankSampahId);
                }
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, [fetchPencairanByBank]);

    // Listen for storage changes to refresh data
    useEffect(() => {
        const handleStorageChange = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Map database data to component format (with localStorage fallback)
    const data = (() => {
        // First try database data
        if (pencairanList.length > 0) {
            return pencairanList.map(item => ({
                id: item.id,
                id_pengajuan: item.id || '-',
                id_nasabah: item.nasabah_username || '-',
                name: item.nasabah_name || '-',
                amount: item.jumlah,
                date: new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID'),
                status: item.status === 'pending' ? 'Diproses' :
                    item.status === 'approved' ? 'Disetujui' :
                        item.status === 'rejected' ? 'Ditolak' :
                            item.status === 'completed' ? 'Selesai' :
                                item.status === 'cancelled' ? 'Dibatalkan' : item.status,
                reason: item.alasan || '',
                processed_at: item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : null,
                raw_date: item.tanggal_pengajuan,
                raw_processed_at: item.tanggal_selesai,
            }));
        }

        // Fallback to localStorage
        try {
            const requests = JSON.parse(localStorage.getItem('pencairan_requests') || '[]');
            return requests
                .filter((r: any) => r.bankSampahId === petugasBankId && r.status === 'Diproses')
                .map((item: any) => ({
                    id: item.id,
                    id_pengajuan: item.id_pengajuan || '-',
                    id_nasabah: item.id_nasabah || '-',
                    name: item.name || '-',
                    amount: item.amount,
                    date: item.date || '-',
                    status: item.status,
                    reason: item.reason || '',
                    processed_at: item.processed_at || null,
                    raw_date: new Date().toISOString(), // Fallback
                    raw_processed_at: item.processed_at ? new Date(item.processed_at).toISOString() : null,
                }));
        } catch {
            return [];
        }
    })();

    const historyData = (() => {
        // First try database data
        if (historyList.length > 0) {
            return historyList.map(item => ({
                id: item.id,
                id_pengajuan: item.id || '-',
                id_nasabah: item.nasabah_username || '-',
                name: item.nasabah_name || '-',
                amount: item.jumlah,
                date: new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID'),
                status: item.status === 'pending' ? 'Diproses' :
                    (item.status === 'approved' || item.status === 'completed') ? 'Disetujui' :
                        item.status === 'rejected' ? 'Ditolak' :
                            item.status === 'cancelled' ? 'Dibatalkan' : item.status,
                reason: item.alasan || '',
                processed_at: item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : null,
                raw_date: item.tanggal_pengajuan,
                raw_processed_at: item.tanggal_selesai,
            }));
        }

        // Fallback to localStorage
        try {
            const requests = JSON.parse(localStorage.getItem('pencairan_requests') || '[]');
            return requests
                .filter((r: any) => r.bankSampahId === petugasBankId && ['Disetujui', 'Ditolak', 'Selesai', 'Dibatalkan'].includes(r.status))
                .map((item: any) => ({
                    id: item.id,
                    id_pengajuan: item.id_pengajuan || '-',
                    id_nasabah: item.id_nasabah || '-',
                    name: item.name || '-',
                    amount: item.amount,
                    date: item.date || '-',
                    status: item.status,
                    reason: item.reason || '',
                    processed_at: item.processed_at || null,
                    raw_date: new Date().toISOString(), // Fallback
                    raw_processed_at: item.processed_at ? new Date(item.processed_at).toISOString() : null,
                }));
        } catch {
            return [];
        }
    })();

    // Unified data filtering by year for ALL sections (Summary Cards + History)
    const getYearFromDate = (dateStr: string) => {
        if (!dateStr) return null;
        // Handle ISO string or DD/MM/YYYY
        if (dateStr.includes('-')) return new Date(dateStr).getFullYear();
        if (dateStr.includes('/')) return parseInt(dateStr.split('/')[2]);
        return null;
    };

    // Filter pending items by year
    const pendingByYear = data.filter((d: DataItem) => {
        if (!d.raw_date) return false;
        const submitYear = new Date(d.raw_date).getFullYear();
        return submitYear === selectedYear;
    });

    // Filter history items by year (for stats)
    const historyByYearStats = historyData.filter((d: DataItem) => {
        // For stats, we use the date relevant to the status
        const dateToCheck = d.raw_processed_at || d.raw_date;
        if (!dateToCheck) return false;
        const itemYear = new Date(dateToCheck).getFullYear();
        return itemYear === selectedYear;
    });

    const counts = {
        Diproses: pendingByYear.filter((d: DataItem) => d.status === 'Diproses').length,
        Disetujui: historyByYearStats.filter((d: DataItem) => d.status === 'Disetujui').length,
        Ditolak: historyByYearStats.filter((d: DataItem) => d.status === 'Ditolak').length,
    };

    // Calculate Total Pencairan for the selected year (Only Completed/Selesai and Disetujui)
    // Actually "Total Pencairan" usually implies money disbursed.
    // If it refers to "Total Pengajuan", we deleted that card.
    // User mentioned "ringkasan total pencairan pun juga belum menampilkan apa apa"
    // Check if user means the card on Dashboard or here?
    // On Persetujuan page we removed "Total Pengajuan".
    // Maybe user sees "Total Pencairan" on Dashboard image?
    // Wait, the user snapshot SHOWS Dashboard page!!
    // "Total Pencairan Rp 0" in the snapshot with "Dashboard" header.
    // Ah, the user might be referring to the Dashboard page, NOT Persetujuan page for the "Total Pencairan" issue.
    // But "filter tahun belum berpengaruh pada konten" might refer to Persetujuan page too.

    // Let's fix Persetujuan stats first.


    // Total should be sum of the three categories


    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === 'Disetujui') {
            // Try to approve in database first
            if (petugasId && selectedItem?.id) {
                const success = await approvePencairan(selectedItem.id, petugasId);
                if (success) {
                    showStandaloneToast('success', 'Berhasil', 'Pengajuan pencairan berhasil disetujui');
                } else {
                    // Fallback: update localStorage if database fails
                    try {
                        const requests = JSON.parse(localStorage.getItem('pencairan_requests') || '[]');
                        const updatedRequests = requests.map((r: any) =>
                            r.id === selectedItem.id ? {
                                ...r,
                                status: 'Disetujui',
                                processed_at: new Date().toLocaleDateString('id-ID'),
                                processed_by: 'Petugas'
                            } : r
                        );
                        localStorage.setItem('pencairan_requests', JSON.stringify(updatedRequests));
                        setRefreshKey(prev => prev + 1); // Force UI refresh
                        showStandaloneToast('success', 'Berhasil', 'Pengajuan pencairan berhasil disetujui');
                    } catch {
                        showStandaloneToast('error', 'Gagal', 'Terjadi kesalahan saat menyetujui pengajuan');
                    }
                }
            }
        } else if (newStatus === 'Ditolak') {
            // Show reject modal first to get reason
            setShowStatusModal(false);
            setShowRejectModal(true);
            return;
        }

        setShowStatusModal(false);
        setSelectedItem(null);
    };

    const confirmRejection = async () => {
        if (!rejectReason.trim()) return;

        if (petugasId && selectedItem?.id) {
            const success = await rejectPencairan(selectedItem.id, rejectReason, petugasId);
            if (success) {
                showStandaloneToast('info', 'Ditolak', 'Pengajuan pencairan telah ditolak');
            } else {
                // Fallback: update localStorage if database fails
                try {
                    const requests = JSON.parse(localStorage.getItem('pencairan_requests') || '[]');
                    const updatedRequests = requests.map((r: any) =>
                        r.id === selectedItem.id ? {
                            ...r,
                            status: 'Ditolak',
                            reason: rejectReason,
                            processed_at: new Date().toLocaleDateString('id-ID'),
                            processed_by: 'Petugas'
                        } : r
                    );
                    localStorage.setItem('pencairan_requests', JSON.stringify(updatedRequests));
                    setRefreshKey(prev => prev + 1); // Force UI refresh
                    showStandaloneToast('info', 'Ditolak', 'Pengajuan pencairan telah ditolak');
                } catch {
                    showStandaloneToast('error', 'Gagal', 'Terjadi kesalahan saat menolak pengajuan');
                }
            }
        }

        setShowRejectModal(false);
        setSelectedItem(null);
        setRejectReason('');
    };

    const openStatusModal = (item: any) => {
        setSelectedItem(item);
        setShowStatusModal(true);
    };

    // Filter active data (pending) to show in the first table
    // Although summarized by year, the main table usually shows ALL pending tasks regardless of year to avoid missing tasks.
    // However, if the user requested the filter to affect the summary, it implies they are analyzing a specific period.
    // Let's keep the Active Table showing ALL pending items to ensure Petugas doesn't miss work, 
    // BUT the summary cards will reflect the selected year's stats.
    // Filter active data (pending) to show in the first table
    // Updated: NOW FILTERED BY YEAR as requested by user ("filter tahun belum berpengaruh pada konten")
    // Filter active data (pending) to show in the first table
    // Updated: NOW FILTERED BY YEAR as requested by user ("filter tahun belum berpengaruh pada konten")
    const activeData = pendingByYear.filter((d: DataItem) => d.status === 'Diproses');

    // ... unless the user wants to filter the table too?
    // "filter tahun sekarang mesti dibuat dapat mempengaruhi kotka ringkasan juga" -> specifically summary box.
    // I will leave the active table as showing ALL pending items for workflow safety.

    // Filter history data by year, status, and search query
    const filteredHistoryData = historyData
        .filter((item: DataItem) => {
            // Extract year from raw_processed_at date
            const dateToCheck = item.raw_processed_at || item.raw_date;
            if (!dateToCheck) return false;
            const processedYear = new Date(dateToCheck).getFullYear();
            return processedYear === selectedYear;
        })
        // STRICT FILTER: Only show Disetujui or Ditolak based on the selected tab.
        .filter((item: DataItem) => {
            if (historyFilter === 'Disetujui') {
                return item.status === 'Disetujui' || item.status === 'Selesai';
            }
            return item.status === historyFilter;
        })
        .filter((item: DataItem) =>
            item.id_pengajuan.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(historySearchQuery.toLowerCase())
        );

    // Pagination for history
    const totalHistoryPages = Math.ceil(filteredHistoryData.length / itemsPerPage);
    const paginatedHistoryData = filteredHistoryData.slice(
        (historyPage - 1) * itemsPerPage,
        historyPage * itemsPerPage
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Disetujui': return 'bg-green-100 text-green-800';
            case 'Selesai': return 'bg-green-200 text-green-900';
            case 'Diproses': return 'bg-yellow-100 text-yellow-800';
            case 'Ditolak': return 'bg-red-100 text-red-800';
            case 'Dibatalkan': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Export filtered history to CSV
    const exportToCSV = () => {
        if (filteredHistoryData.length === 0) {
            showStandaloneToast('warning', 'Tidak Ada Data', 'Tidak ada data riwayat untuk diekspor.');
            return;
        }

        const headers = ['ID Pengajuan', 'ID Nasabah', 'Nama Nasabah', 'Jumlah', 'Tgl Pengajuan', 'Status', 'Alasan', 'Tgl Diproses'];
        const csvRows = [
            headers.join(','),
            ...filteredHistoryData.map((item: DataItem) => [
                item.id_pengajuan,
                item.id_nasabah,
                `"${item.name}"`,
                item.amount,
                item.date,
                item.status,
                item.reason ? `"${item.reason}"` : '-',
                item.processed_at
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `riwayat_persetujuan_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showStandaloneToast('success', 'Export Berhasil', `${filteredHistoryData.length} data berhasil diekspor.`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/mdi_approve.svg" alt="Persetujuan" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Persetujuan</h1>
                </div>

                {/* Year Picker Moved Here */}
                <div className="min-w-[150px]">
                    <YearPicker
                        selectedYear={selectedYear}
                        onYearChange={(year) => {
                            setSelectedYear(year);
                            setHistoryPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: 'Pengajuan diproses',
                        value: counts.Diproses,
                        icon: 'fa-clock',
                        bgColor: 'bg-yellow-light',
                        iconColor: 'text-dark-yellow',
                        textColor: 'text-dark-yellow'
                    },
                    {
                        label: 'Pengajuan disetujui',
                        value: counts.Disetujui,
                        icon: 'fa-check-circle',
                        bgColor: 'bg-tertiary',
                        iconColor: 'text-primary',
                        textColor: 'text-primary'
                    },
                    {
                        label: 'Pengajuan ditolak',
                        value: counts.Ditolak,
                        icon: 'fa-times-circle',
                        bgColor: 'bg-warning-light',
                        iconColor: 'text-warning',
                        textColor: 'text-warning'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                <i className={`fas ${stat.icon} ${stat.iconColor} text-xl`}></i>
                            </div>
                            <div>
                                <p className={`text-4xs font-medium ${stat.textColor}`}>{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Table - Only showing "Diproses" items */}
            {activeData.length === 0 ? (
                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-12">
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <i className="fas fa-inbox text-5xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-3">Tidak ada pengajuan menunggu</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md">
                            Semua pengajuan sudah diproses. Pengajuan baru akan muncul di sini.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary text-white font-bold">
                                <tr>
                                    <th className="px-6 py-5 text-center w-16">No</th>
                                    <th className="px-6 py-5">ID Pengajuan</th>
                                    <th className="px-6 py-5">ID Nasabah</th>
                                    <th className="px-6 py-5">Nama Nasabah</th>
                                    <th className="px-6 py-5 text-center">Nominal Saldo Tarik</th>
                                    <th className="px-6 py-5 text-center">Tanggal pengajuan</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {activeData.map((item: DataItem, idx: number) => (
                                    <tr key={item.id} className="hover:bg-tertiary/30 transition-colors group">
                                        <td className="px-6 py-6 text-center text-gray-400 font-medium">{idx + 1}</td>
                                        <td className="px-6 py-6 font-bold text-primary">{item.id_pengajuan}</td>
                                        <td className="px-6 py-6 font-medium text-gray-600">{item.id_nasabah}</td>
                                        <td className="px-6 py-6 font-bold text-primary">{item.name}</td>
                                        <td className="px-6 py-6 text-center text-primary font-bold">Rp {item.amount.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-6 text-center text-gray-400 font-medium">{item.date}</td>
                                        <td className="px-6 py-6 text-center">
                                            <button
                                                onClick={() => openStatusModal(item)}
                                                className={`px-6 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer min-w-[100px] ${getStatusStyles(item.status)}`}
                                            >
                                                {item.status}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Section */}
            <div className="space-y-4 pt-4">
                {/* History Header + Filter Controls - One Row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left: Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <i className="fas fa-history text-2xl text-primary"></i>
                        </div>
                        <h2 className="text-xl font-bold text-primary">Riwayat Persetujuan</h2>
                        <span className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-full">
                            {filteredHistoryData.length} data
                        </span>
                    </div>

                    {/* Right: Filters + Export */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari ID atau nama nasabah"
                                value={historySearchQuery}
                                onChange={(e) => {
                                    setHistorySearchQuery(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="bg-white border border-gray-100 rounded-full px-10 py-2.5 text-xs font-medium text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
                            />
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        </div>

                        {/* Status Filter - Removed 'Semua', strictly Disetujui & Ditolak */}
                        <div className="flex bg-white rounded-full p-1 border border-gray-100 shadow-sm overflow-hidden">
                            {['Disetujui', 'Ditolak'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => {
                                        setHistoryFilter(filter);
                                        setHistoryPage(1);
                                    }}
                                    className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${historyFilter === filter
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToCSV}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                            <i className="fas fa-file-csv"></i>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* History Table */}
                {filteredHistoryData.length === 0 ? (
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-12">
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <i className="fas fa-inbox text-4xl text-gray-300"></i>
                            </div>
                            <h3 className="text-lg font-bold text-gray-400 mb-2">Tidak ada data</h3>
                            <p className="text-gray-400 text-sm text-center max-w-md">
                                Belum ada riwayat persetujuan untuk tahun <span className="font-bold">{selectedYear}</span>
                                {historySearchQuery && <> dengan pencarian "<span className="font-bold">{historySearchQuery}</span>"</>}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[900px]">
                                    <thead className="bg-primary text-white font-bold text-xs">
                                        <tr>
                                            <th className="px-5 py-4">ID Pengajuan</th>
                                            <th className="px-5 py-4">ID Nasabah</th>
                                            <th className="px-5 py-4">Nama Nasabah</th>
                                            <th className="px-5 py-4">Jumlah</th>
                                            <th className="px-5 py-4">Tgl Pengajuan</th>
                                            <th className="px-5 py-4 text-center">Status</th>
                                            <th className="px-5 py-4">Alasan</th>
                                            <th className="px-5 py-4">Tgl Diproses</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedHistoryData.map((item: DataItem, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-gray-700">{item.id_pengajuan}</td>
                                                <td className="px-5 py-4 font-medium text-gray-600">{item.id_nasabah}</td>
                                                <td className="px-5 py-4 text-gray-600">{item.name}</td>
                                                <td className="px-5 py-4 font-bold text-gray-700">
                                                    Rp {item.amount?.toLocaleString('id-ID') || '0'}
                                                </td>
                                                <td className="px-5 py-4 text-gray-500">{item.date}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyles(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate" title={item.reason || '-'}>
                                                    {item.reason || '-'}
                                                </td>
                                                <td className="px-5 py-4 text-gray-500">{item.processed_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* History Pagination */}
                        {totalHistoryPages > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-6">
                                {historyPage > 1 && (
                                    <button
                                        onClick={() => setHistoryPage(prev => prev - 1)}
                                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                    >
                                        <i className="fas fa-chevron-left text-[12px]"></i>
                                    </button>
                                )}

                                {Array.from({ length: totalHistoryPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setHistoryPage(i + 1)}
                                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer ${historyPage === i + 1
                                            ? 'bg-primary text-white'
                                            : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                {historyPage < totalHistoryPages && (
                                    <button
                                        onClick={() => setHistoryPage(prev => prev + 1)}
                                        className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700 transition shadow-md active:scale-90 cursor-pointer"
                                    >
                                        <i className="fas fa-chevron-right text-[12px]"></i>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div>
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-edit text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2 text-center">Ubah Status Pengajuan</h3>
                            <p className="text-gray-500 text-sm mb-6 text-center">
                                Pengajuan untuk <span className="font-bold text-primary">{selectedItem?.name}</span>
                            </p>
                            <div className="space-y-3 mb-6">
                                {STATUS_OPTIONS.filter(s => s !== 'Diproses').map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`w-full px-6 py-3 rounded-xl text-sm font-bold transition-all ${getStatusStyles(status)} hover:opacity-80`}
                                    >
                                        {status === 'Disetujui' ? '✓ Setujui Pengajuan' : '✗ Tolak Pengajuan'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedItem(null);
                                }}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div>
                            <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-times text-warning text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2 text-center">Tolak Pengajuan</h3>
                            <p className="text-gray-500 text-sm mb-4 text-center">
                                Pengajuan dari <span className="font-bold text-primary">{selectedItem?.name}</span>
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-primary mb-2">Alasan Penolakan *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Contoh: Saldo nasabah tidak mencukupi"
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setSelectedItem(null);
                                        setRejectReason('');
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmRejection}
                                    disabled={!rejectReason.trim()}
                                    className="flex-1 bg-warning hover:bg-warning/90 text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Ya, Tolak
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
