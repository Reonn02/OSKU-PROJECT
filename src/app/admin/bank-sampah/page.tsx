'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SidebarAdmin from '@/components/SidebarAdmin';
import NavbarAdmin from '@/components/NavbarAdmin';
import BankSampahAccordion from '@/components/BankSampahAccordion';
import AddBankModal from '@/components/AddBankModal';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';

// Utility function to aggregate transaction data by bank
function aggregateTransactionsByBank(transactions: any[], banks: any[]) {
    return banks.map(bank => {
        // Filter transactions for this bank using ID comparison (more reliable)
        const bankTransactions = transactions.filter(t =>
            t.bank_sampah_id === bank.id ||
            // Fallback for old data or if joined
            t.bank_sampah?.id === bank.id
        );

        // Calculate total saldo from DB field total_harga
        const totalSaldo = bankTransactions.reduce((sum, t) => sum + (t.total_harga || 0), 0);

        return {
            id: bank.id,
            nama: bank.nama,
            alamat: bank.alamat,
            // Pass through operational details
            openDay: bank.openDay,
            closeDay: bank.closeDay,
            openTime: bank.openTime,
            closeTime: bank.closeTime,
            kontakLayanan: bank.kontakLayanan,
            image: bank.image,
            // Use actual waste types count from bank definition
            wasteTypes: bank.wasteTypes || [],
            jumlahJenis: (bank.wasteTypes || []).length,
            totalPenyetoran: bankTransactions.length,
            totalSaldo: totalSaldo,
            transactions: bankTransactions // Store for detail table
        };
    });
}

export default function AdminBankSampahPage() {
    const [activeTab, setActiveTab] = useState('bank-sampah');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showAddSuccess, setShowAddSuccess] = useState(false);
    const [showEditSuccess, setShowEditSuccess] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [aggregatedData, setAggregatedData] = useState<any[]>([]);
    const { banks } = useBankSampah();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        router.push('/');
    };

    // Load and aggregate transaction data from Supabase
    useEffect(() => {
        const loadTransactionData = async () => {
            try {
                // Fetch real data from database
                const { data: transactions, error } = await supabase
                    .from('penyetoran')
                    .select('*');

                if (error) {
                    console.error('Error fetching transactions:', error);
                    return;
                }

                if (transactions && banks.length > 0) {
                    const aggregated = aggregateTransactionsByBank(transactions, banks);
                    setAggregatedData(aggregated);
                }
            } catch (error) {
                console.error('Error loading transaction data:', error);
            }
        };

        loadTransactionData();
    }, [banks]);

    // TEMPORARY: Commented for dev access
    /*
    useEffect(() => {
        // Check if user is logged in as admin
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userRole = localStorage.getItem('userRole');

        if (!isLoggedIn || userRole !== 'admin') {
            router.push('/');
        }
    }, [router]);
    */

    const handleTabChange = (tab: string) => {
        if (tab === 'dashboard') {
            router.push('/admin/dashboard');
        } else if (tab === 'nasabah') {
            router.push('/admin/nasabah');
        } else if (tab === 'petugas') {
            router.push('/admin/petugas');
        } else if (tab === 'berita') {
            router.push('/admin/berita');
        } else if (tab === 'berita-kegiatan') {
            router.push('/admin/berita-kegiatan');
        } else if (tab === 'prediksi') {
            router.push('/admin/prediksi');
        } else if (tab === 'profil') {
            router.push('/admin/dashboard?tab=profil');
        } else if (tab === 'bantuan') {
            router.push('/admin/dashboard?tab=bantuan');
        } else {
            setActiveTab(tab);
        }
    };

    return (
        <div className="min-h-screen bg-tertiary font-sans text-gray-900 flex">
            {/* Sidebar */}
            <SidebarAdmin
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isCollapsed={isSidebarCollapsed}
            />

            {/* Main Content */}
            <div className={`flex-grow ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col transition-all duration-300 ease-in-out`}>
                <NavbarAdmin
                    onLogout={() => setShowLogoutModal(true)}
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />

                <main className="p-6 lg:p-10 space-y-4 max-w-[1600px] mx-auto w-full">
                    {activeTab === 'bank-sampah' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Page Header */}
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                                        <i className="fas fa-store text-primary text-xl"></i>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-primary">Bank Sampah</h1>
                                    </div>
                                </div>

                                {/* Add Button */}
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-dark text-sm text-white  rounded-full transition shadow-md hover:shadow-lg whitespace-nowrap cursor-pointer"
                                >
                                    <i className="fas fa-plus"></i>
                                    <span className="hidden sm:inline">Tambah Bank</span>
                                </button>
                            </div>

                            {/* Accordion */}
                            <BankSampahAccordion
                                data={aggregatedData}
                                onEditSuccess={() => {
                                    setShowEditSuccess(true);
                                    setTimeout(() => setShowEditSuccess(false), 3000);
                                }}
                                onDeleteSuccess={() => {
                                    setShowDeleteSuccess(true);
                                    setTimeout(() => setShowDeleteSuccess(false), 3000);
                                }}
                            />
                        </div>
                    )}

                </main>
            </div>

            {/* Add Bank Modal */}
            {showAddModal && (
                <AddBankModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(isEdit) => {
                        if (isEdit) {
                            setShowEditSuccess(true);
                            setTimeout(() => setShowEditSuccess(false), 3000);
                        } else {
                            setShowAddSuccess(true);
                            setTimeout(() => setShowAddSuccess(false), 3000);
                        }
                    }}
                />
            )}

            {/* Logout Modal */}
            {showLogoutModal && (
                <KonfirmasiLogout
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />
            )}

            {/* Success Notifications */}
            {showAddSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Menambah Bank Sampah!</h3>
                            <p className="text-gray-600 text-sm">Bank sampah baru telah ditambahkan.</p>
                        </div>
                    </div>
                </div>
            )}

            {showEditSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Mengubah Data!</h3>
                            <p className="text-gray-600 text-sm">Data bank sampah telah diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-check text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Berhasil Menghapus!</h3>
                            <p className="text-gray-600 text-sm">Bank sampah telah dihapus.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
