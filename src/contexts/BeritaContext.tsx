'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DbBerita } from '@/lib/supabase';

export interface Berita {
    id: string;
    judul: string;
    tanggal: string;
    author: string;
    ringkasan: string;
    kontenLengkap: string;
    gambar?: string;
    createdAt: Date;
    updatedAt?: Date;
}

interface BeritaContextType {
    berita: Berita[];
    isLoading: boolean;
    addBerita: (berita: Omit<Berita, 'id' | 'createdAt'>) => Promise<void>;
    updateBerita: (id: string, updates: Partial<Berita>) => Promise<void>;
    deleteBerita: (id: string) => Promise<void>;
    getBeritaById: (id: string) => Berita | undefined;
    refreshBerita: () => Promise<void>;
}

const BeritaContext = createContext<BeritaContextType | undefined>(undefined);

// Default data fallback - Empty for fresh database
const DEFAULT_BERITA: Berita[] = [];

// Convert database record to Berita interface
const dbToBerita = (db: DbBerita): Berita => ({
    id: db.id,
    judul: db.judul,
    tanggal: db.tanggal,
    author: db.author,
    ringkasan: db.ringkasan || '',
    kontenLengkap: db.konten_lengkap || '',
    gambar: db.gambar || undefined,
    createdAt: new Date(db.created_at),
    updatedAt: db.updated_at ? new Date(db.updated_at) : undefined
});

export function BeritaProvider({ children }: { children: ReactNode }) {
    const [berita, setBerita] = useState<Berita[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch berita from Supabase
    const fetchBerita = async () => {
        try {
            const { data, error } = await supabase
                .from('berita')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Supabase fetch error, using default:', error.message);
                setBerita(DEFAULT_BERITA);
                return;
            }

            const mappedBerita = (data || []).map(dbToBerita);
            setBerita(mappedBerita.length > 0 ? mappedBerita : DEFAULT_BERITA);
        } catch (error) {
            console.error('Failed to fetch berita:', error);
            setBerita(DEFAULT_BERITA);
        } finally {
            setIsLoading(false);
        }
    };

    // Load berita on mount
    useEffect(() => {
        fetchBerita();
    }, []);

    const addBerita = async (newBerita: Omit<Berita, 'id' | 'createdAt'>) => {
        try {
            // Remove 'id' to let Supabase auto-generate UUID
            const { error } = await supabase.from('berita').insert({
                judul: newBerita.judul,
                tanggal: newBerita.tanggal,
                author: newBerita.author,
                ringkasan: newBerita.ringkasan,
                konten_lengkap: newBerita.kontenLengkap,
                gambar: newBerita.gambar
            });

            if (error) {
                console.error('Failed to add berita:', error);
                return;
            }

            await fetchBerita(); // Refresh data
        } catch (error) {
            console.error('Failed to add berita:', error);
        }
    };

    const updateBerita = async (id: string, updates: Partial<Berita>) => {
        try {
            const dbUpdates: Partial<DbBerita> = {};
            if (updates.judul !== undefined) dbUpdates.judul = updates.judul;
            if (updates.tanggal !== undefined) dbUpdates.tanggal = updates.tanggal;
            if (updates.author !== undefined) dbUpdates.author = updates.author;
            if (updates.ringkasan !== undefined) dbUpdates.ringkasan = updates.ringkasan;
            if (updates.kontenLengkap !== undefined) dbUpdates.konten_lengkap = updates.kontenLengkap;
            if (updates.gambar !== undefined) dbUpdates.gambar = updates.gambar;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('berita')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                console.error('Failed to update berita:', error);
                return;
            }

            await fetchBerita(); // Refresh data
        } catch (error) {
            console.error('Failed to update berita:', error);
        }
    };

    const deleteBerita = async (id: string) => {
        try {
            const { error } = await supabase
                .from('berita')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete berita:', error);
                return;
            }

            setBerita(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete berita:', error);
        }
    };

    const getBeritaById = (id: string) => {
        return berita.find(item => item.id === id);
    };

    const refreshBerita = async () => {
        setIsLoading(true);
        await fetchBerita();
    };

    return (
        <BeritaContext.Provider
            value={{
                berita,
                isLoading,
                addBerita,
                updateBerita,
                deleteBerita,
                getBeritaById,
                refreshBerita,
            }}
        >
            {children}
        </BeritaContext.Provider>
    );
}

export function useBerita() {
    const context = useContext(BeritaContext);
    if (context === undefined) {
        throw new Error('useBerita must be used within a BeritaProvider');
    }
    return context;
}
