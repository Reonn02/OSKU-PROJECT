'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
// ... rest of imports
import { useRouter } from 'next/navigation';

interface NavbarPetugasProps {
    onLogout: () => void;
    onToggleSidebar?: () => void;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    icon: string;
    color: string;
    isRead: boolean;
    link?: string;
}

export default function NavbarPetugas({ onLogout, onToggleSidebar }: NavbarPetugasProps) {
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load notifikasi dari Supabase
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('recipient_role', 'petugas')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                const notifs: Notification[] = (data || []).map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    message: item.message,
                    time: new Date(item.created_at).toLocaleDateString('id-ID'),
                    icon: item.type === 'konfirmasi' ? 'fa-thumbs-up' : 'fa-clock',
                    color: item.type === 'konfirmasi' ? 'text-primary' : 'text-yellow-600',
                    isRead: item.is_read,
                    link: item.link
                }));

                setNotifications(notifs);

            } catch (error: any) {
                console.error('Error loading notifications:', error.message || error);
            }
        };

        fetchNotifications();

        // Realtime subscription
        const subscription = supabase
            .channel('public:notifications:petugas')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `recipient_role=eq.petugas`
            }, (payload) => {
                const item = payload.new as any;
                const newNotif: Notification = {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    message: item.message,
                    time: 'Baru saja',
                    icon: item.type === 'konfirmasi' ? 'fa-thumbs-up' : 'fa-clock',
                    color: item.type === 'konfirmasi' ? 'text-primary' : 'text-yellow-600',
                    isRead: item.is_read,
                    link: item.link
                };
                setNotifications(prev => [newNotif, ...prev]);
                // Play sound optional
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read in DB
        if (!notification.isRead) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);

            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
        }

        // Navigate to link
        if (notification.link) {
            setShowNotifications(false);
            router.push(notification.link);
        }
    };

    return (
        <header className="h-20 bg-white border-b border-gray-100 px-6 flex items-center sticky top-0 z-40">
            {/* Left side: Mobile Menu Icon / Spacer */}
            <div className="flex-1 flex items-center">
                <button
                    onClick={onToggleSidebar}
                    className="w-10 h-10 text-primary text-2xl p-2 cursor-pointer hover:bg-tertiary rounded-full transition-colors"
                >
                    <i className="fas fa-bars"></i>
                </button>
            </div>

            {/* Center: Logo (Clickable link to dashboard) */}
            <div className="flex-shrink-0">
                <Link href="/petugas/dashboard">
                    <Image
                        src="/icon/logoOsku2.svg"
                        alt="OSKU Logo"
                        width={60}
                        height={60}
                        className="h-12 w-auto"
                    />
                </Link>
            </div>

            {/* Right side icons */}
            <div className="flex-1 flex items-center gap-4 justify-end">
                {/* Notification Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white relative hover:bg-tertiary transition cursor-pointer"
                    >
                        <Image src="/icon/notifcations.svg" alt="Notifikasi" width={22} height={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-warning rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-primary">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-warning text-white px-2 py-1 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <i className="fas fa-bell-slash text-4xl text-gray-300 mb-3"></i>
                                        <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 border-b border-tertiary hover:bg-gray-50 transition cursor-pointer ${!notif.isRead ? 'bg-tertiary/30' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center">
                                                        <i className={`fas ${notif.icon} ${notif.color}`}></i>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-primary mb-1">
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-600 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {notif.time}
                                                    </p>
                                                </div>

                                                {/* Unread Indicator */}
                                                {!notif.isRead && (
                                                    <div className="flex-shrink-0">
                                                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <Link
                                        href="/petugas/notifikasi"
                                        onClick={() => setShowNotifications(false)}
                                        className="text-xs text-primary font-bold hover:underline flex items-center justify-center gap-1"
                                    >
                                        Lihat Semua <i className="fas fa-arrow-right text-[10px]"></i>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={onLogout}
                    className="bg-primary hover:bg-primary-dark text-white px-8 py-2 xl:px-10 rounded-full text-sm font-bold transition shadow-sm active:scale-95 cursor-pointer"
                >
                    Keluar
                </button>
            </div>
        </header>
    );
}
