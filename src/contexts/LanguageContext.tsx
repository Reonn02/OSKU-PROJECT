'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { id, Dictionary } from '@/locales/id';
import { en } from '@/locales/en';

type Locale = 'id' | 'en';

interface LanguageContextType {
    locale: Locale;
    t: (path: string, params?: Record<string, string | number>) => string;
    setLocale: (locale: Locale) => void;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('id');
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage on mount
    useEffect(() => {
        const savedLocale = localStorage.getItem('osku-locale') as Locale;
        if (savedLocale && (savedLocale === 'id' || savedLocale === 'en')) {
            setLocaleState(savedLocale);
        }
        setIsLoading(false);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('osku-locale', newLocale);
    };

    // Safe nested object access for "common.back" style keys
    const getNestedValue = (obj: any, path: string): string => {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj) || path; // Return key if not found
    };

    const t = (path: string, params?: Record<string, string | number>): string => {
        const dictionary = locale === 'en' ? en : id;
        let text = getNestedValue(dictionary, path);

        if (params && text) {
            Object.entries(params).forEach(([key, value]) => {
                text = text.replace(new RegExp(`{${key}}`, 'g'), String(value));
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ locale, t, setLocale, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
