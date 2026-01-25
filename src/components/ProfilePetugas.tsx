'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from './Toast';
import { supabase } from '@/lib/supabase';

interface PetugasData {
    id: string;
    nama: string;
    email: string;
    noHp: string | null;
    bankSampahId: string | null;
    bankSampahNama: string | null;
}

interface ProfileFormData {
    namaTampilan: string;
    nomorHP: string;
}

export default function ProfilePetugas() {
    const [petugasData, setPetugasData] = useState<PetugasData | null>(null);
    const [formData, setFormData] = useState<ProfileFormData>({
        namaTampilan: '',
        nomorHP: ''
    });

    // Load petugas data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData) as PetugasData;
                setPetugasData(data);
                setFormData({
                    namaTampilan: data.nama || '',
                    nomorHP: data.noHp || ''
                });
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, []);

    const handleSave = async () => {
        if (petugasData) {
            try {
                // Update Supabase
                const { error } = await supabase
                    .from('petugas')
                    .update({
                        nama: formData.namaTampilan,
                        no_hp: formData.nomorHP
                    })
                    .eq('id', petugasData.id);

                if (error) throw error;

                // Update petugasData di localStorage
                const updatedData = {
                    ...petugasData,
                    nama: formData.namaTampilan || petugasData.nama,
                    noHp: formData.nomorHP
                };
                localStorage.setItem('petugasData', JSON.stringify(updatedData));
                setPetugasData(updatedData);

                // Trigger event untuk update sidebar
                window.dispatchEvent(new Event('profileUpdated'));

                showStandaloneToast('success', 'Berhasil Disimpan!', 'Perubahan profil berhasil disimpan ke database.');
            } catch (error) {
                console.error('Error updating petugas:', error);
                showStandaloneToast('error', 'Gagal', 'Gagal menyimpan perubahan profil.');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 flex items-center justify-center">
                    <Image src="/icon/profil.svg" alt="Profile" width={24} height={24} className="filter-primary" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Profil</h1>
            </div>

            {/* Banner Section */}
            <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-6 sm:p-8 relative overflow-hidden h-[200px] sm:h-[220px] flex flex-col justify-start">
                <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">Lengkapi Data Diri Anda!</h2>
                    <p className="text-gray-500 font-medium text-sm sm:text-base">Pastikan data anda lengkap dan sesuai</p>
                </div>
                <div className="absolute bottom-2 sm:bottom-4 w-full flex justify-center pointer-events-none">
                    <Image
                        src="/images/AdminProfileImage.svg"
                        alt="Profile Illustration"
                        width={400}
                        height={200}
                        className="w-[320px] sm:w-[380px] lg:w-[420px] object-contain object-bottom translate-y-2 md:translate-y-4"
                    />
                </div>
            </div>

            {/* Biodata Petugas Section */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                <h2 className="text-2xl font-bold text-primary-light text-center mb-10">Biodata Petugas</h2>
                <div className="max-w-4xl mx-auto overflow-x-auto">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                            {[
                                { label: 'Id Petugas', value: petugasData?.id || '-' },
                                { label: 'Nama Tampilan', value: formData.namaTampilan || petugasData?.nama || '-' },
                                { label: 'Email', value: petugasData?.email || '-' },
                                { label: 'Nomor HP', value: formData.nomorHP || petugasData?.noHp || '-' },
                                { label: 'Lokasi Bertugas', value: petugasData?.bankSampahNama || '-' },
                            ].map((item, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 font-bold text-primary w-1/3">{item.label}</td>
                                    <td className="py-4 text-gray-400 font-medium">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pengaturan Profil Section */}
            <div className="space-y-8 pb-10">
                <h2 className="text-2xl font-bold text-primary-light">Pengaturan Profil</h2>

                {/* Informasi Personal Form */}
                <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-xl font-bold text-primary-light mb-8">Informasi Personal</h3>
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Nama Tampilan */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">Nama Tampilan</label>
                            <input
                                type="text"
                                value={formData.namaTampilan}
                                onChange={(e) => setFormData({ ...formData, namaTampilan: e.target.value })}
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white shadow-sm transition-all"
                            />
                        </div>
                        {/* Nomor HP */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 ml-1">Nomor HP</label>
                            <input
                                type="tel"
                                value={formData.nomorHP}
                                onChange={(e) => setFormData({ ...formData, nomorHP: e.target.value })}
                                className="w-full px-6 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white shadow-sm transition-all"
                            />
                        </div>
                        {/* Static Info (Non-editable) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 ml-1">ID Petugas</label>
                                <div className="w-full px-6 py-3.5 rounded-full border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">
                                    {petugasData?.id || '-'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 ml-1">Email</label>
                                <div className="w-full px-6 py-3.5 rounded-full border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500">
                                    {petugasData?.email || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={handleSave}
                                className="bg-primary hover:bg-primary-dark text-white px-12 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 italic">
                            Email dan Password hanya dapat diubah melalui fitur "Lupa Password" saat login. Lokasi Bertugas diatur oleh Admin.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
