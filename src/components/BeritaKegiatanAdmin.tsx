'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useBeritaKegiatan } from '@/contexts/BeritaKegiatanContext';
import AddBeritaKegiatanModal from './AddBeritaKegiatanModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function BeritaKegiatanAdmin() {
    const { beritaKegiatan, deleteBeritaKegiatan } = useBeritaKegiatan();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBeritaId, setEditingBeritaId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; beritaId: string; beritaJudul: string }>({
        isOpen: false,
        beritaId: '',
        beritaJudul: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleEdit = (beritaId: string) => {
        setEditingBeritaId(beritaId);
        setEditModalOpen(true);
    };

    const onEditClose = () => {
        setEditModalOpen(false);
        setEditingBeritaId(null);
    };

    const handleDelete = (beritaId: string, beritaJudul: string) => {
        setDeleteModal({ isOpen: true, beritaId, beritaJudul });
    };

    const confirmDelete = () => {
        deleteBeritaKegiatan(deleteModal.beritaId);
        setDeleteModal({ isOpen: false, beritaId: '', beritaJudul: '' });
        showSuccessNotification('Berhasil menghapus berita kegiatan!');
    };

    const showSuccessNotification = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <i className="fas fa-calendar-alt text-xl text-primary"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-primary">Berita Kegiatan</h1>
                    </div>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                        <i className="fas fa-plus"></i>
                        Tambah Berita Kegiatan
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-white rounded-xl p-4">
                    <div className="flex gap-3">
                        <i className="fas fa-info-circle text-primary mt-0.5"></i>
                        <div className="text-sm text-primary bg">
                            <p>Berita kegiatan ini akan ditampilkan di halaman <strong>Pusat Informasi</strong> pada website publik. Berbeda dengan Berita untuk Nasabah yang muncul di Dashboard.</p>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary text-white font-bold">
                                <tr>
                                    <th className="px-6 py-5 border-r border-white/20 text-center w-16">No</th>
                                    <th className="px-6 py-5 border-r border-white/20 w-24">Foto</th>
                                    <th className="px-6 py-5 border-r border-white/20">Judul Berita</th>
                                    <th className="px-6 py-5 border-r border-white/20 text-center w-40">Tanggal</th>
                                    <th className="px-6 py-5 border-r border-white/20 text-center w-32">Penulis</th>
                                    <th className="px-6 py-5 text-center w-48">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {beritaKegiatan.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-16">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <i className="fas fa-calendar-alt text-4xl text-gray-300 mb-4"></i>
                                                <p className="text-gray-400 font-medium">Belum ada berita kegiatan</p>
                                                <p className="text-gray-300 text-xs mt-1">Klik tombol "Tambah Berita Kegiatan" untuk membuat berita baru</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    beritaKegiatan.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-tertiary/30 transition-colors group">
                                            <td className="px-6 py-4 text-primary font-bold text-center">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 relative">
                                                    <Image
                                                        src={item.gambar}
                                                        alt={item.judul}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-primary font-medium">{item.judul}</td>
                                            <td className="px-6 py-4 text-gray-500 text-center text-xs">{item.tanggal}</td>
                                            <td className="px-6 py-4 text-gray-500 text-center">{item.author}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item.id)}
                                                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.judul)}
                                                        className="bg-warning hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {addModalOpen && (
                <AddBeritaKegiatanModal
                    onClose={() => setAddModalOpen(false)}
                    onSuccess={() => showSuccessNotification('Berhasil menambah berita kegiatan!')}
                />
            )}

            {/* Edit Modal */}
            {editModalOpen && editingBeritaId && (
                <AddBeritaKegiatanModal
                    onClose={onEditClose}
                    onSuccess={() => showSuccessNotification('Berhasil mengubah berita kegiatan!')}
                    editingBerita={beritaKegiatan.find(b => b.id === editingBeritaId)}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, beritaId: '', beritaJudul: '' })}
                onConfirm={confirmDelete}
                bankName={deleteModal.beritaJudul}
            />

            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">{successMessage}</h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
