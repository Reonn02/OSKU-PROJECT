'use client';

import { useState, useEffect } from 'react';
import { useBankSampah, BankSampah, DayOfWeek } from '@/contexts/BankSampahContext';
import { showStandaloneToast } from './Toast';

interface AddBankModalProps {
    onClose: () => void;
    onSuccess?: (isEdit: boolean) => void;
    editingBank?: BankSampah | null;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function AddBankModal({ onClose, onSuccess, editingBank }: AddBankModalProps) {
    const { addBank, updateBank } = useBankSampah();
    const isEditMode = !!editingBank;

    const [formData, setFormData] = useState({
        nama: '',
        alamat: '',
        openDay: 'Senin' as DayOfWeek,
        closeDay: 'Jumat' as DayOfWeek,
        openTime: '08:00',
        closeTime: '16:30',
        kontakLayanan: '',
        image: '/images/location1.svg'
    });

    // Load editing bank data when in edit mode
    useEffect(() => {
        if (editingBank) {
            setFormData({
                nama: editingBank.nama,
                alamat: editingBank.alamat,
                openDay: editingBank.openDay || 'Senin',
                closeDay: editingBank.closeDay || 'Jumat',
                openTime: editingBank.openTime,
                closeTime: editingBank.closeTime,
                kontakLayanan: editingBank.kontakLayanan || '',
                image: editingBank.image
            });
        }
    }, [editingBank]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nama || !formData.alamat) {
            showStandaloneToast('warning', 'Form Belum Lengkap', 'Nama dan alamat wajib diisi!');
            return;
        }

        if (isEditMode && editingBank) {
            updateBank(editingBank.id, formData);
        } else {
            addBank({
                ...formData,
                wasteTypes: [], // New banks start with no waste types
                komisiPersen: 20 // Default commission percentage
            });
        }

        // Trigger success callback
        if (onSuccess) {
            onSuccess(isEditMode);
        }

        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-white px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-store'} text-2xl`}></i>
                        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Tambah'} Bank Sampah</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center">
                        <i className="fas fa-times"></i>

                    </button>

                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-8 pr-6 space-y-6">
                        {/* Nama Bank */}
                        <div>

                            <label className="block text-sm font-bold text-primary mb-2">
                                Nama Bank Sampah <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="text"
                                name="nama"
                                value={formData.nama}
                                onChange={handleChange}
                                placeholder="Contoh: Bank Sampah Makmur"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                required
                            />
                        </div>

                        {/* Kontak Layanan */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Kontak Layanan
                            </label>
                            <input
                                type="text"
                                name="kontakLayanan"
                                value={formData.kontakLayanan}
                                onChange={handleChange}
                                placeholder="Contoh: 0812-3456-7890"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                maxLength={50}
                            />
                            <p className="text-xs text-gray-500 mt-1">Nomor telepon atau WhatsApp untuk menghubungi bank sampah (opsional)</p>
                        </div>

                        {/* Alamat */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Alamat Lengkap <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="alamat"
                                value={formData.alamat}
                                onChange={handleChange}
                                placeholder="Contoh: Jl. Raya Ciracas RT 01 RW 02"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                rows={3}
                                required
                            />
                        </div>

                        {/* Hari Operasional */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Hari Buka
                                </label>
                                <select
                                    name="openDay"
                                    value={formData.openDay}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm cursor-pointer"
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Hari Tutup
                                </label>
                                <select
                                    name="closeDay"
                                    value={formData.closeDay}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm cursor-pointer"
                                >
                                    {DAYS_OF_WEEK.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Jam Operasional */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Jam Buka
                                </label>
                                <input
                                    type="time"
                                    name="openTime"
                                    value={formData.openTime}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Jam Tutup
                                </label>
                                <input
                                    type="time"
                                    name="closeTime"
                                    value={formData.closeTime}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-tertiary  rounded-xl p-4">
                            <div className="flex gap-3">
                                <i className="fas fa-info-circle text-primary mt-0.5"></i>
                                <div className="text-sm text-primary">
                                    <p className="font-bold mb-1">Informasi</p>
                                    <p>Bank sampah yang {isEditMode ? 'diubah' : 'ditambahkan'} akan langsung {isEditMode ? 'diperbarui' : 'muncul'} di:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Halaman Lokasi (Landing Page)</li>
                                        <li>Pilihan Penyetoran (Dashboard Nasabah)</li>
                                        <li>Daftar Bank Sampah (Halaman ini)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
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
                                {isEditMode ? 'Simpan Perubahan' : 'Tambah Bank Sampah'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
