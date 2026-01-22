'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavbarPetugas from '@/components/NavbarPetugas';
import SidebarPetugas from '@/components/SidebarPetugas';

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

export default function NotifikasiPetugasPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        // Refresh every 2 seconds to sync with new data
        const interval = setInterval(loadNotifications, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        const updatedNotifs = notifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifs);
        localStorage.setItem('petugas_notifications', JSON.stringify(updatedNotifs));

        // Navigate to link
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('petugasLoggedIn');
        router.push('/petugas/login');
    };

    const handleTabChange = (tab: string) => {
        // Navigate to dashboard with the selected tab
        router.push(`/petugas/dashboard?tab=${tab}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <SidebarPetugas
                activeTab="dashboard"
                onTabChange={handleTabChange}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Navbar */}
                <NavbarPetugas
                    onLogout={handleLogout}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary">Notifikasi</h1>
                            <p className="text-sm text-gray-600 mt-1">Semua notifikasi pengelolaan pencairan</p>
                        </div>

                        {/* Notification List */}
                        <div className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                                    <div className="flex flex-col items-center">
                                        <i className="fas fa-bell-slash text-5xl text-gray-300 mb-4"></i>
                                        <p className="text-gray-400 font-medium">Tidak ada notifikasi</p>
                                    </div>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border ${!notif.isRead ? 'border-primary/20 bg-tertiary/20' : 'border-transparent'}`}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-tertiary flex items-center justify-center">
                                                    <i className={`fas ${notif.icon} ${notif.color} text-xl`}></i>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-base font-bold text-primary mb-1">
                                                            {notif.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {notif.time}
                                                        </p>
                                                    </div>

                                                    {/* Unread Indicator */}
                                                    {!notif.isRead && (
                                                        <div className="flex-shrink-0 mt-1">
                                                            <div className="w-3 h-3 bg-warning rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}
