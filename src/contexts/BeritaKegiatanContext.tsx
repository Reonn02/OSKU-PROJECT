'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DbBeritaKegiatan } from '@/lib/supabase';

export interface BeritaKegiatan {
    id: string;
    judul: string;
    tanggal: string;
    author: string;
    deskripsi: string;
    kontenLengkap: string;
    gambar: string;
    createdAt: Date;
    updatedAt?: Date;
}

interface BeritaKegiatanContextType {
    beritaKegiatan: BeritaKegiatan[];
    isLoading: boolean;
    addBeritaKegiatan: (berita: Omit<BeritaKegiatan, 'id' | 'createdAt'>) => Promise<void>;
    updateBeritaKegiatan: (id: string, updates: Partial<BeritaKegiatan>) => Promise<void>;
    deleteBeritaKegiatan: (id: string) => Promise<void>;
    getBeritaKegiatanById: (id: string) => BeritaKegiatan | undefined;
    refreshBeritaKegiatan: () => Promise<void>;
}

const BeritaKegiatanContext = createContext<BeritaKegiatanContextType | undefined>(undefined);

// Default data fallback - Empty for fresh database
const DEFAULT_BERITA_KEGIATAN: BeritaKegiatan[] = [];

// Convert database record to BeritaKegiatan interface
const dbToBeritaKegiatan = (db: DbBeritaKegiatan): BeritaKegiatan => ({
    id: db.id,
    judul: db.judul,
    tanggal: db.tanggal,
    author: db.author,
    deskripsi: db.deskripsi || '',
    kontenLengkap: db.konten_lengkap || '',
    gambar: db.gambar || '/images/berita_bank_sampah.png',
    createdAt: new Date(db.created_at),
    updatedAt: db.updated_at ? new Date(db.updated_at) : undefined
});

export function BeritaKegiatanProvider({ children }: { children: ReactNode }) {
    const [beritaKegiatan, setBeritaKegiatan] = useState<BeritaKegiatan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch berita kegiatan from Supabase
    const fetchBeritaKegiatan = async () => {
        try {
            const { data, error } = await supabase
                .from('berita_kegiatan')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Supabase fetch error, using default:', error.message);
                setBeritaKegiatan(DEFAULT_BERITA_KEGIATAN);
                return;
            }

            const mapped = (data || []).map(dbToBeritaKegiatan);
            setBeritaKegiatan(mapped.length > 0 ? mapped : DEFAULT_BERITA_KEGIATAN);
        } catch (error) {
            console.error('Failed to fetch berita kegiatan:', error);
            setBeritaKegiatan(DEFAULT_BERITA_KEGIATAN);
        } finally {
            setIsLoading(false);
        }
    };

    // Load on mount
    useEffect(() => {
        fetchBeritaKegiatan();
    }, []);

    const addBeritaKegiatan = async (newBerita: Omit<BeritaKegiatan, 'id' | 'createdAt'>) => {
        try {
            const { error } = await supabase.from('berita_kegiatan').insert({
                id: Date.now().toString(),
                judul: newBerita.judul,
                tanggal: newBerita.tanggal,
                author: newBerita.author,
                deskripsi: newBerita.deskripsi,
                konten_lengkap: newBerita.kontenLengkap,
                gambar: newBerita.gambar
            });

            if (error) {
                console.error('Failed to add berita kegiatan:', error);
                return;
            }

            await fetchBeritaKegiatan();
        } catch (error) {
            console.error('Failed to add berita kegiatan:', error);
        }
    };

    const updateBeritaKegiatan = async (id: string, updates: Partial<BeritaKegiatan>) => {
        try {
            const dbUpdates: Partial<DbBeritaKegiatan> = {};
            if (updates.judul !== undefined) dbUpdates.judul = updates.judul;
            if (updates.tanggal !== undefined) dbUpdates.tanggal = updates.tanggal;
            if (updates.author !== undefined) dbUpdates.author = updates.author;
            if (updates.deskripsi !== undefined) dbUpdates.deskripsi = updates.deskripsi;
            if (updates.kontenLengkap !== undefined) dbUpdates.konten_lengkap = updates.kontenLengkap;
            if (updates.gambar !== undefined) dbUpdates.gambar = updates.gambar;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('berita_kegiatan')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                console.error('Failed to update berita kegiatan:', error);
                return;
            }

            await fetchBeritaKegiatan();
        } catch (error) {
            console.error('Failed to update berita kegiatan:', error);
        }
    };

    const deleteBeritaKegiatan = async (id: string) => {
        try {
            const { error } = await supabase
                .from('berita_kegiatan')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete berita kegiatan:', error);
                return;
            }

            setBeritaKegiatan(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete berita kegiatan:', error);
        }
    };

    const getBeritaKegiatanById = (id: string) => {
        return beritaKegiatan.find(item => item.id === id);
    };

    const refreshBeritaKegiatan = async () => {
        setIsLoading(true);
        await fetchBeritaKegiatan();
    };

    return (
        <BeritaKegiatanContext.Provider
            value={{
                beritaKegiatan,
                isLoading,
                addBeritaKegiatan,
                updateBeritaKegiatan,
                deleteBeritaKegiatan,
                getBeritaKegiatanById,
                refreshBeritaKegiatan,
            }}
        >
            {children}
        </BeritaKegiatanContext.Provider>
    );
}

export function useBeritaKegiatan() {
    const context = useContext(BeritaKegiatanContext);
    if (context === undefined) {
        throw new Error('useBeritaKegiatan must be used within a BeritaKegiatanProvider');
    }
    return context;
}
