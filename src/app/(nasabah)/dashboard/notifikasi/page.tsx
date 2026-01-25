'use client';

import { useState, useEffect } from 'react';
import NavbarNasabah from '@/components/NavbarNasabah';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import KonfirmasiLogout from '@/components/konfirmasiLogout';

interface Notification {
    id: string;
    type: 'berita' | 'pencairan';
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    link?: string;
    status?: 'Disetujui' | 'Ditolak' | 'Menunggu';
    amount?: string;
    created_at: string;
}

export default function NotifikasiPage() {
    const router = useRouter();
    const { nasabah, isLoading, signOut } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    useEffect(() => {
        if (!nasabah?.id) return;

        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('notifikasi')
                    .select('*')
                    .eq('recipient_id', nasabah.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const mappedNotifs: Notification[] = (data || []).map((item: any) => ({
                    id: item.id,
                    type: item.type === 'berita' ? 'berita' : 'pencairan',
                    title: item.title,
                    message: item.message,
                    time: new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }),
                    isRead: item.is_read,
                    link: item.link,
                    status: item.status,
                    amount: item.amount,
                    created_at: item.created_at
                }));

                setNotifications(mappedNotifs);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [nasabah]);

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-outfit">
            <NavbarNasabah
                activeTab="dashboard" // Default active tab
                userName={nasabah?.name || "Nasabah"}
                setShowLogoutModal={setShowLogoutModal}
            />

            {showLogoutModal && (
                <KonfirmasiLogout
                    onCancel={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />
            )}

            <main className="container mx-auto px-4 pt-32 pb-24">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-[#3B8A51]">Semua Notifikasi</h1>
                            <Link href="/dashboard" className="text-sm font-bold text-gray-400 hover:text-[#3B8A51] transition">
                                <i className="fas fa-arrow-left mr-2"></i>
                                Kembali
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-gray-100">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fas fa-bell-slash text-3xl text-gray-400"></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Tidak ada notifikasi</h3>
                                <p className="text-gray-500">Anda belum memiliki notifikasi apapun saat ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`group p-4 rounded-2xl transition-all hover:bg-gray-50 border border-transparent hover:border-gray-100 ${!notif.isRead ? 'bg-[#3B8A51]/5 border-[#3B8A51]/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'berita'
                                                ? 'bg-[#E2F2E7] text-[#3B8A51]'
                                                : notif.status === 'Disetujui'
                                                    ? 'bg-[#E2F2E7] text-[#3B8A51]'
                                                    : 'bg-red-50 text-[#DB524D]'
                                                }`}>
                                                {notif.type === 'berita' ? (
                                                    <i className="far fa-newspaper text-xl"></i>
                                                ) : (
                                                    <i className={`fas ${notif.status === 'Disetujui'
                                                        ? 'fa-check-circle'
                                                        : 'fa-times-circle'
                                                        } text-xl`}></i>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className={`font-bold ${!notif.isRead ? 'text-[#3B8A51]' : 'text-gray-800'
                                                        }`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                        {notif.time}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                                    {notif.message}
                                                </p>
                                                {notif.amount && (
                                                    <div className="inline-block bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
                                                        {notif.amount}
                                                    </div>
                                                )}

                                                {notif.link && (
                                                    <div className="mt-3">
                                                        <Link href={notif.link} className="text-xs font-bold text-[#3B8A51] hover:underline flex items-center gap-1">
                                                            Cek halaman <i className="fas fa-arrow-right"></i>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
