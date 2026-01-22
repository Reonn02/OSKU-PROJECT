'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NavbarNasabah from '@/components/NavbarNasabah';
import { useBerita } from '@/contexts/BeritaContext';

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
}

export default function NotifikasiPage() {
    const router = useRouter();
    const { berita } = useBerita();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [displayName, setDisplayName] = useState<string>('-');

    // Read user profile
    useEffect(() => {
        try {
            const userProfileStr = sessionStorage.getItem('userProfile');
            if (userProfileStr) {
                const userProfile = JSON.parse(userProfileStr);
                setDisplayName(userProfile.fullName || '-');
            }
        } catch (error) {
            console.error('Error reading user profile:', error);
            setDisplayName('-');
        }
    }, []);

    // Load notifications from localStorage and generate from berita
    useEffect(() => {
        const loadNotifications = () => {
            try {
                // Load existing notifications
                const savedNotifs = localStorage.getItem('nasabah_notifications');
                let notifs: Notification[] = savedNotifs ? JSON.parse(savedNotifs) : [];

                // Generate berita notifications (latest 3)
                const beritaNotifs: Notification[] = berita.slice(0, 3).map((item) => ({
                    id: `berita-${item.id}`,
                    type: 'berita' as const,
                    title: 'Berita Baru',
                    message: item.judul,
                    time: item.tanggal,
                    isRead: notifs.some(n => n.id === `berita-${item.id}` && n.isRead),
                    link: `/dashboard/berita/${item.id}`
                }));

                // Sample pencairan notifications (simulated)
                const pencairanNotifs: Notification[] = [
                    {
                        id: 'pencairan-1',
                        type: 'pencairan',
                        title: 'Pencairan Disetujui',
                        message: 'Pencairan berhasil disetujui',
                        time: '1 hari lalu',
                        isRead: notifs.some(n => n.id === 'pencairan-1' && n.isRead),
                        status: 'Disetujui',
                        amount: 'Rp 150.000',
                        link: '/dashboard?tab=pencairan'
                    },
                    {
                        id: 'pencairan-2',
                        type: 'pencairan',
                        title: 'Pencairan Ditolak',
                        message: 'Pencairan ditolak, saldo kurang',
                        time: '3 hari lalu',
                        isRead: notifs.some(n => n.id === 'pencairan-2' && n.isRead),
                        status: 'Ditolak',
                        amount: 'Rp 200.000',
                        link: '/dashboard?tab=pencairan'
                    }
                ];

                // Combine all notifications
                const allNotifs = [...beritaNotifs, ...pencairanNotifs];
                setNotifications(allNotifs);
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        };

        loadNotifications();
    }, [berita]);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        const updatedNotifs = notifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifs);
        localStorage.setItem('nasabah_notifications', JSON.stringify(updatedNotifs));

        // Navigate to link
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userName');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            {/* Navbar */}
            <NavbarNasabah
                activeTab="dashboard"
                userName={displayName}
                setShowLogoutModal={setShowLogoutModal}
            />

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Notifikasi</h1>
                    <p className="text-sm text-primary-light mt-1">Semua notifikasi Anda</p>
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
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${notif.type === 'berita'
                                        ? 'bg-tertiary text-primary'
                                        : notif.status === 'Disetujui'
                                            ? 'bg-tertiary text-primary'
                                            : 'bg-red-50 text-warning'
                                        }`}>
                                        {notif.type === 'berita' ? (
                                            <img src="/icon/Newspaper.svg" alt="Newspaper" className="w-6 h-6" />
                                        ) : (
                                            <i className={`fas ${notif.status === 'Disetujui'
                                                ? 'fa-check-circle'
                                                : 'fa-times-circle'
                                                } text-xl`}></i>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className={`text-base font-bold mb-1 ${notif.type === 'berita'
                                                    ? 'text-primary'
                                                    : notif.status === 'Disetujui'
                                                        ? 'text-primary'
                                                        : 'text-warning'
                                                    }`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {notif.message}
                                                </p>
                                                {notif.amount && (
                                                    <p className="text-sm font-bold text-gray-700 mb-2">
                                                        {notif.amount}
                                                    </p>
                                                )}
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

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-sign-out-alt text-warning text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Keluar dari Akun?</h3>
                            <p className="text-gray-600 text-sm">Anda yakin ingin keluar dari akun Anda?</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-3 bg-warning text-white rounded-full font-bold hover:bg-red-600 transition shadow-md"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
