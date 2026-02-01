import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { showStandaloneToast } from '@/components/shared/Toast';

export default function ProfilAdmin() {
    const { admin, isLoading, updateAdmin } = useAdmin();
    const [formData, setFormData] = useState({
        nama: '',
        email: '',
        noHp: '',
        kelurahan: '',
        operatingDays: '',
        operatingHours: ''
    });

    useEffect(() => {
        if (admin) {
            setFormData({
                nama: admin.nama || '',
                email: admin.email || '',
                noHp: admin.noHp || '',
                kelurahan: admin.kelurahan || '',
                operatingDays: admin.operatingDays || 'Senin s.d Jumat',
                operatingHours: admin.operatingHours || '08.00 - 16:30'
            });
        }
    }, [admin]);

    const handleSave = async () => {
        if (admin) {
            try {
                await updateAdmin({
                    nama: formData.nama,
                    email: formData.email,
                    noHp: formData.noHp,
                    kelurahan: formData.kelurahan,
                    operatingDays: formData.operatingDays,
                    operatingHours: formData.operatingHours
                });
                showStandaloneToast('success', 'Berhasil', 'Profil admin berhasil diperbarui');
            } catch (error) {
                showStandaloneToast('error', 'Gagal', 'Terjadi kesalahan saat menyimpan profil');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!admin) {
        return (
            <div className="text-center py-20 text-gray-400">
                <i className="fas fa-user-slash text-4xl mb-4"></i>
                <p>Data admin tidak tersedia</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                    <i className="fas fa-user-shield text-xl"></i>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Profil Admin</h1>
                    <p className="text-sm text-gray-500">Informasi akun administrator sistem OSKU</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col md:flex-row gap-10 items-center md:items-center">
                {/* Avatar Section */}
                {/* Avatar Section Removed */}
                { /* Wrapper for ID and Role */}
                <div className="flex flex-col items-center gap-4 min-w-[200px]">
                    <div className="w-32 h-32 rounded-3xl bg-tertiary flex items-center justify-center border-2 border-primary/10 relative overflow-hidden group">
                        <i className="fas fa-user-shield text-5xl text-primary group-hover:scale-110 transition-transform duration-300"></i>
                    </div>
                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>

                </div>

                {/* Edit Form Section */}
                <div className="flex-grow w-full space-y-6">
                    <h3 className="text-lg font-bold text-primary mb-4">Pengaturan Profil</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ID Admin</label>
                            <input
                                type="text"
                                value={admin.id}
                                disabled
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nama Tampilan</label>
                            <input
                                type="text"
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                            <input
                                type="text"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nomor HP</label>
                                <input
                                    type="text"
                                    value={formData.noHp}
                                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Kelurahan (Area)</label>
                                <input
                                    type="text"
                                    value={formData.kelurahan}
                                    onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Operating Hours Section */}
                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                <i className="far fa-clock"></i>
                                Jam Operasional (Pusat Informasi)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">Informasi ini akan ditampilkan di halaman Pusat Informasi untuk pengguna.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hari Operasional</label>
                                    <input
                                        type="text"
                                        value={formData.operatingDays}
                                        onChange={(e) => setFormData({ ...formData, operatingDays: e.target.value })}
                                        placeholder="Contoh: Senin s.d Jumat"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Jam Operasional</label>
                                    <input
                                        type="text"
                                        value={formData.operatingHours}
                                        onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                                        placeholder="Contoh: 08.00 - 16:30"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={handleSave}
                                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer w-full md:w-auto"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
