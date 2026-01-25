'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBerita, Berita } from '@/contexts/BeritaContext';

interface AddBeritaModalProps {
    onClose: () => void;
    onSuccess?: (isEdit: boolean) => void;
    editingBerita?: Berita | null;
}

export default function AddBeritaModal({ onClose, onSuccess, editingBerita }: AddBeritaModalProps) {
    const { addBerita, updateBerita } = useBerita();
    const isEditMode = !!editingBerita;

    // Auto-detect admin name from session or fallback
    const adminName = typeof window !== 'undefined'
        ? (sessionStorage.getItem('userName') || sessionStorage.getItem('fullName') || 'Admin OSKU')
        : 'Admin OSKU';

    const [formData, setFormData] = useState({
        judul: '',
        tanggal: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        author: adminName,
        ringkasan: '',
        kontenLengkap: '',
    });

    // Load editing berita data when in edit mode
    useEffect(() => {
        if (editingBerita) {
            setFormData({
                judul: editingBerita.judul,
                tanggal: editingBerita.tanggal,
                author: editingBerita.author,
                ringkasan: editingBerita.ringkasan,
                kontenLengkap: editingBerita.kontenLengkap,
            });
        }
    }, [editingBerita]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.judul || !formData.ringkasan || !formData.kontenLengkap) {
            alert('Judul, ringkasan, dan konten lengkap wajib diisi!');
            return;
        }

        // Format date to "DD MMM YYYY"
        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        };

        const dataToSave = {
            ...formData,
            tanggal: formatDate(formData.tanggal),
        };

        if (isEditMode && editingBerita) {
            updateBerita(editingBerita.id, dataToSave);
        } else {
            addBerita(dataToSave);
        }

        // Trigger success callback
        if (onSuccess) {
            onSuccess(isEditMode);
        }

        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                        {isEditMode ? (
                            <i className="fas fa-edit text-2xl"></i>
                        ) : (
                            <Image
                                src="/icon/Newspaper.svg"
                                alt="Berita"
                                width={24}
                                height={24}
                                className="brightness-0 invert"
                            />
                        )}
                        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Tambah'} Berita</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-custom">
                    <div className="p-8 pr-6 space-y-6">
                        {/* Judul Berita */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Judul Berita <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="judul"
                                value={formData.judul}
                                onChange={handleChange}
                                placeholder="Contoh: Perubahan harga sampah"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                required
                            />
                        </div>

                        {/* Tanggal & Author */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Tanggal Berita
                                </label>
                                <input
                                    type="date"
                                    name="tanggal"
                                    value={formData.tanggal}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Penulis
                                </label>
                                <input
                                    type="text"
                                    name="author"
                                    value={formData.author}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-sm text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Terdeteksi otomatis dari akun admin</p>
                            </div>
                        </div>

                        {/* Ringkasan */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Ringkasan Berita <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="ringkasan"
                                value={formData.ringkasan}
                                onChange={handleChange}
                                placeholder="Ringkasan singkat berita (akan ditampilkan di card)"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                rows={3}
                                required
                            />
                        </div>

                        {/* Berita Lengkap */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Berita Lengkap <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="kontenLengkap"
                                value={formData.kontenLengkap}
                                onChange={handleChange}
                                placeholder="Tulis konten berita lengkap di sini..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                rows={8}
                                required
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-tertiary rounded-xl p-4">
                            <div className="flex gap-3">
                                <i className="fas fa-info-circle text-primary mt-0.5"></i>
                                <div className="text-sm text-primary">
                                    <p className="font-bold mb-1">Informasi</p>
                                    <p>Berita yang {isEditMode ? 'diubah' : 'ditambahkan'} akan langsung {isEditMode ? 'diperbarui' : 'muncul'} di:</p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Dashboard Nasabah (Berita Terkini)</li>
                                        <li>Halaman Berita Nasabah</li>
                                        <li>Dashboard Admin (Daftar Berita)</li>
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
                                {isEditMode ? 'Simpan Perubahan' : 'Tambah Berita'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
