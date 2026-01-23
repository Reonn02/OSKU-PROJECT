'use client';

import { useState, useEffect } from 'react';
import { WasteType } from '@/contexts/BankSampahContext';

interface AddWasteTypeModalProps {
    bankId: string;
    bankName: string;
    onClose: () => void;
    onSuccess?: (formData: { nama: string; satuan: 'kg' | 'ltr' | 'pcs'; hargaPerSatuan: number }, isEdit: boolean) => void;
    editingWasteType?: WasteType | null;
}

export default function AddWasteTypeModal({
    bankId,
    bankName,
    onClose,
    onSuccess,
    editingWasteType
}: AddWasteTypeModalProps) {
    const isEditMode = !!editingWasteType;

    const [formData, setFormData] = useState({
        nama: '',
        satuan: 'kg' as 'kg' | 'ltr' | 'pcs',
        hargaPerSatuan: 0
    });

    // Load editing data
    useEffect(() => {
        if (editingWasteType) {
            setFormData({
                nama: editingWasteType.nama,
                satuan: editingWasteType.satuan as 'kg' | 'ltr' | 'pcs',
                hargaPerSatuan: editingWasteType.hargaPerSatuan
            });
        }
    }, [editingWasteType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nama || formData.hargaPerSatuan <= 0) {
            alert('Nama dan harga harus diisi dengan benar!');
            return;
        }

        // Call success callback with form data
        if (onSuccess) {
            onSuccess(formData, isEditMode);
        }

        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'hargaPerSatuan' ? Number(value) : value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="bg-primary text-white px-8 py-6 rounded-t-3xl flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {isEditMode ? 'Edit' : 'Tambah'} Jenis Sampah
                        </h2>
                        <p className="text-sm text-white/80 mt-1">{bankName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Nama Jenis Sampah */}
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">
                            Nama Jenis Sampah <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama"
                            value={formData.nama}
                            onChange={handleChange}
                            placeholder="Contoh: Botol Plastik"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                            required
                        />
                    </div>

                    {/* Satuan */}
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">
                            Satuan <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="satuan"
                            value={formData.satuan}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm cursor-pointer"
                        >
                            <option value="kg">Kilogram (kg)</option>
                            <option value="ltr">Liter (ltr)</option>
                            <option value="pcs">Pieces (pcs)</option>
                        </select>
                    </div>

                    {/* Harga Per Satuan */}
                    <div>
                        <label className="block text-sm font-bold text-primary mb-2">
                            Harga Per Satuan <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                            <input
                                type="number"
                                name="hargaPerSatuan"
                                value={formData.hargaPerSatuan}
                                onChange={handleChange}
                                placeholder="3000"
                                min="0"
                                step="100"
                                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Contoh: Rp 3.000 untuk 1 kg botol plastik
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-tertiary rounded-xl p-4">
                        <div className="flex gap-3">
                            <i className="fas fa-info-circle text-primary mt-0.5"></i>
                            <div className="text-sm text-primary">
                                <p className="font-bold mb-1">Informasi</p>
                                <p>Jenis sampah yang {isEditMode ? 'diubah' : 'ditambahkan'} akan langsung tersedia untuk transaksi penyetoran.</p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition shadow-md"
                        >
                            <i className={`fas ${isEditMode ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                            {isEditMode ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
