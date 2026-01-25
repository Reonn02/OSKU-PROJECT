'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import Image from 'next/image';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (lang: 'id' | 'en') => {
        setLocale(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-sm font-medium text-white"
                title="Ganti Bahasa / Change Language"
            >
                <span>{locale === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
                <i className={`fas fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => handleSelect('id')}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${locale === 'id' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-600'
                                }`}
                        >
                            <span className="text-lg">🇮🇩</span> Indonesia
                        </button>
                        <button
                            onClick={() => handleSelect('en')}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${locale === 'en' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-600'
                                }`}
                        >
                            <span className="text-lg">🇬🇧</span> English
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
