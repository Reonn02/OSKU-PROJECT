'use client';

import { useState, useEffect } from 'react';
import NavbarPetugas from '@/components/petugas/NavbarPetugas';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    created_at: string;
    isRead: boolean;
    link?: string;
}

export default function NotifikasiPetugasPage() {
    const router = useRouter();
    const { signOut } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                // Petugas sees 'petugas' role notifications
                const { data, error } = await supabase
                    .from('notifikasi')
                    .select('*')
                    .eq('recipient_role', 'petugas')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const mappedNotifs: Notification[] = (data || []).map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    message: item.message,
                    time: new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }),
                    created_at: item.created_at,
                    isRead: item.is_read,
                    link: item.link
                }));

                setNotifications(mappedNotifs);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.push('/petugas/login');
    };

    return (
        <div className="min-h-screen bg-[#F0FAF4]">
            <NavbarPetugas onLogout={handleLogout} />

            <div className="p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-primary">Semua Notifikasi</h1>
                            <Link href="/petugas/dashboard" className="text-sm font-bold text-gray-400 hover:text-primary transition">
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
                            <div className="text-center py-20">
                                <i className="fas fa-bell-slash text-5xl text-gray-300 mb-4"></i>
                                <h3 className="text-lg font-bold text-gray-600">Tidak ada notifikasi</h3>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-5 rounded-2xl transition hover:shadow-md border border-transparent hover:border-tertiary ${!notif.isRead ? 'bg-tertiary/20' : 'bg-gray-50'}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-full bg-tertiary flex items-center justify-center flex-shrink-0 text-primary">
                                                <i className={`fas ${notif.type === 'konfirmasi' ? 'fa-thumbs-up' : 'fa-clock'} text-xl`}></i>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-primary text-lg">{notif.title}</h3>
                                                    <span className="text-xs text-gray-400">{notif.time}</span>
                                                </div>
                                                <p className="text-gray-600 mb-3">{notif.message}</p>

                                                {notif.link && (
                                                    <Link href={notif.link} className="inline-flex items-center text-sm font-bold text-primary hover:underline">
                                                        Cek halaman  <i className="fas fa-arrow-right ml-1"></i>
                                                    </Link>
                                                )}
                                            </div>

                                            {!notif.isRead && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="w-3 h-3 bg-warning rounded-full shadow-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
