'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FAQItem {
    question: string;
    answer: string;
}

interface BantuanContentProps {
    role: 'admin' | 'petugas' | 'nasabah';
}

export default function BantuanContent({ role }: BantuanContentProps) {
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [activeSection, setActiveSection] = useState<'faq' | 'panduan'>('faq');


    // FAQ items based on role
    const faqItems: FAQItem[] = role === 'admin' ? [
        {
            question: 'Bagaimana cara menambahkan Bank Sampah baru?',
            answer: 'Buka menu "Bank Sampah" di sidebar, lalu klik tombol "Tambah Bank Sampah". Isi form dengan data lengkap seperti nama, alamat, jam operasional, dan jenis sampah yang diterima.'
        },
        {
            question: 'Bagaimana cara mengelola data Petugas?',
            answer: 'Akses menu "Petugas" di sidebar untuk melihat daftar petugas. Anda dapat menambah, mengedit, atau menghapus data petugas. Setiap petugas akan ditugaskan ke Bank Sampah tertentu.'
        },
        {
            question: 'Bagaimana cara melihat laporan total saldo?',
            answer: 'Di Dashboard, Anda dapat melihat chart "Total Saldo Bank Sampah" yang menampilkan akumulasi saldo dari semua Bank Sampah. Gunakan filter tahun untuk melihat data per periode.'
        },
        {
            question: 'Bagaimana cara menambahkan Berita atau Kegiatan?',
            answer: 'Buka menu "Berita" atau "Berita Kegiatan" di sidebar. Klik tombol tambah, lalu isi judul, konten, dan upload gambar jika diperlukan.'
        },
        {
            question: 'Bagaimana cara melihat data Nasabah?',
            answer: 'Akses menu "Nasabah" untuk melihat daftar semua nasabah yang terdaftar di sistem. Anda dapat melihat detail profil, saldo, dan riwayat transaksi masing-masing nasabah.'
        },
        {
            question: 'Bagaimana cara export data ke CSV?',
            answer: 'Pada chart "Total Saldo Bank Sampah", klik tombol "Export CSV" di pojok kanan atas chart. Data akan diunduh dalam format CSV sesuai tahun yang dipilih.'
        }
    ] : role === 'petugas' ? [
        {
            question: 'Bagaimana cara memproses penyetoran sampah nasabah?',
            answer: 'Buka menu "Penyetoran" di sidebar. Pilih nasabah, masukkan jenis dan berat sampah, lalu sistem akan otomatis menghitung saldo. Klik "Simpan" untuk menyimpan transaksi.'
        },
        {
            question: 'Bagaimana cara mengubah harga jenis sampah?',
            answer: 'Akses menu "Harga Sampah" di sidebar. Anda dapat mengedit harga per satuan untuk setiap jenis sampah, atau menambahkan jenis sampah baru.'
        },
        {
            question: 'Bagaimana cara menyetujui pengajuan pencairan?',
            answer: 'Buka menu "Persetujuan" untuk melihat daftar pengajuan pencairan dari nasabah. Review detail pengajuan, lalu klik "Setujui" atau "Tolak".'
        },
        {
            question: 'Bagaimana cara melihat data nasabah?',
            answer: 'Akses menu "Nasabah" untuk melihat daftar nasabah yang terdaftar di Bank Sampah Anda. Anda dapat melihat detail profil, saldo, dan riwayat penyetoran.'
        },
        {
            question: 'Bagaimana cara melihat laporan penyetoran?',
            answer: 'Buka menu "Laporan" untuk melihat rekapitulasi penyetoran sampah. Anda dapat filter berdasarkan periode waktu dan jenis sampah.'
        },
        {
            question: 'Bagaimana cara konfirmasi transaksi?',
            answer: 'Akses menu "Konfirmasi" untuk memverifikasi transaksi yang pending. Pastikan data sudah benar sebelum mengkonfirmasi.'
        }
    ] : [
        {
            question: 'Bagaimana cara menyetorkan sampah?',
            answer: 'Buka tab "Penyetoran" di dashboard, pilih lokasi Bank Sampah terdekat, lalu hitung estimasi saldo dengan memasukkan jenis dan berat sampah. Datang ke Bank Sampah untuk menyetorkan sampah Anda.'
        },
        {
            question: 'Bagaimana cara mencairkan saldo?',
            answer: 'Buka tab "Pencairan" di dashboard, masukkan nominal yang ingin dicairkan (maksimal sesuai saldo Anda), lalu submit pengajuan. Petugas akan memproses pengajuan Anda.'
        },
        {
            question: 'Bagaimana cara melihat riwayat transaksi?',
            answer: 'Di tab "Beranda", scroll ke bawah untuk melihat riwayat penyetoran dan pencairan Anda. Setiap transaksi menampilkan tanggal, jenis, dan nominalnya.'
        },
        {
            question: 'Bagaimana cara mengubah data profil?',
            answer: 'Buka tab "Profil" di dashboard, klik "Edit Profil", lalu ubah data yang diperlukan seperti nama, nomor telepon, atau alamat.'
        },
        {
            question: 'Bagaimana cara mengetahui harga sampah?',
            answer: 'Di tab "Penyetoran", pilih lokasi Bank Sampah untuk melihat daftar harga sampah per jenis. Setiap Bank Sampah mungkin memiliki harga yang berbeda.'
        }
    ];

    // Panduan items based on role
    const panduanItems = role === 'admin' ? [
        {
            title: 'Mengelola Bank Sampah',
            icon: 'fas fa-store',
            steps: [
                'Buka menu "Bank Sampah" di sidebar',
                'Klik "Tambah Bank Sampah" untuk menambah baru',
                'Isi data: nama, alamat, jam operasional',
                'Tambahkan jenis sampah dan harganya',
                'Klik "Simpan" untuk menyimpan data'
            ]
        },
        {
            title: 'Mengelola Petugas',
            icon: '/icon/Petugas.svg',
            steps: [
                'Buka menu "Petugas" di sidebar',
                'Klik "Tambah Petugas" untuk daftar baru',
                'Isi data petugas dan pilih Bank Sampah',
                'Petugas akan menerima akses ke dashboard'
            ]
        },
        {
            title: 'Melihat Statistik',
            icon: 'fas fa-chart-bar',
            steps: [
                'Dashboard menampilkan ringkasan data',
                'Gunakan filter tahun untuk periode tertentu',
                'Chart menampilkan total saldo dan pencairan',
                'Export data ke CSV jika diperlukan'
            ]
        }
    ] : role === 'petugas' ? [
        {
            title: 'Memproses Penyetoran',
            icon: '/icon/LogoPenyetoran.svg',
            steps: [
                'Buka menu "Penyetoran" di sidebar',
                'Pilih nasabah dari daftar',
                'Masukkan jenis dan berat sampah',
                'Sistem menghitung saldo otomatis',
                'Klik "Simpan" untuk selesai'
            ]
        },
        {
            title: 'Mengelola Harga Sampah',
            icon: '/icon/pricetag.svg',
            steps: [
                'Buka menu "Harga Sampah"',
                'Klik tombol edit pada jenis sampah',
                'Ubah harga sesuai ketentuan baru',
                'Klik "Simpan" untuk konfirmasi'
            ]
        },
        {
            title: 'Memproses Pengajuan',
            icon: '/icon/mdi_approve.svg',
            steps: [
                'Buka menu "Persetujuan"',
                'Review pengajuan pencairan',
                'Verifikasi data nasabah',
                'Klik "Setujui" atau "Tolak"'
            ]
        }
    ] : [
        {
            title: 'Cara Setor Sampah',
            icon: 'fas fa-recycle',
            steps: [
                'Buka tab "Penyetoran" di dashboard',
                'Pilih lokasi Bank Sampah terdekat',
                'Hitung estimasi saldo',
                'Datang ke Bank Sampah',
                'Petugas akan memproses penyetoran'
            ]
        },
        {
            title: 'Cara Cairkan Saldo',
            icon: 'fas fa-wallet',
            steps: [
                'Buka tab "Pencairan"',
                'Masukkan nominal pencairan',
                'Submit pengajuan',
                'Tunggu persetujuan petugas',
                'Terima uang tunai di Bank Sampah'
            ]
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                    <i className="fas fa-question-circle text-2xl text-primary"></i>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Pusat Bantuan</h1>
                    <p className="text-sm text-gray-500">Temukan jawaban dan panduan penggunaan OSKU</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 inline-flex gap-2">
                <button
                    onClick={() => setActiveSection('faq')}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'faq'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-primary hover:bg-tertiary'
                        }`}
                >
                    <i className="fas fa-comments mr-2"></i>
                    FAQ
                </button>
                <button
                    onClick={() => setActiveSection('panduan')}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'panduan'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-primary hover:bg-tertiary'
                        }`}
                >
                    <i className="fas fa-book mr-2"></i>
                    Panduan
                </button>
            </div>

            {/* FAQ Section */}
            {activeSection === 'faq' && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
                    <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <i className="fas fa-question-circle text-primary/70"></i>
                        Pertanyaan yang Sering Diajukan
                    </h2>
                    <div className="space-y-3">
                        {faqItems.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-primary/30"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-tertiary/30 transition-colors"
                                >
                                    <span className="font-bold text-primary text-sm pr-4">
                                        {faq.question}
                                    </span>
                                    <i className={`fas fa-chevron-down text-primary transition-transform duration-300 ${openFAQ === index ? 'rotate-180' : ''
                                        }`}></i>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFAQ === index ? 'max-h-96' : 'max-h-0'
                                    }`}>
                                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Panduan Section */}
            {activeSection === 'panduan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {panduanItems.map((panduan, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-tertiary flex items-center justify-center">
                                    {panduan.icon.startsWith('/') ? (
                                        <Image
                                            src={panduan.icon}
                                            alt={panduan.title}
                                            width={24}
                                            height={24}
                                            className="brightness-0 saturate-100"
                                            style={{ filter: 'brightness(0) saturate(100%) invert(29%) sepia(52%) saturate(688%) hue-rotate(85deg) brightness(95%) contrast(87%)' }}
                                        />
                                    ) : (
                                        <i className={`${panduan.icon} text-xl text-primary`}></i>
                                    )}
                                </div>
                                <h3 className="font-bold text-primary">{panduan.title}</h3>
                            </div>
                            <ol className="space-y-2 ml-2">
                                {panduan.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="flex items-start gap-3 text-sm text-gray-600">
                                        <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {stepIndex + 1}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
