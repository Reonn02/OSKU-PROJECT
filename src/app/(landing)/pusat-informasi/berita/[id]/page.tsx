'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useBeritaKegiatan } from '@/contexts/BeritaKegiatanContext';

export default function DetailBeritaPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const { getBeritaKegiatanById, isLoading, beritaKegiatan, refreshBeritaKegiatan } = useBeritaKegiatan();
    const berita = getBeritaKegiatanById(id);

    // Initial load check - if accessing directly and data is empty, might need to wait for context to load
    // The context already has useEffect to fetch on mount, so isLoading should handle it.

    if (isLoading) {
        return (
            <div className="font-sans antialiased text-gray-900 bg-white min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                        <p className="text-gray-500">Memuat berita...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!berita) {
        return (
            <div className="font-sans antialiased text-gray-900 bg-white min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow container mx-auto px-4 py-32 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="far fa-newspaper text-4xl text-gray-300"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Berita Tidak Ditemukan</h1>
                        <p className="text-gray-500 mb-8">Maaf, berita yang Anda cari tidak dapat ditemukan atau telah dihapus.</p>
                        <Link
                            href="/pusat-informasi"
                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Kembali ke Pusat Informasi
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="font-sans antialiased text-gray-900 bg-white min-h-screen flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    {/* Breadcrumb / Back */}
                    <div className="mb-8">
                        <Link
                            href="/pusat-informasi"
                            className="inline-flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity"
                        >
                            <i className="fas fa-arrow-left"></i>
                            Kembali ke Pusat Informasi
                        </Link>
                    </div>

                    {/* Header Section */}
                    <div className="mb-8">
                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-6 leading-tight">
                            {berita.judul}
                        </h1>
                    </div>

                    {/* Featured Image */}
                    <div className="rounded-3xl overflow-hidden mb-6 relative h-[300px] md:h-[500px] w-full shadow-lg border border-gray-100">
                        <Image
                            src={berita.gambar || "/images/berita_bank_sampah.png"}
                            alt={berita.judul}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Meta (Date & Author) - Moved below image */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 px-2">
                        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                            <span className="flex items-center gap-2">
                                <i className="far fa-calendar text-primary"></i>
                                {berita.tanggal}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-2">
                                <i className="far fa-user text-primary"></i>
                                {berita.author}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg prose-green max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {berita.kontenLengkap || berita.deskripsi}
                    </div>

                    {/* Share / Tags could go here */}
                </div>
            </main>

            <Footer />
        </div>
    );
}
