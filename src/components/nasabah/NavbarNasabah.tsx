'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useBerita } from '@/contexts/BeritaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavbarNasabahProps {
    activeTab: string;
    onTabChange?: (tab: string) => void;
    userName?: string;
    setShowLogoutModal: (show: boolean) => void;
}

interface Notification {
    id: string;
    type: 'berita' | 'pencairan' | 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    link?: string;
    status?: 'Disetujui' | 'Ditolak' | 'Menunggu' | 'Dibatalkan' | 'Selesai';
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
    const { t } = useLanguage();
    const [scrolled, setScrolled] = useState(false);
    const { berita } = useBerita();
    const { nasabah, signOut } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Use nasabah name from auth context if available
    // Use nasabah username from auth context if available, otherwise fallback to name or prop
    const displayName = nasabah?.username || nasabah?.name || userName;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load notifications from Supabase
    useEffect(() => {
        if (!nasabah?.id) return;

        const fetchNotifications = async () => {
            try {
                // Fetch Berita (Last 3)
                // Get cleared berita IDs
                const clearedBeritaIds = JSON.parse(localStorage.getItem('cleared_berita_notifs') || '[]');

                // Fetch Berita (Last 3)
                const beritaNotifs: Notification[] = berita
                    .slice(0, 3)
                    .map((item) => ({
                        id: `berita-${item.id}`,
                        type: 'berita' as const,
                        title: 'Berita Baru',
                        message: item.judul,
                        time: item.tanggal,
                        isRead: false,
                        link: `/dashboard/berita/${item.id}`
                    }))
                    .filter(n => !clearedBeritaIds.includes(n.id));

                const { data, error } = await supabase
                    .from('notifikasi')
                    .select('*')
                    .eq('recipient_id', nasabah.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                const dbNotifs: Notification[] = (data || []).map((item: any) => ({
                    id: item.id,
                    type: item.type, // Keep original type from DB ('info', 'success', 'warning', 'error', etc.)
                    title: item.title,
                    message: item.message,
                    time: new Date(item.created_at).toLocaleDateString('id-ID'),
                    isRead: item.is_read,
                    link: item.link,
                    status: item.status,
                    amount: item.amount
                }));

                // Check local storage for read news to sync state
                const readNewsIds = JSON.parse(localStorage.getItem('read_news_notifs') || '[]');
                const processedBerita = beritaNotifs.map(n => ({
                    ...n,
                    isRead: readNewsIds.includes(n.id)
                }));

                // Combine: DB notifs take precedence
                setNotifications([...dbNotifs, ...processedBerita]);

            } catch (error: any) {
                console.error('Error loading notifications:', error.message || error);
            }
        };

        fetchNotifications();

        // Realtime subscription
        const subscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifikasi',
                filter: `recipient_id=eq.${nasabah.id}`
            }, (payload) => {
                const newItem = payload.new as any;
                const newNotif: Notification = {
                    id: newItem.id,
                    type: newItem.type,
                    title: newItem.title,
                    message: newItem.message,
                    time: 'Baru saja',
                    isRead: newItem.is_read,
                    link: newItem.link,
                    status: newItem.status,
                    amount: newItem.amount
                };
                setNotifications(prev => [newNotif, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [nasabah, berita]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: Notification, stopNavigation = false) => {
        // Mark as read
        if (!notification.isRead) {
            if (!notification.id.startsWith('berita-')) {
                await supabase
                    .from('notifikasi')
                    .update({ is_read: true })
                    .eq('id', notification.id);
            } else {
                const readNewsIds = JSON.parse(localStorage.getItem('read_news_notifs') || '[]');
                if (!readNewsIds.includes(notification.id)) {
                    readNewsIds.push(notification.id);
                    localStorage.setItem('read_news_notifs', JSON.stringify(readNewsIds));
                }
            }

            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, isRead: true } : n
            ));
        }

        if (notification.link && !stopNavigation) {
            setShowNotifications(false);
            router.push(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;

        try {
            // 1. Mark DB notifications as read
            const dbUnreadIds = notifications
                .filter(n => !n.isRead && !n.id.startsWith('berita-'))
                .map(n => n.id);

            if (dbUnreadIds.length > 0) {
                const { error } = await supabase
                    .from('notifikasi')
                    .update({ is_read: true })
                    .in('id', dbUnreadIds);

                if (error) throw error;
            }

            // 2. Mark News as read locally
            const newsUnreadIds = notifications
                .filter(n => !n.isRead && n.id.startsWith('berita-'))
                .map(n => n.id);

            if (newsUnreadIds.length > 0) {
                const readNewsIds = JSON.parse(localStorage.getItem('read_news_notifs') || '[]');
                const newReadIds = [...new Set([...readNewsIds, ...newsUnreadIds])];
                localStorage.setItem('read_news_notifs', JSON.stringify(newReadIds));
            }

            // 3. Update local state
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDeleteAll = async () => {
        try {
            // Delete only DB notifications
            const dbIds = notifications
                .filter(n => !n.id.startsWith('berita-'))
                .map(n => n.id);

            if (dbIds.length > 0) {
                const { error } = await supabase
                    .from('notifikasi')
                    .delete()
                    .in('id', dbIds);

                if (error) throw error;
            }

            // Persist cleared state for Berita (so they don't come back on refresh)
            const beritaIds = notifications
                .filter(n => n.id.startsWith('berita-'))
                .map(n => n.id);

            if (beritaIds.length > 0) {
                const clearedBerita = JSON.parse(localStorage.getItem('cleared_berita_notifs') || '[]');
                const newCleared = [...new Set([...clearedBerita, ...beritaIds])];
                localStorage.setItem('cleared_berita_notifs', JSON.stringify(newCleared));
            }

            // Clear ALL notifications from the view immediately (including berita)
            setNotifications([]);

        } catch (error) {
            console.error('Error deleting notifications:', error);
        }
    };

    const renderNotificationIcon = (notif: Notification) => {
        if (notif.type === 'berita') {
            return (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-tertiary text-primary flex items-center justify-center">
                    <img src="/icon/Newspaper.svg" alt="Newspaper" className="w-5 h-5" />
                </div>
            );
        }

        // Mapping based on status or fallback to type
        let iconClass = 'fa-info-circle';
        let bgClass = 'bg-blue-50 text-blue-500';

        if (notif.status === 'Selesai') {
            iconClass = 'fa-check-double';
            bgClass = 'bg-green-100 text-green-600';
        } else if (notif.status === 'Disetujui' || notif.type === 'success') {
            iconClass = 'fa-check-circle';
            bgClass = 'bg-tertiary text-primary';
        } else if (notif.status === 'Ditolak' || notif.type === 'error') {
            iconClass = 'fa-times-circle';
            bgClass = 'bg-red-50 text-red-500';
        } else if (notif.status === 'Dibatalkan' || notif.type === 'warning') {
            iconClass = 'fa-ban';
            bgClass = 'bg-orange-50 text-orange-500';
        }

        return (
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bgClass}`}>
                <i className={`fas ${iconClass} text-lg`}></i>
            </div>
        );
    };

    const renderNotificationStatusColor = (notif: Notification) => {
        if (notif.type === 'berita') return 'text-primary';
        if (notif.status === 'Selesai') return 'text-green-600';
        if (notif.status === 'Disetujui' || notif.type === 'success') return 'text-primary';
        if (notif.status === 'Ditolak' || notif.type === 'error') return 'text-red-500';
        if (notif.status === 'Dibatalkan' || notif.type === 'warning') return 'text-orange-500';
        return 'text-gray-700';
    };

    const isDashboard = pathname === '/dashboard';

    const menuItems = [
        { id: 'dashboard', label: t('common.dashboard'), icon: '/icon/Dashboard.svg' },
        { id: 'profile', label: t('common.profile'), icon: '/icon/profil.svg' },
        { id: 'penyetoran', label: t('petugas.sidebar.deposit'), icon: '/icon/LogoPenyetoran.svg' },
        { id: 'pencairan', label: t('common.withdrawal'), icon: '/icon/Pencairan.svg' },
        { id: 'bantuan', label: t('common.help'), icon: '/icon/help-circle.svg', isPage: true },
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
                            <span className="text-sm sm:text-xl font-bold text-[#3B8A51] leading-tight truncate max-w-[80px] sm:max-w-none">{displayName}</span>
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
                                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Header */}
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-primary">{t('common.notifications')}</h3>
                                            {unreadCount > 0 && (
                                                <span className="text-xs bg-warning text-white px-2 py-0.5 rounded-full font-medium">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={handleDeleteAll}
                                                className="text-[10px] text-red-500 hover:text-red-600 font-bold hover:underline transition-colors"
                                            >
                                                Bersihkan Semua
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification List */}
                                    <div className="max-h-[350px] overflow-y-auto scrollbar-custom bg-white">
                                        {notifications.length === 0 ? (
                                            <div className="py-16 px-8 text-center bg-gray-50/50">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fas fa-bell-slash text-2xl text-gray-400"></i>
                                                </div>
                                                <h4 className="text-sm font-semibold text-gray-600 mb-1">{t('Tidak Ada Notifikasi') || 'Tidak ada Notifikasi'}</h4>
                                                <p className="text-xs text-gray-400">Aktivitas terbaru Anda akan muncul di sini</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer relative group ${!notif.isRead ? 'bg-green-50/30' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        {/* Icon */}
                                                        {renderNotificationIcon(notif)}

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0 pr-16">
                                                            <div className="flex items-start justify-between mb-0.5">
                                                                <p className={`text-sm font-bold ${renderNotificationStatusColor(notif)}`}>
                                                                    {notif.title}
                                                                </p>
                                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                                    {notif.time}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-1 line-clamp-2 leading-relaxed">
                                                                {notif.message}
                                                            </p>
                                                            {notif.amount && (
                                                                <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-600">
                                                                    {notif.amount}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions/Indicators */}
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end">
                                                            {!notif.isRead && (
                                                                <>
                                                                    <div className="w-2 h-2 bg-warning rounded-full ring-2 ring-white mb-2"></div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleNotificationClick(notif, true);
                                                                        }}
                                                                        className="text-[10px] text-[#3B8A51] font-bold hover:underline bg-white shadow-sm px-2 py-1 rounded-full border border-gray-100 hover:bg-green-50 transition-colors z-10"
                                                                    >
                                                                        Tandai dibaca
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
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
                                                className="text-xs text-primary font-bold hover:underline flex items-center justify-center gap-1 py-1"
                                            >
                                                {t('common.view_all')} <i className="fas fa-arrow-right text-[10px] ml-1"></i>
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
                            {t('common.logout')}
                        </button>
                    </div>
                </div>
            </header>

            {/* Greeting - Centered at the top of content */}
            <div className="container mx-auto px-4 pt-20 md:pt-24 pb-2 md:pb-4 text-center">
                <h1 className="text-xl sm:text-3xl md:text-5xl font-bold tracking-tight">
                    <span className="text-[#3B8A51] opacity-50">{t('nasabah.dashboard.hello')} </span>
                    <span className="text-[#3B8A51]">{displayName}</span>
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
