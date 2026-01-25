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

export default function KonfirmasiPetugas() {
    const { approvedList, historyList, loading, fetchApprovedByBank, completePencairan, cancelPencairan } = usePencairan();
    const [completedToday, setCompletedToday] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [petugasBankId, setPetugasBankId] = useState<string | null>(null);
    const itemsPerPage = 10;

    // Load petugas's bank ID from localStorage and fetch from database
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const petugasData = JSON.parse(savedData) as PetugasData;
                setPetugasBankId(petugasData.bankSampahId);
                if (petugasData.bankSampahId) {
                    fetchApprovedByBank(petugasData.bankSampahId);
                }
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, [fetchApprovedByBank]);

    // Map database data to component format
    const pendingData = approvedList.map(item => ({
        id: item.id,
        withdrawal_id: item.id || '-',
        nasabah_id: item.nasabah_username || '-',
        nasabah_name: item.nasabah_name || '-',
        amount: item.jumlah,
        approved_at: item.tanggal_pengajuan ? new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID') : '-',
        phone: '-',
        original_id: item.id
    }));

    const historyData = historyList
        .filter(item => item.status === 'completed' || item.status === 'cancelled')
        .map(item => ({
            id: item.id,
            withdrawal_id: item.id || '-',
            nasabah_id: item.nasabah_username || '-',
            nasabah_name: item.nasabah_name || '-',
            amount: item.jumlah,
            approved_at: item.tanggal_pengajuan ? new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID') : '-',
            phone: '-',
            status: item.status === 'completed' ? 'Selesai' : 'Dibatalkan',
            reason: item.alasan || '',
            completed_at: item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-',
        }));

    const filteredData = pendingData.filter(item =>
        item.withdrawal_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nasabah_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Hitung berapa yang sudah dibatalkan hari ini
    const today = new Date().toLocaleDateString('id-ID');
    const cancelledTodayCount = historyData.filter(item => item.status === 'Dibatalkan' && item.completed_at === today).length;

    // Filter history data by year and search query
    const filteredHistoryData = historyData
        .filter(item => {
            // Extract year from completed_at date (format: "17/1/2026" or similar)
            const completedYear = item.completed_at ? new Date(item.completed_at.split('/').reverse().join('-')).getFullYear() : null;
            return completedYear === selectedYear;
        })
        .filter(item =>
            item.withdrawal_id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
            item.nasabah_name.toLowerCase().includes(historySearchQuery.toLowerCase())
        );

    // Pagination for history
    const totalHistoryPages = Math.ceil(filteredHistoryData.length / itemsPerPage);
    const paginatedHistoryData = filteredHistoryData.slice(
        (historyPage - 1) * itemsPerPage,
        historyPage * itemsPerPage
    );

    const handleConfirm = (item: any) => {
        setSelectedItem(item);
        setShowConfirmModal(true);
    };

    const handleReject = (item: any) => {
        setSelectedItem(item);
        setShowRejectModal(true);
    };

    const confirmCompletion = async () => {
        if (selectedItem?.id) {
            const success = await completePencairan(selectedItem.id);
            if (success) {
                setCompletedToday(completedToday + 1);
                showStandaloneToast('success', 'Berhasil', 'Pencairan berhasil dikonfirmasi');
            } else {
                showStandaloneToast('error', 'Gagal', 'Terjadi kesalahan saat mengkonfirmasi pencairan');
            }
        }

        setShowConfirmModal(false);
        setSelectedItem(null);

        if (paginatedData.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const confirmRejection = async () => {
        if (!rejectReason.trim()) return;

        if (selectedItem?.id) {
            const success = await cancelPencairan(selectedItem.id, rejectReason);
            if (success) {
                showStandaloneToast('info', 'Dibatalkan', 'Pencairan telah dibatalkan');
            } else {
                showStandaloneToast('error', 'Gagal', 'Terjadi kesalahan saat membatalkan pencairan');
            }
        }

        setShowRejectModal(false);
        setSelectedItem(null);
        setRejectReason('');

        if (paginatedData.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Export filtered history to CSV
    const exportToCSV = () => {
        if (filteredHistoryData.length === 0) {
            showStandaloneToast('warning', 'Tidak Ada Data', 'Tidak ada data history untuk diekspor.');
            return;
        }

        const headers = ['ID Pengajuan', 'ID Nasabah', 'Nama Nasabah', 'No. Telepon', 'Jumlah', 'Tgl Disetujui', 'Status', 'Alasan', 'Tgl Selesai'];
        const csvRows = [
            headers.join(','),
            ...filteredHistoryData.map(item => [
                item.withdrawal_id,
                item.nasabah_id || '-',
                `"${item.nasabah_name}"`,
                item.phone,
                item.amount,
                item.approved_at,
                item.status,
                item.reason ? `"${item.reason}"` : '-',
                item.completed_at
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `riwayat_konfirmasi_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-thumbs-up text-2xl text-primary"></i>
                </div>
                <h1 className="text-2xl font-bold text-primary">Konfirmasi Pencairan</h1>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-light rounded-xl flex items-center justify-center">
                            <i className="fas fa-clock text-dark-yellow text-xl"></i>
                        </div>
                        <div>
                            <p className="text-4xs text-dark-yellow font-medium">Menunggu Konfirmasi</p>
                            <p className="text-2xl font-bold text-dark-yellow">{pendingData.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-tertiary rounded-xl flex items-center justify-center">
                            <i className="fas fa-check-circle text-primary text-xl"></i>
                        </div>
                        <div>
                            <p className="text-4xs text-primary font-medium">Selesai Hari Ini</p>
                            <p className="text-2xl font-bold text-primary">{completedToday}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center">
                            <i className="fas fa-times-circle text-warning text-xl"></i>
                        </div>
                        <div>
                            <p className="text-4xs text-warning font-medium">Dibatalkan Hari Ini</p>
                            <p className="text-2xl font-bold text-warning">{cancelledTodayCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State or Table */}
            {pendingData.length === 0 ? (
                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-12">
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <i className="fas fa-thumbs-up text-5xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-3">Tidak ada pengajuan menunggu konfirmasi</h3>
                        <p className="text-gray-400 text-sm text-center max-w-md">
                            Pengajuan yang sudah <span className="font-semibold text-gray-400">Disetujui</span> di halaman Persetujuan akan muncul di sini.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-primary text-white font-bold">
                                    <tr>
                                        <th className="px-6 py-5 border-r border-white/20">ID Pengajuan</th>
                                        <th className="px-6 py-5 border-r border-white/20">ID Nasabah</th>
                                        <th className="px-6 py-5 border-r border-white/20">Nama Nasabah</th>
                                        <th className="px-6 py-5 border-r border-white/20">No. Telepon</th>
                                        <th className="px-6 py-5 border-r border-white/20">Jumlah</th>
                                        <th className="px-6 py-5 border-r border-white/20">Tgl Disetujui</th>
                                        <th className="px-6 py-5">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-tertiary/30 transition-colors group border-b border-gray-50 last:border-0">
                                            <td className="px-6 py-6 font-bold text-primary">{item.withdrawal_id}</td>
                                            <td className="px-6 py-6 font-medium text-gray-600">{item.nasabah_id}</td>
                                            <td className="px-6 py-6 text-gray-700 font-medium">{item.nasabah_name}</td>
                                            <td className="px-6 py-6 text-gray-500 font-medium">{item.phone}</td>
                                            <td className="px-6 py-6 font-bold text-primary">
                                                Rp {item.amount?.toLocaleString('id-ID') || '0'}
                                            </td>
                                            <td className="px-6 py-6 text-gray-500 font-medium">
                                                {item.approved_at}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleConfirm(item)}
                                                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                                    >
                                                        Selesai
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(item)}
                                                        className="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                                    >
                                                        Batalkan
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && pendingData.length > 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-8 py-20 text-center text-gray-400 italic">
                                                Tidak ada data yang sesuai dengan pencarian
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-8">
                            {currentPage > 1 && (
                                <button
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                >
                                    <i className="fas fa-chevron-left text-[12px]"></i>
                                </button>
                            )}

                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer ${currentPage === i + 1
                                        ? 'bg-primary text-white'
                                        : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            {currentPage < totalPages && (
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                >
                                    <i className="fas fa-chevron-right text-[12px]"></i>
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Info Card */}
            <div className="bg-white border border-blue-100 rounded-2xl p-6">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <i className="fas fa-info-circle text-primary text-2xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary mb-2">Cara Konfirmasi Pencairan</h4>
                        <div className="text-primary text-sm space-y-1">
                            <p>• <span className="font-semibold">Data otomatis muncul:</span> Pengajuan yang sudah "Disetujui" di halaman Persetujuan akan otomatis muncul di sini.</p>
                            <p>• <span className="font-semibold">Selesai:</span> Klik jika nasabah sudah mengambil uang. Data akan hilang dari Persetujuan dan Konfirmasi.</p>
                            <p>• <span className="font-semibold">Batalkan:</span> Klik jika ada masalah. Data akan hilang dari Persetujuan dan Konfirmasi.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                {/* History Header + Filter Controls - One Row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left: Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <i className="fas fa-history text-2xl text-primary"></i>
                        </div>
                        <h2 className="text-xl font-bold text-primary">Riwayat Konfirmasi</h2>
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

                        {/* Year Picker */}
                        <YearPicker
                            selectedYear={selectedYear}
                            onYearChange={(year) => {
                                setSelectedYear(year);
                                setHistoryPage(1);
                            }}
                        />

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
                                Belum ada riwayat konfirmasi untuk tahun <span className="font-bold">{selectedYear}</span>
                                {historySearchQuery && <> dengan pencarian "<span className="font-bold">{historySearchQuery}</span>"</>}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[1000px]">
                                    <thead className="bg-primary text-white font-bold text-xs">
                                        <tr>
                                            <th className="px-5 py-4">ID Pengajuan</th>
                                            <th className="px-5 py-4">ID Nasabah</th>
                                            <th className="px-5 py-4">Nama Nasabah</th>
                                            <th className="px-5 py-4">No. Telepon</th>
                                            <th className="px-5 py-4">Jumlah</th>
                                            <th className="px-5 py-4">Tgl Disetujui</th>
                                            <th className="px-5 py-4 text-center">Status</th>
                                            <th className="px-5 py-4">Alasan</th>
                                            <th className="px-5 py-4">Tgl Selesai</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedHistoryData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-gray-700">{item.withdrawal_id}</td>
                                                <td className="px-5 py-4 font-medium text-gray-600">{item.nasabah_id || '-'}</td>
                                                <td className="px-5 py-4 text-gray-600">{item.nasabah_name}</td>
                                                <td className="px-5 py-4 text-gray-500">{item.phone}</td>
                                                <td className="px-5 py-4 font-bold text-gray-700">
                                                    Rp {item.amount?.toLocaleString('id-ID') || '0'}
                                                </td>
                                                <td className="px-5 py-4 text-gray-500">{item.approved_at}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.status === 'Selesai' ? 'bg-tertiary text-primary' : item.status === 'Dibatalkan' ? 'bg-warning-light text-warning' : 'bg-gray-200 text-gray-600'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate" title={item.reason || '-'}>
                                                    {item.reason || '-'}
                                                </td>
                                                <td className="px-5 py-4 text-gray-500">{item.completed_at}</td>
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
                                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                    >
                                        <i className="fas fa-chevron-right text-[12px]"></i>
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Konfirmasi Pencairan Selesai?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Apakah nasabah <span className="font-bold text-primary">{selectedItem?.nasabah_name}</span> sudah mengambil uang sebesar <span className="font-bold text-primary">Rp {selectedItem?.amount?.toLocaleString('id-ID')}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSelectedItem(null);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={confirmCompletion}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
                                >
                                    Ya, Selesai
                                </button>
                            </div>
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
                            <h3 className="text-xl font-bold text-primary mb-2 text-center">Batalkan Pencairan</h3>
                            <p className="text-gray-500 text-sm mb-4 text-center">
                                Pembatalan untuk <span className="font-bold text-primary">{selectedItem?.nasabah_name}</span>
                            </p>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-primary mb-2">Alasan Pembatalan *</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Contoh: Nasabah tidak hadir sesuai jadwal"
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
                                    Ya, Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
