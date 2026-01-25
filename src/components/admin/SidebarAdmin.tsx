'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SidebarAdminProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isCollapsed?: boolean;
}

export default function SidebarAdmin({ activeTab, onTabChange, isCollapsed = false }: SidebarAdminProps) {
    const { admin } = useAdmin();
    const { t } = useLanguage();

    const menuItems = [
        { id: 'dashboard', label: t('common.dashboard'), icon: '/icon/Dashboard.svg' },
        { id: 'nasabah', label: t('common.nasabah'), icon: '/icon/nasabah.svg' },
        { id: 'petugas', label: t('common.petugas'), icon: '/icon/Petugas.svg' },
        { id: 'prediksi', label: t('common.prediction'), icon: '/icon/Prediksi.svg' },
        { id: 'berita', label: t('common.news'), icon: '/icon/Newspaper.svg' },
        { id: 'berita-kegiatan', label: t('common.activity_news'), icon: 'fas fa-calendar-alt' },
        { id: 'bank-sampah', label: t('common.waste_bank'), icon: 'fas fa-store' },
    ];

    const settingsItems = [
        { id: 'profil', label: t('common.profile'), icon: '/icon/profil.svg' },
        { id: 'bantuan', label: t('common.help'), icon: 'fas fa-question-circle' },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white min-h-screen flex flex-col border-r border-gray-100 hidden lg:flex fixed left-0 top-0 z-[100] transition-all duration-300 ease-in-out`}>
            {/* User Profile */}
            <div className={`p-6 ${isCollapsed ? 'px-4' : 'p-6'}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-4'}`}>
                    <div className="w-12 h-12 flex-shrink-0 rounded-full bg-tertiary flex items-center justify-center text-primary border border-gray-50">
                        <i className="fas fa-user-shield text-xl text-primary"></i>
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h3 className="text-[10px] text-primary-light opacity-70">{t('admin.sidebar.role')}</h3>
                            <p className="text-base font-bold text-primary-light">{admin?.nama || '-'}</p>
                        </div>
                    )}
                </div>

                {/* Kelurahan */}
                {!isCollapsed && (
                    <div className="border-t border-primary/10 pt-4">
                        <div className="bg-tertiary p-3 rounded-xl border border-primary/10">
                            <p className="text-[14px] font-bold text-primary text-center leading-tight">
                                {admin?.kelurahan || '-'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Sections */}
            <nav className={`flex-grow ${isCollapsed ? 'px-2' : 'px-4'} space-y-8 mt-2 overflow-y-auto custom-scrollbar pb-10`}>
                {/* Main Menu */}
                <div>
                    {!isCollapsed && <h4 className="text-[16px] text-primary uppercase tracking-wider mb-3 px-2">{t('admin.sidebar.menu')}</h4>}
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => onTabChange(item.id)}
                                    title={isCollapsed ? item.label : ''}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} p-2 rounded-xl text-sm font-medium transition-all group cursor-pointer ${activeTab === item.id
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-primary-faded hover:text-primary hover:bg-primary/10'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-5 h-5 transition-all ${activeTab === item.id ? 'brightness-0 invert' : 'opacity-70 group-hover:opacity-100 group-hover:filter-primary'}`}>
                                        {item.icon.startsWith('/') ? (
                                            <Image src={item.icon} alt={item.label} width={16} height={16} className="object-contain" />
                                        ) : (
                                            <i className={`${item.icon} w-5 text-center`}></i>
                                        )}
                                    </div>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Settings Menu */}
                <div>
                    {!isCollapsed && <h4 className="text-[16px] text-primary uppercase tracking-wider mb-4 px-2">{t('admin.sidebar.settings')}</h4>}
                    <ul className="space-y-2">
                        {settingsItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => onTabChange(item.id)}
                                    title={isCollapsed ? item.label : ''}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} p-2 rounded-xl text-sm font-medium transition-all group cursor-pointer ${activeTab === item.id
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-primary-faded hover:text-primary hover:bg-primary/10'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-5 h-5 transition-all ${activeTab === item.id ? 'brightness-0 invert' : 'opacity-70 group-hover:opacity-100'}`}>
                                        {item.icon.startsWith('/') ? (
                                            <Image src={item.icon} alt={item.label} width={16} height={16} className="object-contain" />
                                        ) : (
                                            <i className={`${item.icon} w-5 text-center`}></i>
                                        )}
                                    </div>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </aside>
    );
}
