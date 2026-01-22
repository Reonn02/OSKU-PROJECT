'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface NavbarPetugasProps {
    onLogout: () => void;
    onToggleSidebar?: () => void;
}

interface Notification {
    id: string;
    type: 'persetujuan' | 'konfirmasi';
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

    // Load notifikasi dari localStorage
    useEffect(() => {
        const loadNotifications = () => {
            const notifs: Notification[] = [];

            try {
                // Load saved read status
                const savedNotifs = localStorage.getItem('petugas_notifications');
                let savedNotifData: Notification[] = savedNotifs ? JSON.parse(savedNotifs) : [];

                // Load dari Persetujuan (yang Diproses)
                const persetujuanData = localStorage.getItem('persetujuan_data');
                if (persetujuanData) {
                    const allData = JSON.parse(persetujuanData);
                    const diprosesData = allData.filter((item: any) => item.status === 'Diproses');

                    diprosesData.forEach((item: any) => {
                        const notifId = `persetujuan-${item.id}`;
                        const isRead = savedNotifData.some(n => n.id === notifId && n.isRead);
                        notifs.push({
                            id: notifId,
                            type: 'persetujuan',
                            title: 'Pengajuan Perlu Diproses',
                            message: `${item.name} mengajukan pencairan Rp ${item.amount.toLocaleString('id-ID')}`,
                            time: item.date,
                            icon: 'fa-clock',
                            color: 'text-yellow-600',
                            isRead,
                            link: '/petugas/dashboard?tab=persetujuan'
                        });
                    });

                    // Load yang Disetujui (perlu konfirmasi)
                    const disetujuiData = allData.filter((item: any) => item.status === 'Disetujui');
                    disetujuiData.forEach((item: any) => {
                        const notifId = `konfirmasi-${item.id}`;
                        const isRead = savedNotifData.some(n => n.id === notifId && n.isRead);
                        notifs.push({
                            id: notifId,
                            type: 'konfirmasi',
                            title: 'Perlu Konfirmasi Pencairan',
                            message: `${item.name} menunggu konfirmasi pencairan Rp ${item.amount.toLocaleString('id-ID')}`,
                            time: item.date,
                            icon: 'fa-thumbs-up',
                            color: 'text-primary',
                            isRead,
                            link: '/petugas/dashboard?tab=konfirmasi'
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
            }

            setNotifications(notifs);
        };

        loadNotifications();
        const interval = setInterval(loadNotifications, 2000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        const updatedNotifs = notifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifs);
        localStorage.setItem('petugas_notifications', JSON.stringify(updatedNotifs));

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
