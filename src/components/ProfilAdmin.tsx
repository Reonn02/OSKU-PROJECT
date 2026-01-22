'use client';

import { useAdmin } from '@/contexts/AdminContext';

export default function ProfilAdmin() {
    const { admin, isLoading } = useAdmin();

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

    const profileFields = [
        { label: 'ID Admin', value: admin.id, icon: 'fa-id-badge' },
        { label: 'Nama Tampilan', value: admin.nama, icon: 'fa-user' },
        { label: 'Nomor HP', value: admin.noHp, icon: 'fa-phone' },
        { label: 'Email', value: admin.email, icon: 'fa-envelope' },
        { label: 'Kelurahan', value: admin.kelurahan, icon: 'fa-map-marker-alt' },
        { label: 'Role', value: admin.role === 'superadmin' ? 'Super Admin' : 'Admin', icon: 'fa-shield-alt' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
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
            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col md:flex-row gap-10 items-center md:items-start">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-3xl bg-tertiary flex items-center justify-center border-2 border-primary/10 relative overflow-hidden group">
                        {admin.avatar ? (
                            <img src={admin.avatar} alt={admin.nama} className="w-full h-full object-cover" />
                        ) : (
                            <i className="fas fa-user-shield text-5xl text-primary group-hover:scale-110 transition-transform duration-300"></i>
                        )}
                    </div>
                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {admin.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                    </span>
                </div>

                {/* Info Section */}
                <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileFields.map((field) => (
                        <div key={field.label} className="space-y-1.5 p-4 rounded-2xl bg-tertiary/50 border border-gray-100 hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-2 text-primary/60">
                                <i className={`fas ${field.icon} text-xs`}></i>
                                <label className="text-[10px] font-bold uppercase tracking-wider">{field.label}</label>
                            </div>
                            <p className="text-base font-bold text-primary">{field.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Note for Database */}
            <div className="bg-white rounded-xl p-4">
                <div className="flex gap-3">
                    <i className="fas fa-database text-primary mt-0.5"></i>
                    <div className="text-sm text-primary">
                        <p className="font-bold mb-1">Catatan untuk Pengembangan</p>
                        <p>Data profil admin ini menggunakan data default. Pada implementasi production, data akan diambil dari database melalui Supabase setelah proses seeding.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
