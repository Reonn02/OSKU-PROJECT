'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from '@/components/shared/Toast';
import { useBankSampah, WasteType } from '@/contexts/BankSampahContext';

interface PetugasData {
    id: string;
    nama: string;
    email: string;
    noHp: string | null;
    bankSampahId: string | null;
    bankSampahNama: string | null;
}

export default function HargaSampahPetugas() {
    const { banks, addWasteType, updateWasteType, deleteWasteType, updateBank } = useBankSampah();
    const [petugasBankId, setPetugasBankId] = useState<string | null>(null);

    // Load petugas's bank ID from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData) as PetugasData;
                setPetugasBankId(data.bankSampahId);
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, []);

    // Get waste types from the petugas's assigned bank
    const selectedBank = useMemo(() => {
        if (petugasBankId) {
            return banks.find(b => b.id === petugasBankId);
        }
        return null;
    }, [banks, petugasBankId]);

    // Convert wasteTypes to display format
    const priceData = useMemo(() => {
        return (selectedBank?.wasteTypes || []).map(wt => ({
            id: wt.id,
            jenis: wt.nama,
            rawSatuan: wt.satuan,
            per: wt.satuan.charAt(0).toUpperCase() + wt.satuan.slice(1), // Capitalize first letter
            harga: wt.hargaPerSatuan
        }));
    }, [selectedBank]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Commission settings state
    const [komisiPersen, setKomisiPersen] = useState<number>(30);
    const [isSavingKomisi, setIsSavingKomisi] = useState(false);

    // Sync commission percentage from selected bank
    useEffect(() => {
        if (selectedBank) {
            setKomisiPersen(selectedBank.komisiPersen ?? 30);
        }
    }, [selectedBank]);

    // Form states
    const [jenisInput, setJenisInput] = useState('');
    const [perInput, setPerInput] = useState('');
    const [hargaInput, setHargaInput] = useState('');

    // Edit form states
    const [editJenis, setEditJenis] = useState('');
    const [editPer, setEditPer] = useState('');
    const [editHarga, setEditHarga] = useState('');

    const handleDelete = (item: any) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedBank && selectedItem) {
            deleteWasteType(selectedBank.id, selectedItem.id);
        }
        setShowDeleteModal(false);
        setSelectedItem(null);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setEditJenis(item.jenis);

        // Map display text back to value for select
        const unitValue = item.per === 'Kg' ? 'kg' :
            item.per === 'Liter' ? 'ltr' :
                item.per === 'Pcs' ? 'pcs' : 'pcs'; // default

        setEditPer(unitValue);
        setEditHarga(item.harga.toString());
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        if (!editJenis.trim() || !editPer.trim() || !editHarga.trim()) return;
        if (!selectedBank || !selectedItem) return;

        updateWasteType(selectedBank.id, selectedItem.id, {
            nama: editJenis,
            satuan: editPer.trim(),
            hargaPerSatuan: parseInt(editHarga.replace(/\D/g, ''))
        });

        showStandaloneToast('success', 'Berhasil!', `Jenis sampah "${editJenis}" berhasil diupdate`);

        setShowEditModal(false);
        setSelectedItem(null);
        setEditJenis('');
        setEditPer('');
        setEditHarga('');
    };

    const handleAdd = () => {
        if (!jenisInput.trim() || !perInput.trim() || !hargaInput.trim()) {
            showStandaloneToast('warning', 'Form Belum Lengkap', 'Mohon isi semua field!');
            return;
        }
        if (!selectedBank) {
            showStandaloneToast('error', 'Error', 'Bank sampah tidak ditemukan!');
            return;
        }

        const newWasteType: Omit<WasteType, 'id'> = {
            nama: jenisInput,
            satuan: perInput.trim(),
            hargaPerSatuan: parseInt(hargaInput.replace(/\D/g, ''))
        };

        addWasteType(selectedBank.id, newWasteType);
        showStandaloneToast('success', 'Berhasil!', `Jenis sampah "${jenisInput}" berhasil ditambahkan`);

        // Reset form and close modal
        setJenisInput('');
        setPerInput('');
        setHargaInput('');
        setShowAddModal(false);
    };

    // Save commission percentage
    const handleSaveKomisi = async () => {
        if (!selectedBank) return;
        if (komisiPersen < 0 || komisiPersen > 100) {
            showStandaloneToast('warning', 'Nilai Tidak Valid', 'Persentase komisi harus antara 0 dan 100');
            return;
        }
        setIsSavingKomisi(true);
        try {
            await updateBank(selectedBank.id, { komisiPersen });
            showStandaloneToast('success', 'Berhasil!', `Persentase komisi diubah menjadi ${komisiPersen}%`);
        } catch (error) {
            showStandaloneToast('error', 'Gagal', 'Gagal menyimpan persentase komisi');
        } finally {
            setIsSavingKomisi(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/pricetag.svg" alt="Harga Sampah" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Harga Sampah</h1>
                </div>
                {/* Add Waste Type Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Tambah Jenis Sampah
                </button>
            </div>

            {/* Commission Settings Card */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-tertiary rounded-full flex items-center justify-center">
                        <i className="fas fa-cog text-primary"></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-primary">Pengaturan Komisi Pencairan</h2>
                        <p className="text-sm text-gray-500">Atur persentase komisi yang dipotong dari setiap pencairan nasabah</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Persentase Komisi:</label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={komisiPersen}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val === '') {
                                        setKomisiPersen(0);
                                    } else {
                                        const num = parseInt(val, 10);
                                        setKomisiPersen(Math.min(100, Math.max(0, num)));
                                    }
                                }}
                                className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveKomisi}
                        disabled={isSavingKomisi || komisiPersen === (selectedBank?.komisiPersen ?? 30)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSavingKomisi ? (
                            <><i className="fas fa-spinner fa-spin"></i> Menyimpan...</>
                        ) : (
                            <><i className="fas fa-save"></i> Simpan</>
                        )}
                    </button>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-tertiary/50 rounded-lg p-3">
                    <i className="fas fa-info-circle text-primary mt-0.5"></i>
                    <span>Komisi akan dipotong dari setiap pencairan saldo nasabah ke Bank Sampah ini. Contoh: Jika nasabah mencairkan Rp 100.000 dengan komisi {komisiPersen}%, maka petugas mendapat Rp {(100000 * komisiPersen / 100).toLocaleString('id-ID')} dan nasabah menerima Rp {(100000 - (100000 * komisiPersen / 100)).toLocaleString('id-ID')}.</span>
                </div>
            </div>

            {/* Price Table Card */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 pb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-primary text-white font-bold">
                            <tr>
                                <th className="px-12 py-5 text-center">Jenis</th>
                                <th className="px-12 py-5 text-center">Per</th>
                                <th className="px-12 py-5 text-center">Harga</th>
                                <th className="px-12 py-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {priceData.map((item) => (
                                <tr key={item.id} className="hover:bg-tertiary/30 transition-colors group">
                                    <td className="px-12 py-6 text-center text-gray-500 font-medium">{item.jenis}</td>
                                    <td className="px-12 py-6 text-center text-gray-500 font-medium">{item.per}</td>
                                    <td className="px-12 py-6 text-center text-gray-500 font-medium">Rp. {item.harga.toLocaleString('id-ID')}</td>
                                    <td className="px-12 py-6 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="bg-primary hover:bg-primary-dark text-white px-8 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="bg-warning hover:bg-warning/90 text-white px-8 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Add Waste Type Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div>
                                <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-plus text-primary text-2xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-2 text-center">Tambah Jenis Sampah</h3>
                                <p className="text-gray-500 text-sm mb-6 text-center">
                                    Tambahkan jenis sampah baru ke daftar harga
                                </p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Jenis Sampah</label>
                                        <input
                                            type="text"
                                            value={jenisInput}
                                            onChange={(e) => setJenisInput(e.target.value)}
                                            placeholder="Contoh: Botol Plastik"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Per (Satuan)</label>
                                        <input
                                            type="text"
                                            value={perInput}
                                            onChange={(e) => setPerInput(e.target.value)}
                                            placeholder="Contoh: Kilogram"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Harga</label>
                                        <input
                                            type="text"
                                            value={hargaInput}
                                            onChange={(e) => setHargaInput(e.target.value)}
                                            placeholder="Contoh: 2000"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setJenisInput('');
                                            setPerInput('');
                                            setHargaInput('');
                                        }}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleAdd}
                                        disabled={!jenisInput.trim() || !perInput.trim() || !hargaInput.trim()}
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-trash text-warning text-2xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-warning mb-2">Hapus Jenis Sampah?</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Apakah Anda yakin ingin menghapus <span className="font-bold text-warning">{selectedItem?.jenis}</span> dari daftar harga?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedItem(null);
                                        }}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 bg-warning hover:bg-warning/90 text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg"
                                    >
                                        Ya, Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div>
                                <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-edit text-primary text-2xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-2 text-center">Edit Harga Sampah</h3>
                                <p className="text-gray-500 text-sm mb-6 text-center">
                                    Ubah informasi untuk <span className="font-bold text-primary">{selectedItem?.jenis}</span>
                                </p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Jenis Sampah</label>
                                        <input
                                            type="text"
                                            value={editJenis}
                                            onChange={(e) => setEditJenis(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Per (Satuan)</label>
                                        <input
                                            type="text"
                                            value={editPer}
                                            onChange={(e) => setEditPer(e.target.value)}
                                            placeholder="Contoh: Pcs, Butir, Meter"
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-2">Harga</label>
                                        <input
                                            type="text"
                                            value={editHarga}
                                            onChange={(e) => setEditHarga(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedItem(null);
                                            setEditJenis('');
                                            setEditPer('');
                                            setEditHarga('');
                                        }}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmEdit}
                                        disabled={!editJenis.trim() || !editPer.trim() || !editHarga.trim()}
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
