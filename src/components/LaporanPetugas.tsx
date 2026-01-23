'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from './Toast';

export default function LaporanPetugas() {
    const [formData, setFormData] = useState({
        emailPengirim: '',
        emailPenerima: '',
        pesan: '',
        lampiran: [] as File[],
        lampiranPreviews: [] as string[]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        handleFileUpload(files);
    };

    // Handle file upload
    const handleFileUpload = (files: FileList | null) => {
        if (!files) return;

        const maxFiles = 4;
        const currentCount = formData.lampiran.length;
        const remainingSlots = maxFiles - currentCount;

        if (remainingSlots <= 0) {
            showStandaloneToast('warning', 'Batas Tercapai', 'Maksimal 4 file lampiran.');
            return;
        }

        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        Array.from(files).slice(0, remainingSlots).forEach((file) => {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showStandaloneToast('warning', 'File Terlalu Besar', `${file.name} melebihi 5MB.`);
                return;
            }

            newFiles.push(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        setFormData(prev => ({
                            ...prev,
                            lampiranPreviews: [...prev.lampiranPreviews, e.target!.result as string]
                        }));
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // For non-image files, use a placeholder
                newPreviews.push('');
            }
        });

        setFormData(prev => ({
            ...prev,
            lampiran: [...prev.lampiran, ...newFiles]
        }));

        if (newFiles.length > 0) {
            showStandaloneToast('success', 'File Ditambahkan', `${newFiles.length} file berhasil ditambahkan.`);
        }
    };

    // Remove file
    const removeFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            lampiran: prev.lampiran.filter((_, i) => i !== index),
            lampiranPreviews: prev.lampiranPreviews.filter((_, i) => i !== index)
        }));
    };

    // Get file icon based on type
    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return 'fa-image';
        if (file.type.includes('pdf')) return 'fa-file-pdf';
        if (file.type.includes('word') || file.type.includes('document')) return 'fa-file-word';
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'fa-file-excel';
        return 'fa-file';
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.emailPengirim || !formData.emailPenerima || !formData.pesan) {
            showStandaloneToast('warning', 'Form Belum Lengkap', 'Mohon lengkapi email pengirim, email penerima, dan pesan.');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.emailPengirim)) {
            showStandaloneToast('warning', 'Email Tidak Valid', 'Format email pengirim tidak valid.');
            return;
        }
        if (!emailRegex.test(formData.emailPenerima)) {
            showStandaloneToast('warning', 'Email Tidak Valid', 'Format email penerima tidak valid.');
            return;
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append('emailPengirim', formData.emailPengirim);
            data.append('emailPenerima', formData.emailPenerima);
            data.append('pesan', formData.pesan);

            // Append all files
            formData.lampiran.forEach((file) => {
                data.append('lampiran', file);
            });

            const response = await fetch('/api/send-report', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (result.success) {
                showStandaloneToast('success', 'Laporan Berhasil Terkirim!', `Email telah dikirim ke ${formData.emailPenerima}`);
                // Reset form
                setFormData({
                    emailPengirim: '',
                    emailPenerima: '',
                    pesan: '',
                    lampiran: [],
                    lampiranPreviews: []
                });
            } else {
                throw new Error(result.message || 'Gagal mengirim email');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showStandaloneToast('error', 'Gagal Mengirim', String(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                    <Image src="/icon/laporan.svg" alt="Laporan" width={24} height={24} className="filter-primary" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Laporan</h1>
            </div>

            {/* Info Card */}
            <div className="bg-white border border-blue-100 rounded-2xl p-5">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-3">
                        <i className="fas fa-info-circle text-primary text-xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary text-sm mb-1">Cara Mengirim Laporan</h4>
                        <p className="text-primary text-xs">
                            Isi form di bawah untuk mengirim laporan via email. Laporan akan dikirim ke email penerima yang ditentukan.
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Form Card */}
            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Email Pengirim */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-primary-light block px-1">Email Pengirim</label>
                            <input
                                type="email"
                                placeholder="Contoh@gmail.com"
                                value={formData.emailPengirim}
                                onChange={(e) => setFormData({ ...formData, emailPengirim: e.target.value })}
                                className="w-full px-6 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white placeholder:text-primary/30"
                            />
                        </div>

                        {/* Email Penerima */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-primary-light block px-1">Email Penerima</label>
                            <input
                                type="email"
                                placeholder="Contoh@gmail.com"
                                value={formData.emailPenerima}
                                onChange={(e) => setFormData({ ...formData, emailPenerima: e.target.value })}
                                className="w-full px-6 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white placeholder:text-primary/30"
                            />
                        </div>

                        {/* Pesan */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-primary-light block px-1">Pesan</label>
                            <textarea
                                rows={6}
                                placeholder="Tulis pesan Anda di sini..."
                                value={formData.pesan}
                                onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                                className="w-full px-6 py-4 rounded-[28px] border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white resize-none placeholder:text-primary/30"
                            ></textarea>
                        </div>

                        {/* Lampiran */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-primary-light block px-1">Lampiran</label>

                            {/* Drag & Drop Zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-tertiary/10 transition-all relative cursor-pointer min-h-[180px]"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                    multiple
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                    className="hidden"
                                />
                                <div className="w-14 h-14 bg-tertiary/50 rounded-2xl flex items-center justify-center">
                                    <Image src="/icon/upload.svg" alt="Upload" width={28} height={28} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-600 mb-1">
                                        Seret & lepaskan file di sini atau <span className="text-primary font-bold">Pilih file</span>
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Max 4 files • 5MB per file • Images, PDF, DOC, XLS
                                    </p>
                                </div>
                            </div>

                            {/* Uploaded Files List */}
                            {formData.lampiran.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-600">File Terlampir</h4>
                                        <span className="text-xs text-primary font-medium">{formData.lampiran.length}/4 files</span>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.lampiran.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 group hover:border-primary/30 transition-all"
                                            >
                                                {/* Thumbnail or Icon */}
                                                <div className="w-10 h-10 bg-tertiary/30 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {formData.lampiranPreviews[index] ? (
                                                        <img
                                                            src={formData.lampiranPreviews[index]}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <i className={`fas ${getFileIcon(file)} text-primary text-lg`}></i>
                                                    )}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {(file.size / 1024).toFixed(0)} KB
                                                    </p>
                                                </div>

                                                {/* Success Icon */}
                                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-check text-white text-xs"></i>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                >
                                                    <i className="fas fa-trash-alt text-warning text-sm"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-dark text-white px-16 py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Kirim
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
