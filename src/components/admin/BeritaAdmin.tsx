'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useBerita } from '@/contexts/BeritaContext';
import AddBeritaModal from './AddBeritaModal';
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';

export default function BeritaAdmin() {
    const { berita, deleteBerita } = useBerita();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBeritaId, setEditingBeritaId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; beritaId: string; beritaJudul: string }>({
        isOpen: false,
        beritaId: '',
        beritaJudul: ''
    });
    const [showEditSuccess, setShowEditSuccess] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    const handleEdit = (beritaId: string) => {
        setEditingBeritaId(beritaId);
        setEditModalOpen(true);
    };

    const onEditClose = () => {
        setEditModalOpen(false);
        setEditingBeritaId(null);
        // Show success notification
        setShowEditSuccess(true);
        setTimeout(() => setShowEditSuccess(false), 3000);
    };

    const handleDelete = (beritaId: string, beritaJudul: string) => {
        setDeleteModal({ isOpen: true, beritaId, beritaJudul });
    };

    const confirmDelete = () => {
        deleteBerita(deleteModal.beritaId);
        setDeleteModal({ isOpen: false, beritaId: '', beritaJudul: '' });
        // Show success notification
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 3000);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            {/* News List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <Image src="/icon/Newspaper.svg" alt="Berita" width={24} height={24} className="filter-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary">Berita</h1>
                    </div>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all cursor-pointer"
                    >
                        <i className="fas fa-plus"></i>
                        Tambah Berita
                    </button>
                </div>

                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary text-white font-bold">
                                <tr>
                                    <th className="px-8 py-5 border-r border-white/20 text-center w-20">No</th>
                                    <th className="px-8 py-5 border-r border-white/20">Judul Berita</th>
                                    <th className="px-8 py-5 border-r border-white/20 text-center w-40">Tanggal</th>
                                    <th className="px-8 py-5 border-r border-white/20 text-center w-40">Penulis</th>
                                    <th className="px-8 py-5 text-center w-60">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {berita.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 flex items-center justify-center mb-4">
                                                    <Image src="/icon/Newspaper.svg" alt="Berita" width={40} height={40} className="grayscale opacity-40" />
                                                </div>
                                                <p className="text-gray-400 font-medium">Belum ada berita</p>
                                                <p className="text-gray-300 text-xs mt-1">Klik tombol "Tambah Berita" untuk membuat berita baru</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    berita.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-tertiary/30 transition-colors group">
                                            <td className="px-8 py-6 text-primary font-bold text-center">{idx + 1}</td>
                                            <td className="px-8 py-6 text-primary font-medium">{item.judul}</td>
                                            <td className="px-8 py-6 text-primary font-medium text-center">{item.tanggal}</td>
                                            <td className="px-8 py-6 text-primary font-medium text-center">{item.author}</td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item.id)}

                                                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.judul)}
                                                        className="bg-warning hover:bg-red-700 text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
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
                <AddBeritaModal
                    onClose={() => setAddModalOpen(false)}
                    onSuccess={(isEdit) => {
                        if (!isEdit) {
                            // Show add success (though this modal is for add only)
                            setShowEditSuccess(true);
                            setTimeout(() => setShowEditSuccess(false), 3000);
                        }
                    }}
                />
            )}

            {/* Edit Modal */}
            {editModalOpen && editingBeritaId && (
                <AddBeritaModal
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingBeritaId(null);
                    }}
                    onSuccess={() => {
                        setShowEditSuccess(true);
                        setTimeout(() => setShowEditSuccess(false), 3000);
                    }}
                    editingBerita={berita.find(b => b.id === editingBeritaId)}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, beritaId: '', beritaJudul: '' })}
                onConfirm={confirmDelete}
                bankName={deleteModal.beritaJudul}
            />

            {/* Edit Success Notification */}
            {showEditSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Mengubah Berita!</h3>
                            <p className="text-gray-600 text-sm">Berita telah diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Success Notification */}
            {showDeleteSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Menghapus Berita!</h3>
                            <p className="text-gray-600 text-sm">Berita telah dihapus.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
