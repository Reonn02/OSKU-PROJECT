'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useBankSampah, WasteType } from '@/contexts/BankSampahContext';
import DeleteConfirmModal from './DeleteConfirmModal';
import AddBankModal from './AddBankModal';
import AddWasteTypeModal from './AddWasteTypeModal';

interface BankSampahData {
    id: string;
    nama: string;
    alamat: string;
    jumlahJenis: number;      // Number of different waste types from transactions
    totalPenyetoran: number;   // Total number of transactions
    totalSaldo: number;        // Total money from all transactions
}

interface BankSampahAccordionProps {
    data: BankSampahData[];
    onEditSuccess?: () => void;
    onDeleteSuccess?: () => void;
}

export default function BankSampahAccordion({ data, onEditSuccess, onDeleteSuccess }: BankSampahAccordionProps) {
    const { deleteBank, getBankById, addWasteType, updateWasteType, deleteWasteType } = useBankSampah();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bankId: string; bankName: string }>({ isOpen: false, bankId: '', bankName: '' });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);

    // Waste type modal states
    const [wasteTypeModalOpen, setWasteTypeModalOpen] = useState(false);
    const [editingWasteType, setEditingWasteType] = useState<WasteType | null>(null);
    const [currentBankId, setCurrentBankId] = useState<string>('');
    const [currentBankName, setCurrentBankName] = useState<string>('');
    const [showWasteSuccess, setShowWasteSuccess] = useState(false);
    const [wasteSuccessMessage, setWasteSuccessMessage] = useState('');

    const toggleAccordion = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = (e: React.MouseEvent, id: string, nama: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, bankId: id, bankName: nama });
    };

    const confirmDelete = () => {
        deleteBank(deleteModal.bankId);
        if (expandedId === deleteModal.bankId) {
            setExpandedId(null);
        }
        setDeleteModal({ isOpen: false, bankId: '', bankName: '' });
        // Trigger success callback
        if (onDeleteSuccess) {
            onDeleteSuccess();
        }
    };

    const handleEdit = (e: React.MouseEvent, bankId: string) => {
        e.stopPropagation();
        setEditingBankId(bankId);
        setEditModalOpen(true);
    };

    const filteredData = data.filter(bank =>
        bank.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.alamat.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleKontakLayanan = (e: React.MouseEvent, bankId: string) => {
        e.stopPropagation();
        const bankDetail = getBankById(bankId);
        if (bankDetail?.kontakLayanan) {
            // Format nomor telepon untuk WhatsApp (menghapus karakter non-digit)
            const phoneNumber = bankDetail.kontakLayanan.replace(/\D/g, '');
            // Tambahkan kode negara Indonesia jika belum ada
            const formattedPhone = phoneNumber.startsWith('62') ? phoneNumber : '62' + phoneNumber.replace(/^0/, '');
            const whatsappUrl = `https://wa.me/${formattedPhone}`;
            window.open(whatsappUrl, '_blank');
        } else {
            alert('Nomor kontak layanan belum tersedia untuk bank sampah ini.');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Cari bank sampah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white px-5 py-3 pl-12 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary text-sm"
                />
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>

            {/* Accordion Items */}
            <div className="space-y-3">
                {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                        <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                        <p className="text-gray-400 font-medium">Tidak ada bank sampah ditemukan</p>
                    </div>
                ) : (
                    filteredData.map((bank) => {
                        const isExpanded = expandedId === bank.id;

                        return (
                            <div
                                key={bank.id}
                                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                            >
                                {/* Header */}
                                <div
                                    onClick={() => toggleAccordion(bank.id)}
                                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Icon */}
                                            <div className="w-12 h-12 rounded-xl bg-tertiary flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-store text-primary text-xl"></i>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-primary mb-1 truncate">
                                                    {bank.nama}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-1 truncate">
                                                    <i className="fas fa-map-marker-alt mr-1"></i>
                                                    {bank.alamat}
                                                </p>
                                                <p className="text-xs text-gray-500 mb-2 truncate">
                                                    <i className="fas fa-calendar-alt mr-1"></i>
                                                    {(bank as any).openDay || 'Senin'} - {(bank as any).closeDay || 'Jumat'} | {(bank as any).openTime || '08:00'} - {(bank as any).closeTime || '16:30'}
                                                </p>

                                                {/* Stats Pills */}
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1 text-xs bg-tertiary text-primary px-3 py-1 rounded-full font-bold">
                                                        <i className="fas fa-recycle"></i>
                                                        {bank.jumlahJenis} Jenis
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs bg-tertiary text-primary px-3 py-1 rounded-full font-bold">
                                                        <i className="fas fa-box"></i>
                                                        {bank.totalPenyetoran} Transaksi
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-light text-dark-yellow px-3 py-1 rounded-full font-bold">
                                                        <i className="fas fa-coins"></i>
                                                        {formatCurrency(bank.totalSaldo)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4 ml-4">
                                            {/* Edit Button */}
                                            <button
                                                onClick={(e) => handleEdit(e, bank.id)}
                                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                                title="Edit bank sampah"
                                            >
                                                Edit
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => handleDelete(e, bank.id, bank.nama)}
                                                className="bg-warning hover:bg-red-700 text-white px-5 py-2 rounded-xl text-[10px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                                                title="Hapus bank sampah"
                                            >
                                                Hapus
                                            </button>


                                            {/* Toggle Icon */}
                                            <i className={`fas fa-chevron-down text-primary text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div
                                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="px-6 pb-6">
                                        <div className="pt-4 border-t border-gray-100">
                                            {/* Transaction Aggregates Table - Dynamic from localStorage */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-[#E2F2E7] text-[#3B8A51]">
                                                            <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider rounded-tl-xl">
                                                                Jenis Sampah
                                                            </th>
                                                            <th className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">
                                                                Total
                                                            </th>
                                                            <th className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider">
                                                                Satuan
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider">
                                                                Harga/Satuan
                                                            </th>
                                                            <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider rounded-tr-xl">
                                                                Total Saldo
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(() => {
                                                            const transactions = (bank as any).transactions || [];
                                                            if (transactions.length === 0) {
                                                                return (
                                                                    <tr>
                                                                        <td colSpan={5} className="px-4 py-12">
                                                                            <div className="flex flex-col items-center justify-center text-center">
                                                                                <i className="fas fa-recycle text-4xl text-gray-300 mb-4"></i>
                                                                                <p className="text-gray-400 font-medium">Belum ada transaksi penyetoran</p>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }

                                                            // Aggregate by waste type
                                                            const typeAggregates: Record<string, { total: number; unit: string; price: number; saldo: number }> = {};
                                                            transactions.forEach((t: any) => {
                                                                if (!typeAggregates[t.type]) {
                                                                    typeAggregates[t.type] = { total: 0, unit: t.unit, price: t.price, saldo: 0 };
                                                                }
                                                                typeAggregates[t.type].total += t.weight;
                                                                typeAggregates[t.type].saldo += t.weight * t.price;
                                                            });

                                                            return Object.entries(typeAggregates).map(([type, data]) => (
                                                                <tr key={type} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-primary">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                            {type}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-gray-600 font-bold">{data.total}</td>
                                                                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{data.unit}</td>
                                                                    <td className="px-4 py-3 text-right text-gray-600 font-bold">{formatCurrency(data.price)}</td>
                                                                    <td className="px-4 py-3 text-right text-primary font-bold">{formatCurrency(data.saldo)}</td>
                                                                </tr>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Kontak Layanan Button */}
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    onClick={(e) => handleKontakLayanan(e, bank.id)}
                                                    className="flex items-center gap-3 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition shadow-md hover:shadow-lg group cursor-pointer"
                                                >
                                                    <i className="fab fa-whatsapp text-xl group-hover:scale-110 transition-transform"></i>
                                                    <span>Kontak Layanan</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, bankId: '', bankName: '' })}
                onConfirm={confirmDelete}
                bankName={deleteModal.bankName}
            />

            {/* Edit Modal */}
            {editModalOpen && editingBankId && (
                <AddBankModal
                    onClose={() => {
                        setEditModalOpen(false);
                        setEditingBankId(null);
                    }}
                    onSuccess={() => {
                        if (onEditSuccess) {
                            onEditSuccess();
                        }
                    }}
                    editingBank={getBankById(editingBankId)}
                />
            )}

        </div>
    );
}
