'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBeritaKegiatan, BeritaKegiatan } from '@/contexts/BeritaKegiatanContext';

interface AddBeritaKegiatanModalProps {
    onClose: () => void;
    onSuccess?: (isEdit: boolean) => void;
    editingBerita?: BeritaKegiatan | null;
}

export default function AddBeritaKegiatanModal({ onClose, onSuccess, editingBerita }: AddBeritaKegiatanModalProps) {
    const { addBeritaKegiatan, updateBeritaKegiatan } = useBeritaKegiatan();
    const isEditMode = !!editingBerita;

    const adminName = typeof window !== 'undefined'
        ? (sessionStorage.getItem('userName') || sessionStorage.getItem('fullName') || 'Admin OSKU')
        : 'Admin OSKU';

    const [formData, setFormData] = useState({
        judul: '',
        tanggal: new Date().toISOString().split('T')[0],
        author: adminName,
        deskripsi: '',
        kontenLengkap: '',
        gambar: '/images/berita_bank_sampah.png', // Default image
    });

    const [previewImage, setPreviewImage] = useState<string>('/images/berita_bank_sampah.png');

    useEffect(() => {
        if (editingBerita) {
            setFormData({
                judul: editingBerita.judul,
                tanggal: editingBerita.tanggal,
                author: editingBerita.author,
                deskripsi: editingBerita.deskripsi,
                kontenLengkap: editingBerita.kontenLengkap,
                gambar: editingBerita.gambar,
            });
            setPreviewImage(editingBerita.gambar);
        }
    }, [editingBerita]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // For demo: use FileReader to show preview
            // In production: upload to server/storage and get URL
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPreviewImage(base64);
                setFormData(prev => ({ ...prev, gambar: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.judul || !formData.deskripsi || !formData.kontenLengkap) {
            alert('Judul, deskripsi, dan konten lengkap wajib diisi!');
            return;
        }

        // Format date
        const formatDate = (dateStr: string) => {
            const date = new Date(dateStr);
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        };

        const dataToSave = {
            ...formData,
            tanggal: formatDate(formData.tanggal),
        };

        if (isEditMode && editingBerita) {
            updateBeritaKegiatan(editingBerita.id, dataToSave);
        } else {
            addBeritaKegiatan(dataToSave);
        }

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
                            <i className="fas fa-calendar-alt text-2xl"></i>
                        )}
                        <h2 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Tambah'} Berita Kegiatan</h2>
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
                        {/* Foto/Gambar Upload */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Foto Kegiatan
                            </label>
                            <div className="flex gap-4 items-start">
                                {/* Preview */}
                                <div className="w-40 h-28 rounded-xl overflow-hidden bg-gray-100 relative border-2 border-dashed border-gray-300">
                                    {previewImage ? (
                                        <Image src={previewImage} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <i className="far fa-image text-3xl"></i>
                                        </div>
                                    )}
                                </div>
                                {/* Upload Button */}
                                <div className="flex-1">
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <div className="px-4 py-3 bg-tertiary text-primary font-bold text-sm rounded-xl cursor-pointer hover:bg-tertiary/80 transition text-center">
                                            <i className="fas fa-upload mr-2"></i>
                                            Upload Foto
                                        </div>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG. Max 2MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Judul */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Judul Berita <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="judul"
                                value={formData.judul}
                                onChange={handleChange}
                                placeholder="Contoh: Pelatihan Bank Sampah RW 05"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                required
                            />
                        </div>

                        {/* Tanggal & Author */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-primary mb-2">
                                    Tanggal Kegiatan
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
                            </div>
                        </div>

                        {/* Deskripsi Singkat */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Deskripsi Singkat <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="deskripsi"
                                value={formData.deskripsi}
                                onChange={handleChange}
                                placeholder="Ringkasan singkat kegiatan (akan ditampilkan di card)"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                rows={3}
                                required
                            />
                        </div>

                        {/* Konten Lengkap */}
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2">
                                Konten Lengkap <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="kontenLengkap"
                                value={formData.kontenLengkap}
                                onChange={handleChange}
                                placeholder="Tulis konten berita lengkap di sini..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                rows={6}
                                required
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-tertiary rounded-xl p-4">
                            <div className="flex gap-3">
                                <i className="fas fa-info-circle text-primary mt-0.5"></i>
                                <div className="text-sm text-primary">
                                    <p className="font-bold mb-1">Informasi</p>
                                    <p>Berita kegiatan yang {isEditMode ? 'diubah' : 'ditambahkan'} akan langsung tampil di halaman <strong>Pusat Informasi</strong> pada website publik.</p>
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
