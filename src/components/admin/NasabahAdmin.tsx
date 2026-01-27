'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllNasabah, formatSaldo, deleteNasabah, updateNasabah, NasabahData } from '@/data/nasabahData';
import { showStandaloneToast } from '@/components/shared/Toast';
import { useBankSampah } from '@/contexts/BankSampahContext';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';

export default function NasabahAdmin() {
    const { banks } = useBankSampah();
    const [nasabahList, setNasabahList] = useState<NasabahData[]>([]);
    const [selectedNasabah, setSelectedNasabah] = useState<NasabahData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [nasabahToDelete, setNasabahToDelete] = useState<NasabahData | null>(null);
    const [editedData, setEditedData] = useState<Partial<NasabahData>>({});

    const handleSaveChanges = async () => {
        if (!selectedNasabah || !editedData) return;

        try {
            const success = await updateNasabah(selectedNasabah.id, editedData);
            if (success) {
                showStandaloneToast('success', 'Berhasil', 'Data nasabah berhasil diperbarui');
                // Update local list
                const updatedList = nasabahList.map(n =>
                    n.id === selectedNasabah.id ? { ...n, ...editedData } : n
                );
                setNasabahList(updatedList);
                setSelectedNasabah({ ...selectedNasabah, ...editedData });
            } else {
                showStandaloneToast('error', 'Gagal', 'Gagal memperbarui data nasabah');
            }
        } catch (error) {
            console.error('Update error:', error);
            showStandaloneToast('error', 'Error', 'Terjadi kesalahan saat menyimpan perubahan');
        }
    };

    const handleDelete = async () => {
        if (!nasabahToDelete) return;

        try {
            const result = await deleteNasabah(nasabahToDelete.id);
            if (result.success) {
                showStandaloneToast('success', 'Nasabah Dihapus', `Nasabah ${nasabahToDelete.name} berhasil dihapus`);
                refreshData();
                setShowDeleteModal(false); // Close modal on success
            } else {
                showStandaloneToast('error', 'Gagal Menghapus', result.error || 'Gagal menghapus nasabah');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showStandaloneToast('error', 'Error', 'Terjadi kesalahan saat menghapus nasabah');
        }
    };

    // Load nasabah data on mount
    useEffect(() => {
        const loadData = async () => {
            const data = await getAllNasabah();
            setNasabahList(data);
        };
        loadData();
    }, []);

    // Refresh data when returning from detail view
    const refreshData = async () => {
        const data = await getAllNasabah();
        setNasabahList(data);
    };

    const filteredNasabah = nasabahList.filter(n =>
        (n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedBank === '' || n.bankSampah.includes(selectedBank))
    );

    if (selectedNasabah) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm font-medium mb-4">
                    <button
                        onClick={() => setSelectedNasabah(null)}
                        className="text-[#3B8A51] hover:underline cursor-pointer"
                    >
                        Nasabah
                    </button>
                    <i className="fas fa-chevron-right text-[10px] text-gray-300"></i>
                    <span className="text-[#3B8A51] font-bold">{selectedNasabah.name}</span>
                </div>

                {/* Detail Information Card */}
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    { label: 'Id nasabah', value: selectedNasabah.id },
                                    { label: 'Username', value: selectedNasabah.username },
                                    { label: 'Nama nasabah', value: selectedNasabah.name },
                                    { label: 'Email', value: selectedNasabah.email },
                                    { label: 'Nomor HP', value: selectedNasabah.phone },
                                    { label: 'NIK', value: selectedNasabah.nik },
                                    { label: 'Alamat', value: selectedNasabah.address },
                                    { label: 'RT', value: selectedNasabah.rt },
                                    { label: 'RW', value: selectedNasabah.rw },
                                    { label: 'Kelurahan', value: selectedNasabah.kelurahan },
                                    { label: 'Kecamatan', value: selectedNasabah.kecamatan },
                                    { label: 'Kota', value: selectedNasabah.kota },
                                    { label: 'Provinsi', value: selectedNasabah.provinsi },
                                    { label: 'Kode Pos', value: selectedNasabah.kodepos },
                                    { label: 'Bank Sampah', value: selectedNasabah.bankSampah },
                                ].map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 font-bold text-[#3B8A51] w-1/3 min-w-[200px]">{item.label}</td>
                                        <td className="py-4 text-gray-400 font-medium">{item.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Section Title */}
                <h2 className="text-3xl font-bold text-[#3B8A51] mt-12 mb-8">Pengaturan Profil</h2>

                {/* Informasi Personal Form - Admin can only edit Email and Bank Sampah */}
                <div className="bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-12 border-t-[1px]">
                    <h3 className="text-xl font-bold text-[#3B8A51] mb-8">Informasi Personal</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-[#3B8A51] mb-2 ml-4">Email</label>
                            <input
                                type="email"
                                value={editedData.email || selectedNasabah.email}
                                onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#3B8A51] text-sm text-gray-500 font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3B8A51] mb-2 ml-4">Nomor HP</label>
                            <input
                                type="text"
                                defaultValue={selectedNasabah.phone}
                                disabled
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 text-sm text-gray-400 font-medium bg-gray-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1 ml-4">Hanya nasabah yang dapat mengubah nomor HP</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3B8A51] mb-2 ml-4">Nama Bank Sampah</label>
                            <div className="relative">
                                <select
                                    value={editedData.bankSampah || selectedNasabah.bankSampah}
                                    onChange={(e) => setEditedData({ ...editedData, bankSampah: e.target.value })}
                                    className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#3B8A51] text-sm text-gray-500 font-medium appearance-none bg-white cursor-pointer"
                                >
                                    <option value="">Pilih Bank Sampah</option>
                                    {banks.map((bank) => (
                                        <option key={bank.id} value={bank.nama}>{bank.nama}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] pointer-events-none"></i>
                            </div>
                        </div>

                        {/* Info Notice */}
                        <div className="bg-tertiary border-l-4 border-primary p-4 rounded-lg">
                            <div className="flex gap-3">
                                <i className="fas fa-info-circle text-primary mt-0.5"></i>
                                <div className="text-sm text-primary">
                                    <p className="font-bold mb-1">Catatan</p>
                                    <p>Alamat, RT, dan RW hanya dapat diubah oleh nasabah sendiri melalui halaman profil mereka.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 mt-10">
                            <button
                                onClick={handleSaveChanges}
                                className="bg-[#3B8A51] hover:bg-primary-dark text-white font-bold py-3 px-16 rounded-2xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setSelectedNasabah(null)}
                    className="text-[#3B8A51] hover:text-primary-dark font-bold py-2 px-8 rounded-2xl transition-all text-sm cursor-pointer flex items-center gap-2">
                    <i className="fas fa-arrow-left"></i>
                    Kembali ke Daftar Nasabah
                </button>
            </div>

        );
    }

    // Export nasabah list to CSV
    const exportToCSV = () => {
        if (filteredNasabah.length === 0) {
            showStandaloneToast('warning', 'Tidak Ada Data', 'Tidak ada data nasabah untuk diekspor.');
            return;
        }

        const headers = ['No', 'Nama Nasabah', 'ID Nasabah', 'Email', 'Saldo', 'Bank Sampah'];
        const csvRows = [
            'Daftar Seluruh Nasabah',
            `Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`,
            '',
            headers.join(','),
            ...filteredNasabah.map((nasabah, idx) => [
                idx + 1,
                `"${nasabah.name}"`,
                nasabah.id,
                nasabah.email,
                formatSaldo(nasabah.saldo),
                `"${nasabah.bankSampah}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `daftar_seluruh_nasabah_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/nasabah.svg" alt="Nasabah" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Daftar Seluruh Nasabah</h1>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari nasabah"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-full px-10 py-2.5 text-xs font-medium text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="appearance-none bg-white text-[#3B8A51] border border-gray-100 rounded-full px-6 py-2.5 pr-12 text-xs font-bold text-primary shadow-sm focus:outline-none cursor-pointer"
                        >
                            <option value="">Bank Sampah</option>
                            {banks.map((bank) => (
                                <option key={bank.id} value={bank.nama}>{bank.nama}</option>
                            ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-[#3B8A51] pointer-events-none"></i>
                    </div>

                    <button onClick={exportToCSV} className="bg-[#3B8A51] hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer">
                        <i className="fas fa-file-csv"></i>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#3B8A51] text-white font-bold">
                            <tr>
                                <th className="px-4 py-5 border-r border-white/20 text-center w-16">No</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Nama nasabah</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">ID Nasabah</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Email</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Saldo</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Bank Sampah</th>
                                <th className="px-8 py-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredNasabah.map((nasabah, idx) => (
                                <tr key={idx} className="hover:bg-tertiary/30 transition-colors group border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-6 text-center text-gray-500 font-bold">{idx + 1}</td>
                                    <td
                                        className="px-8 py-6 font-bold text-[#3B8A51] group-hover:pl-10 transition-all duration-300 cursor-pointer hover:underline"
                                        onClick={() => setSelectedNasabah(nasabah)}
                                    >
                                        {nasabah.name}
                                    </td>
                                    <td className="px-8 py-6 text-gray-400 font-medium">{nasabah.id}</td>
                                    <td className="px-8 py-6 text-gray-400 font-medium">{nasabah.email}</td>
                                    <td className="px-8 py-6 font-bold text-primary">{formatSaldo(nasabah.saldo)}</td>
                                    <td className="px-8 py-6 text-primary font-medium text-xs max-w-[200px]">{nasabah.bankSampah}</td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedNasabah(nasabah)}
                                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('Delete button clicked for:', nasabah.name); // Debug log
                                                    setNasabahToDelete(nasabah);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="bg-warning hover:bg-red-700 text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer">
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredNasabah.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                                            <p className="text-gray-400 font-medium">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - only show if more than 10 items */}
            {filteredNasabah.length > 10 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                    <button className="w-10 h-10 rounded-lg bg-[#3B8A51] text-white text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all">1</button>
                    <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all active:scale-95">2</button>
                    <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all active:scale-95">3</button>
                    <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all active:scale-95">4</button>
                    <button className="w-10 h-10 rounded-full bg-[#3B8A51] text-white text-sm font-bold flex items-center justify-center hover:bg-primary-dark transition-all shadow-md active:scale-90 cursor-pointer ml-2">
                        <i className="fas fa-chevron-right text-[12px]"></i>
                    </button>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                bankName={nasabahToDelete?.name || ''}
            />
        </div>
    );
}
