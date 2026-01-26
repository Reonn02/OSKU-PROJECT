'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from '@/components/shared/Toast';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { usePetugas } from '@/contexts/PetugasContext';

export default function PetugasAdmin() {
    const { banks } = useBankSampah();
    const { petugasList, isLoading, addPetugas, updatePetugas, deletePetugas } = usePetugas();
    const [selectedPetugas, setSelectedPetugas] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [petugasToDelete, setPetugasToDelete] = useState<any>(null);
    const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string, password: string } | null>(null);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [editedData, setEditedData] = useState<any>(null);
    const [showEditSuccess, setShowEditSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newOfficer, setNewOfficer] = useState({
        name: '',
        email: '',
        phone: '',
        bankSampahId: ''
    });

    // Transform petugasList for display (compatible with old format)
    const petugasData = petugasList.map(p => ({
        id: p.id,
        name: p.nama,
        email: p.email,
        phone: p.noHp || '',
        bankSampahId: p.bankSampahId,
        bankSampah: p.bankSampahNama || banks.find(b => b.id === p.bankSampahId)?.nama || '-'
    }));

    const filteredPetugas = petugasData.filter(p =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedBank === '' || p.bankSampahId === selectedBank || p.bankSampah.includes(selectedBank))
    );

    const handleAddOfficer = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Standard temporary password for testing
            const tempPassword = 'Test1234';

            const result = await addPetugas({
                nama: newOfficer.name,
                email: newOfficer.email,
                noHp: newOfficer.phone,
                bankSampahId: newOfficer.bankSampahId,
                bankSampahNama: banks.find(b => b.id === newOfficer.bankSampahId)?.nama
            });

            if (result) {
                setShowAddModal(false);

                // Set credentials to show in success modal
                setGeneratedCredentials({
                    email: newOfficer.email,
                    password: tempPassword
                });

                setShowSuccess(true);
                setCopiedEmail(false);
                setCopiedPassword(false);

                // Reset form
                setNewOfficer({
                    name: '',
                    email: '',
                    phone: '',
                    bankSampahId: ''
                });

                showStandaloneToast('success', 'Berhasil!', 'Petugas baru berhasil ditambahkan.');
            } else {
                showStandaloneToast('error', 'Gagal!', 'Tidak dapat menambahkan petugas. Silakan coba lagi.');
            }
        } catch (error) {
            console.error('Error adding petugas:', error);
            showStandaloneToast('error', 'Gagal!', 'Terjadi kesalahan saat menambahkan petugas.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOfficer = async () => {
        if (petugasToDelete) {
            try {
                await deletePetugas(petugasToDelete.id);
                setShowDeleteModal(false);
                setPetugasToDelete(null);
                // Show delete success
                setShowSuccess(true);
                setGeneratedCredentials({ email: 'DELETE_SUCCESS', password: '' }); // Use as flag
                setTimeout(() => {
                    setShowSuccess(false);
                    setGeneratedCredentials(null);
                }, 3000);
                showStandaloneToast('success', 'Berhasil!', 'Petugas berhasil dihapus.');
            } catch (error) {
                showStandaloneToast('error', 'Gagal!', 'Tidak dapat menghapus petugas.');
            }
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setEditedData({
            ...editedData,
            [field]: value
        });
    };

    const handleSaveChanges = async () => {
        if (selectedPetugas && editedData) {
            try {
                const success = await updatePetugas(selectedPetugas.id, {
                    email: editedData.email,
                    noHp: editedData.phone,
                    bankSampahId: editedData.bankSampahId
                });

                if (success) {
                    // Update selected petugas to show new data
                    const updatedBankName = banks.find(b => b.id === editedData.bankSampahId)?.nama || '-';
                    setSelectedPetugas({
                        ...selectedPetugas,
                        email: editedData.email,
                        phone: editedData.phone,
                        bankSampahId: editedData.bankSampahId,
                        bankSampah: updatedBankName
                    });

                    // Reset edited data
                    setEditedData(null);

                    // Show success notification
                    setShowEditSuccess(true);
                    setTimeout(() => setShowEditSuccess(false), 3000);
                    showStandaloneToast('success', 'Berhasil!', 'Data petugas berhasil diperbarui.');
                } else {
                    showStandaloneToast('error', 'Gagal!', 'Tidak dapat memperbarui data petugas. Pastikan email belum terdaftar.');
                }
            } catch (error) {
                showStandaloneToast('error', 'Gagal!', 'Tidak dapat memperbarui data petugas.');
            }
        }
    };

    // When selecting a petugas, initialize editedData
    const handleSelectPetugas = (petugas: any) => {
        setSelectedPetugas(petugas);
        setEditedData({
            email: petugas.email,
            phone: petugas.phone,
            bankSampahId: petugas.bankSampahId
        });
    };

    // Handle CSV Export
    const handleExportCSV = () => {
        if (filteredPetugas.length === 0) {
            showStandaloneToast('warning', 'Tidak Ada Data', 'Tidak ada data petugas untuk diekspor.');
            return;
        }

        // Create CSV content
        const headers = ['ID Petugas', 'Nama Petugas', 'Email', 'Nomor HP', 'Bank Sampah'];
        const csvRows = [
            headers.join(','),
            ...filteredPetugas.map(p => [
                p.id,
                `"${p.name}"`,
                p.email,
                p.phone,
                `"${p.bankSampah}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `daftar_petugas_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showStandaloneToast('success', 'Export Berhasil', `${filteredPetugas.length} data petugas berhasil diekspor.`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#3B8A51] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Memuat data petugas...</p>
                </div>
            </div>
        );
    }

    if (selectedPetugas) {
        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm font-medium mb-4">
                    <button
                        onClick={() => setSelectedPetugas(null)}
                        className="text-[#3B8A51] hover:underline cursor-pointer"
                    >
                        Petugas
                    </button>
                    <i className="fas fa-chevron-right text-[10px] text-gray-300"></i>
                    <span className="text-[#3B8A51] font-bold">{selectedPetugas.name}</span>
                </div>

                {/* Detail Information Card */}
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    { label: 'Id petugas', value: selectedPetugas.id },
                                    { label: 'Nama petugas', value: selectedPetugas.name },
                                    { label: 'Email', value: selectedPetugas.email },
                                    { label: 'Nomor HP', value: selectedPetugas.phone },
                                    { label: 'Bank Sampah', value: selectedPetugas.bankSampah },
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

                {/* Informasi Personal Form */}
                <div className="bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8 border-t-[1px]">
                    <h3 className="text-xl font-bold text-[#3B8A51] mb-8">Informasi Personal</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-[#3B8A51] mb-2 ml-4 flex items-center gap-2">
                                Email
                                <span className="text-[10px] text-gray-400 font-normal italic">(Diubah pada saat tertentu saja)</span>
                            </label>
                            <input
                                type="email"
                                value={editedData?.email ?? selectedPetugas.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#3B8A51] text-sm text-gray-500 font-medium bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#3B8A51] mb-2 ml-4 text-center md:text-left">Lokasi Bank Sampah (Tempat Bertugas)</label>
                            <select
                                value={editedData?.bankSampahId || selectedPetugas.bankSampahId || ''}
                                onChange={(e) => handleInputChange('bankSampahId', e.target.value)}
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-[#3B8A51] text-sm text-gray-500 font-medium bg-white cursor-pointer appearance-none"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 1.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                            >
                                <option value="">Pilih Bank Sampah</option>
                                {banks.map((bank) => (
                                    <option key={bank.id} value={bank.id}>{bank.nama}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={handleSaveChanges}
                                className="bg-[#3B8A51] hover:bg-primary-dark text-white font-bold py-3 px-16 rounded-2xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/Petugas.svg" alt="Petugas" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Daftar Seluruh Petugas</h1>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari Petugas"
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
                            className="appearance-none bg-white text-[#3B8A51] border border-gray-100 rounded-full px-6 py-2.5 pr-12 text-xs font-bold text-primary shadow-sm focus:outline-none cursor-pointer max-w-[200px] truncate"
                        >
                            <option value="">Bank Sampah</option>
                            {banks.map((bank) => (
                                <option key={bank.id} value={bank.id}>{bank.nama}</option>
                            ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-[#3B8A51] pointer-events-none"></i>
                    </div>

                    <button className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer" onClick={() => setShowAddModal(true)}>
                        <i className="fas fa-plus"></i>
                        Tambah Petugas
                    </button>

                    <button onClick={handleExportCSV} className="bg-[#3B8A51] hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer">
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
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Nama Petugas</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Email</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Nomor HP</th>
                                <th className="px-8 py-5 border-r border-white/20 last:border-0">Bank Sampah</th>
                                <th className="px-8 py-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPetugas.map((petugas, idx) => (
                                <tr key={idx} className="hover:bg-tertiary/30 transition-colors group border-b border-gray-50 last:border-0">
                                    <td
                                        className="px-8 py-6 font-bold text-[#3B8A51] group-hover:pl-10 transition-all duration-300 cursor-pointer hover:underline"
                                        onClick={() => handleSelectPetugas(petugas)}
                                    >
                                        {petugas.name}
                                    </td>
                                    <td className="px-8 py-6 text-gray-400 font-medium">{petugas.email}</td>
                                    <td className="px-8 py-6 text-gray-400 font-medium">{petugas.phone}</td>
                                    <td className="px-8 py-6 text-primary font-medium text-xs max-w-[200px]">{petugas.bankSampah}</td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleSelectPetugas(petugas)}
                                                className="bg-[#3B8A51] hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPetugasToDelete(petugas);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="bg-[#D32F2F] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPetugas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                                        Belum ada data petugas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - only show if more than 10 items */}
            {filteredPetugas.length > 10 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                    <button className="w-10 h-10 rounded-lg bg-[#3B8A51] text-white text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition-all">1</button>
                    <div className="flex items-center gap-1">
                        <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all active:scale-95">2</button>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-[#3B8A51] text-white text-sm font-bold flex items-center justify-center hover:bg-primary-dark transition-all shadow-md active:scale-90 cursor-pointer ml-2">
                        <i className="fas fa-chevron-right text-[12px]"></i>
                    </button>
                </div>
            )}

            {/* Add Officer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-primary mb-6">Tambah Petugas Baru</h2>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Nama Lengkap*</label>
                                <input
                                    type="text"
                                    value={newOfficer.name}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Email*</label>
                                <input
                                    type="email"
                                    value={newOfficer.email}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                    placeholder="contoh@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Nomor HP*</label>
                                <input
                                    type="tel"
                                    value={newOfficer.phone}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Bank Sampah*</label>
                                <select
                                    value={newOfficer.bankSampahId}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, bankSampahId: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                >
                                    <option value="">Pilih Bank Sampah</option>
                                    {banks.map((bank) => (
                                        <option key={bank.id} value={bank.id}>{bank.nama}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddOfficer}
                                disabled={!newOfficer.name.trim() || !newOfficer.email.trim() || !newOfficer.phone.trim() || !newOfficer.bankSampahId || isSubmitting}
                                className="flex-1 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Tambah Petugas'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Notification with Credentials */}
            {showSuccess && generatedCredentials && generatedCredentials.email !== 'DELETE_SUCCESS' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Petugas Berhasil Ditambahkan!</h3>
                            <p className="text-gray-600 text-sm mb-6">Akun petugas telah dibuat. Berikan credentials berikut kepada petugas:</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Email (Login)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedCredentials.email}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCredentials.email);
                                            setCopiedEmail(true);
                                            setTimeout(() => setCopiedEmail(false), 2000);
                                        }}
                                        className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary-dark transition cursor-pointer min-w-[80px]"
                                    >
                                        {copiedEmail ? (
                                            <>
                                                <i className="fas fa-check mr-1"></i>
                                                Tersalin!
                                            </>
                                        ) : (
                                            <i className="fas fa-copy"></i>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Password (Temporary)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={generatedCredentials.password}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCredentials.password);
                                            setCopiedPassword(true);
                                            setTimeout(() => setCopiedPassword(false), 2000);
                                        }}
                                        className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary-dark transition cursor-pointer min-w-[80px]"
                                    >
                                        {copiedPassword ? (
                                            <>
                                                <i className="fas fa-check mr-1"></i>
                                                Tersalin!
                                            </>
                                        ) : (
                                            <i className="fas fa-copy"></i>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                            <p className="text-xs text-yellow-800 font-bold">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                PERHATIAN: Credentials ini hanya ditampilkan sekali!
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                                Pastikan Anda sudah menyalin email dan password sebelum menutup jendela ini.
                            </p>
                        </div>

                        <div className="bg-tertiary rounded-xl p-3 mb-6">
                            <p className="text-xs font-bold text-primary">
                                <i className="fas fa-info-circle mr-2"></i>
                                Petugas wajib mengganti password saat login pertama kali.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                setGeneratedCredentials(null);
                            }}
                            className="w-full px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition shadow-md cursor-pointer"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-trash text-warning text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-red-500 mb-2">Hapus Petugas?</h3>
                            <p className="text-gray-600 text-sm">Apakah Anda yakin ingin menghapus <span className="font-bold">{petugasToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary hover:text-white transition cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteOfficer}
                                className="flex-1 px-6 py-3 bg-warning text-white rounded-full font-bold hover:bg-red-600 transition cursor-pointer"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Success Notification */}
            {showEditSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Mengubah Data!</h3>
                            <p className="text-gray-600 text-sm">Data petugas telah diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Success Notification */}
            {showSuccess && generatedCredentials?.email === 'DELETE_SUCCESS' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Menghapus!</h3>
                            <p className="text-gray-600 text-sm">Data petugas telah dihapus.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
