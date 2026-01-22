'use client';

import Image from 'next/image';
import { useBeritaKegiatan } from '@/contexts/BeritaKegiatanContext';

export default function BeritaSection() {
    const { beritaKegiatan } = useBeritaKegiatan();

    // Take only the 3 most recent berita
    const displayBerita = beritaKegiatan.slice(0, 3);

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">Berita</h2>
                    <p className="text-primary text-sm">Berita dan kegiatan Mengenai Bank Sampah di kawasan Kelurahan Ciracas</p>
                </div>

                {displayBerita.length === 0 ? (
                    // Empty State
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-xl mx-auto">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-newspaper text-4xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Belum Ada Berita</h3>
                        <p className="text-gray-400 text-sm">
                            Berita dan kegiatan terbaru dari Bank Sampah Kelurahan Ciracas akan ditampilkan di sini.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {displayBerita.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                {/* Image */}
                                <div className="h-52 bg-gray-200 w-full relative overflow-hidden">
                                    {item.gambar ? (
                                        <Image
                                            src={item.gambar}
                                            alt={item.judul}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <Image
                                            src="/images/berita_bank_sampah.png"
                                            alt={item.judul}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Date & Author */}
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                        <span>{item.tanggal}</span>
                                        <span>|</span>
                                        <span className="font-medium">{item.author}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-primary mb-3 text-lg leading-tight line-clamp-2 group-hover:text-primary-dark transition-colors">
                                        {item.judul}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-4">
                                        {item.deskripsi}
                                    </p>

                                    {/* View More Link */}
                                    <button className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary-dark transition-colors">
                                        LIHAT SELENGKAPNYA
                                        <i className="fas fa-arrow-right text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
