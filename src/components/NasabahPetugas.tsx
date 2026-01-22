'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllNasabah, formatSaldo, NasabahData } from '@/data/nasabahData';
import { showStandaloneToast } from './Toast';

export default function NasabahPetugas() {
    const [searchQuery, setSearchQuery] = useState('');
    const [nasabahList, setNasabahList] = useState<NasabahData[]>([]);

    // Load nasabah data on mount
    useEffect(() => {
        const loadData = async () => {
            const data = await getAllNasabah();
            setNasabahList(data);
        };
        loadData();
    }, []);

    const filteredNasabah = nasabahList.filter(n =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.includes(searchQuery)
    );

    // Export nasabah list to CSV
    const exportToCSV = () => {
        if (filteredNasabah.length === 0) {
            showStandaloneToast('warning', 'Tidak Ada Data', 'Tidak ada data nasabah untuk diekspor.');
            return;
        }

        const headers = ['No', 'ID Nasabah', 'Nama Nasabah', 'Email', 'Nomor HP', 'Saldo'];
        const csvRows = [
            'Daftar Nasabah - Bank Sampah',
            `Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`,
            '',
            headers.join(','),
            ...filteredNasabah.map((nasabah, idx) => [
                idx + 1,
                nasabah.id,
                `"${nasabah.name}"`,
                nasabah.email,
                nasabah.phone,
                formatSaldo(nasabah.saldo)
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `daftar_nasabah_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/nasabah.svg" alt="Nasabah" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Daftar Nasabah</h1>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari nasabah"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-full px-10 py-2.5 text-xs font-medium text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    </div>
                    <button onClick={exportToCSV} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer">
                        <i className="fas fa-file-csv"></i>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-primary text-white font-bold">
                            <tr>
                                <th className="px-4 py-5 text-center w-16">No</th>
                                <th className="px-6 py-5">ID Nasabah</th>
                                <th className="px-6 py-5">Nama nasabah</th>
                                <th className="px-6 py-5">Email</th>
                                <th className="px-6 py-5">Nomor HP</th>
                                <th className="px-6 py-5">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredNasabah.map((nasabah, idx) => (
                                <tr key={idx} className="hover:bg-tertiary/30 transition-colors group">
                                    <td className="px-4 py-6 text-center text-gray-500 font-bold">{idx + 1}</td>
                                    <td className="px-6 py-6 font-medium text-gray-600">{nasabah.id}</td>
                                    <td className="px-6 py-6 font-bold text-primary group-hover:pl-8 transition-all duration-300">{nasabah.name}</td>
                                    <td className="px-6 py-6 text-gray-400 font-medium">{nasabah.email}</td>
                                    <td className="px-6 py-6 text-gray-400 font-medium">{nasabah.phone}</td>
                                    <td className="px-6 py-6 font-bold text-primary">{formatSaldo(nasabah.saldo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - only show if more than 10 items */}
            {filteredNasabah.length > 10 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center cursor-pointer">1</button>
                    <button className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center hover:bg-gray-50 cursor-pointer">2</button>
                    <button className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center hover:bg-primary-dark transition-colors shadow-sm active:scale-90 cursor-pointer">
                        <i className="fas fa-chevron-right text-[10px]"></i>
                    </button>
                </div>
            )}
        </div>
    );
}
