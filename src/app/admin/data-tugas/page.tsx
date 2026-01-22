'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AdminDataTugasContent() {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const SECRET_TOKEN = 'admin-osku-2025';

    useEffect(() => {
        if (token === SECRET_TOKEN) {
            setIsAuthorized(true);
        } else {
            setIsAuthorized(false);
        }
    }, [token]);

    if (isAuthorized === null) return null; // Loading state

    if (isAuthorized === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan atau akses ditolak.</p>
                    <Link href="/" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full transition shadow-md">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            {/* Back Button */}
            <div className="absolute top-8 left-8 md:top-12 md:left-12">
                <Link href={`/admin/data-diri?token=${SECRET_TOKEN}`} className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                    <i className="fas fa-arrow-left"></i>
                </Link>
            </div>

            <main className="flex-grow flex items-center justify-center p-4 py-20 md:py-8 text-primary">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-2">Data Tempat Bertugas</h1>
                        <p className="text-sm max-w-lg mx-auto">Isilah data tempat anda bertugas secara lengkap dibawah ini</p>
                    </div>

                    <form className="space-y-6">
                        {/* Section: Workplace Info */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {/* Opsi Bank Sampah */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Pilih Bank Sampah</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>Pilih Bank Sampah</option>
                                            <option>Bank Sampah Ciracas 01</option>
                                            <option>Bank Sampah Ciracas 02</option>
                                            <option>Bank Sampah Kelapa Dua Wetan</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* Nama Bank Sampah */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Nama Bank Sampah</label>
                                    <input
                                        type="text"
                                        placeholder="Nama Bank Sampah"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <label className="text-xs font-medium block">Alamat Kantor Bank Sampah</label>
                                <input
                                    type="text"
                                    placeholder="Alamat Lengkap Kantor"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                                />
                            </div>

                            <div className="grid md:grid-cols-4 gap-6 mb-6">
                                {/* Provinsi */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Provinsi</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>Provinsi</option>
                                            <option>DKI Jakarta</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* Kota */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Kota</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>Kota</option>
                                            <option>Jakarta Timur</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* Kecamatan */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Kecamatan</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>Kecamatan</option>
                                            <option>Ciracas</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* Kelurahan */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">Kelurahan</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>Kelurahan</option>
                                            <option>Ciracas</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* RT */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">RT</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>RT</option>
                                            <option>01</option>
                                            <option>02</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                                {/* RW */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium block">RW</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500 appearance-none bg-white">
                                            <option>RW</option>
                                            <option>01</option>
                                            <option>02</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-8 flex justify-center">
                                <Link href={`/admin/login?token=${SECRET_TOKEN}`} className="bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 px-16 rounded-full transition shadow-md">
                                    Simpan & Selesai
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default function AdminDataTugas() {
    return (
        <Suspense fallback={null}>
            <AdminDataTugasContent />
        </Suspense>
    );
}
