'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBerita } from '@/contexts/BeritaContext';

interface NavbarNasabahProps {
    activeTab: string;
    onTabChange?: (tab: string) => void;
    userName?: string;
    setShowLogoutModal: (show: boolean) => void;
}

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

export default function NavbarNasabah({
    activeTab,
    onTabChange,
    userName = "Fathi",
    setShowLogoutModal
}: NavbarNasabahProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const { berita } = useBerita();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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

                // Sample pencairan notifications - EMPTY for fresh database start
                const pencairanNotifs: Notification[] = [];

                // Combine all notifications
                const allNotifs = [...beritaNotifs, ...pencairanNotifs];
                setNotifications(allNotifs);
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        };

        loadNotifications();
    }, [berita]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        const updatedNotifs = notifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifs);
        localStorage.setItem('nasabah_notifications', JSON.stringify(updatedNotifs));

        // Navigate to link
        if (notification.link) {
            setShowNotifications(false);
            router.push(notification.link);
        }
    };

    const isDashboard = pathname === '/dashboard';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '/icon/Dashboard.svg' },
        { id: 'profile', label: 'Profil', icon: '/icon/profil.svg' },
        { id: 'penyetoran', label: 'Penyetoran', icon: '/icon/LogoPenyetoran.svg' },
        { id: 'pencairan', label: 'Pencairan', icon: '/icon/Pencairan.svg' },
        { id: 'bantuan', label: 'Bantuan', icon: '/icon/help-circle.svg', isPage: true },
    ];

    const handleTabClick = (tabId: string, isPage?: boolean) => {
        if (isPage) {
            router.push(`/dashboard/${tabId}`);
            return;
        }
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    const renderMenuItem = (item: any, isMobile = false) => {
        const isActive = activeTab === item.id;

        if (isDashboard && onTabChange) {
            return (
                <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id, item.isPage)}
                    className={isMobile
                        ? `flex flex-col items-center justify-center space-y-1 px-2 py-2 rounded-2xl transition-all duration-300 cursor-pointer min-w-0 ${isActive ? 'bg-[#E2F2E7] text-[#3B8A51]' : 'text-gray-400'}`
                        : `flex items-center space-x-2 px-6 py-2.5 rounded-full flex-shrink-0 transition cursor-pointer ${isActive ? 'bg-[#3B8A51] text-white shadow-md' : 'text-[#3B8A51] opacity-70 hover:opacity-100 group'}`
                    }
                >
                    <Image
                        src={item.icon}
                        alt={item.label}
                        width={isMobile ? 24 : 18}
                        height={isMobile ? 24 : 18}
                        className={`${isMobile ? 'w-6 h-6' : 'w-4.5 h-4.5'} transition-all duration-300 ${isActive ? (isMobile ? '' : 'brightness-0 invert') : 'opacity-70 group-hover:opacity-100'}`}
                    />
                    <span className={isMobile ? "text-[10px] font-bold" : "font-bold text-xs"}>{item.label}</span>
                </button>
            );
        }

        return (
            <Link
                key={item.id}
                href={item.isPage ? `/dashboard/${item.id}` : `/dashboard?tab=${item.id}`}
                className={isMobile
                    ? `flex flex-col items-center justify-center space-y-1 px-2 py-2 rounded-2xl transition-all duration-300 cursor-pointer min-w-0 ${isActive ? 'bg-[#E2F2E7] text-[#3B8A51]' : 'text-gray-400'}`
                    : `flex items-center space-x-2 px-6 py-2.5 rounded-full flex-shrink-0 transition cursor-pointer ${isActive ? 'bg-[#3B8A51] text-white shadow-md' : 'text-[#3B8A51] opacity-70 hover:opacity-100 group'}`
                }
            >
                <Image
                    src={item.icon}
                    alt={item.label}
                    width={isMobile ? 24 : 18}
                    height={isMobile ? 24 : 18}
                    className={`${isMobile ? 'w-6 h-6' : 'w-4.5 h-4.5'} transition-all duration-300 ${isActive ? (isMobile ? '' : 'brightness-0 invert') : 'opacity-70 group-hover:opacity-100'}`}
                />
                <span className={isMobile ? "text-[10px] font-bold" : "font-bold text-xs"}>{item.label}</span>
            </Link>
        );
    };

    return (
        <div className="relative z-50">
            {/* Header - Fixed for both mobile and desktop */}
            <header className={`fixed top-0 left-0 right-0 bg-white border-b border-gray-100 py-3 z-[100] transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
                <div className="container mx-auto px-4 lg:px-12 flex items-center justify-between">
                    {/* Left - Profile */}
                    <div className="flex-1 flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#3B8A51] flex items-center justify-center text-white shadow-sm border border-gray-100 flex-shrink-0">
                            <i className="far fa-user text-lg sm:text-xl"></i>
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] sm:text-sm font-medium text-[#3B8A51] opacity-70 leading-tight">Nasabah</span>
                            <span className="text-sm sm:text-xl font-bold text-[#3B8A51] leading-tight truncate max-w-[80px] sm:max-w-none">{userName}</span>
                        </div>
                    </div>

                    {/* Center - Logo (hidden on mobile) */}
                    <div className="flex-none hidden sm:block">
                        <Link href="/dashboard">
                            <Image
                                src="/icon/logoOsku2.svg"
                                alt="OSKU Logo"
                                width={40}
                                height={40}
                                className="mx-auto"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Right - Notifications & Logout */}
                    <div className="flex-1 flex items-center justify-end space-x-3">
                        {/* Notification Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2.5 bg-gray-50 rounded-full hover:bg-tertiary transition-all border border-gray-100 group cursor-pointer"
                            >
                                <Image
                                    src="/icon/notifcations.svg"
                                    alt="Notifikasi"
                                    width={16}
                                    height={16}
                                    className="w-5.5 h-5.5 transition-all"
                                />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full animate-pulse"></span>
                                )}
                            </button>

                            {/* Dropdown Panel */}
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Header */}
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

                                    {/* Notification List */}
                                    <div className="max-h-80 overflow-y-auto scrollbar-custom">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 px-8 text-center">
                                                <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
                                                <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notif.isRead ? 'bg-tertiary/30' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Icon */}
                                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'berita'
                                                            ? 'bg-tertiary text-primary'
                                                            : notif.status === 'Disetujui'
                                                                ? 'bg-tertiary text-primary'
                                                                : 'bg-red-50 text-warning'
                                                            }`}>
                                                            {notif.type === 'berita' ? (
                                                                <img src="/icon/Newspaper.svg" alt="Newspaper" className="w-5 h-5" />
                                                            ) : (
                                                                <i className={`fas ${notif.status === 'Disetujui'
                                                                    ? 'fa-check-circle'
                                                                    : 'fa-times-circle'
                                                                    } text-lg`}></i>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold mb-0.5 ${notif.type === 'berita'
                                                                ? 'text-primary'
                                                                : notif.status === 'Disetujui'
                                                                    ? 'text-primary'
                                                                    : 'text-warning'
                                                                }`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            {notif.amount && (
                                                                <p className="text-xs text-gray-600 mb-2">
                                                                    {notif.amount}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-600">
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

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                                            <Link
                                                href="/dashboard/notifikasi"
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
                            onClick={() => setShowLogoutModal(true)}
                            className="bg-[#3B8A51] hover:bg-[#2F6E41] text-white px-4 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </header>

            {/* Greeting - Centered at the top of content */}
            <div className="container mx-auto px-4 pt-20 md:pt-24 pb-2 md:pb-4 text-center">
                <h1 className="text-xl sm:text-3xl md:text-5xl font-bold tracking-tight">
                    <span className="text-[#3B8A51] opacity-50">Selamat Datang, </span>
                    <span className="text-[#3B8A51]">{userName}</span>
                </h1>
            </div>

            {/* Sticky Sidebar (Bubble) - Desktop Only */}
            <div className={`fixed left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 transition-all duration-500 z-[100] hidden lg:flex ${scrolled ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-20 pointer-events-none'}`}>
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id, item.isPage)}
                            className={`group relative flex items-center transition-all duration-300 ${isActive ? 'w-auto' : 'w-12 h-12'}`}
                        >
                            {isActive ? (
                                <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-100 p-1 pr-6 animate-in slide-in-from-left-4 fade-in duration-300">
                                    <div className="w-12 h-12 rounded-full bg-[#3B8A51] flex items-center justify-center text-white">
                                        <Image src={item.icon} alt={item.label} width={24} height={24} className="w-6 h-6 brightness-0 invert" />
                                    </div>
                                    <span className="ml-3 text-sm font-bold text-[#3B8A51] whitespace-nowrap">{item.label}</span>
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 hover:bg-white hover:shadow-md flex items-center justify-center text-[#3B8A51] transition-all duration-300">
                                    <Image src={item.icon} alt={item.label} width={24} height={24} className="w-6 h-6 opacity-60 group-hover:opacity-100" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Desktop Navigation Bar (Center Pills) */}
            <div className="container mx-auto px-4 max-w-4xl pt-6 hidden md:block">
                <div className="bg-white rounded-2xl shadow-md border border-gray-50 p-1.5 flex justify-center items-center gap-3 w-fit mx-auto">
                    {menuItems.map(item => renderMenuItem(item))}
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-3 flex justify-around items-center z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {menuItems.map(item => renderMenuItem(item, true))}
            </div>
        </div>
    );
}
