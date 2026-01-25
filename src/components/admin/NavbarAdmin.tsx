'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavbarAdminProps {
    onLogout: () => void;
    onToggleSidebar: () => void;
}

export default function NavbarAdmin({ onLogout, onToggleSidebar }: NavbarAdminProps) {
    const { t } = useLanguage();

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 lg:px-10 flex items-center justify-between shadow-sm">
            {/* Left: Logo (Mobile) + Toggle Sidebar */}
            <div className="flex items-center gap-4">
                {/* Mobile Logo */}
                <div className="lg:hidden" >
                    <Image src="/images/LogoOskuNavbar.svg" alt="OSKU Logo" width={60} height={40} priority />
                </div>

                {/* Sidebar Toggle (Desktop) */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden lg:block text-primary hover:bg-tertiary p-2 rounded-lg transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <i className="fas fa-bars text-xl"></i>
                </button>
            </div>

            {/* Center: Logo (Desktop) */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
                <Image src="/icon/logoOsku2.svg" alt="OSKU Logo" width={32} height={32} priority />
            </div>

            {/* Right: Notification + Logout Button */}
            <div className="flex items-center gap-4">
                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold px-6 py-2 rounded-full transition shadow-sm cursor-pointer"
                >
                    {t('common.logout')}
                </button>
            </div>
        </nav>
    );
}
