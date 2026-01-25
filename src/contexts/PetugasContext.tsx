'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DbPetugas } from '@/lib/supabase';

export interface Petugas {
    id: string;
    nama: string;
    email: string;
    noHp: string | null;
    bankSampahId: string | null;
    bankSampahNama?: string; // For display purposes
    mustChangePassword?: boolean;
    createdAt: string;
    updatedAt: string | null;
}

interface PetugasContextType {
    petugasList: Petugas[];
    isLoading: boolean;
    addPetugas: (petugas: Omit<Petugas, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Petugas | null>;
    updatePetugas: (id: string, updates: Partial<Petugas>) => Promise<void>;
    deletePetugas: (id: string) => Promise<void>;
    getPetugasById: (id: string) => Petugas | undefined;
    refreshPetugas: () => Promise<void>;
    // Authentication functions
    authenticatePetugas: (email: string, password: string) => Promise<{ success: boolean; petugas?: Petugas; mustChangePassword?: boolean; error?: string }>;
    updatePassword: (id: string, newPassword: string) => Promise<boolean>;
}

const PetugasContext = createContext<PetugasContextType | undefined>(undefined);

// Default password for new petugas
const DEFAULT_PASSWORD = 'Test1234';

// Convert database records to Petugas interface
const dbToPetugas = (petugas: DbPetugas, bankNama?: string): Petugas => ({
    id: petugas.id,
    nama: petugas.nama,
    email: petugas.email,
    noHp: petugas.no_hp,
    bankSampahId: petugas.bank_sampah_id,
    bankSampahNama: bankNama,
    mustChangePassword: petugas.must_change_password,
    createdAt: petugas.created_at,
    updatedAt: petugas.updated_at
});

export function PetugasProvider({ children }: { children: ReactNode }) {
    const [petugasList, setPetugasList] = useState<Petugas[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch petugas from Supabase
    const fetchPetugas = async () => {
        try {
            // Fetch petugas with bank_sampah join for nama
            const { data: petugasData, error: petugasError } = await supabase
                .from('petugas')
                .select(`
                    *,
                    bank_sampah:bank_sampah_id (
                        nama
                    )
                `)
                .order('nama');

            if (petugasError) {
                console.warn('Supabase fetch error:', petugasError.message);
                setPetugasList([]);
                return;
            }

            const mappedPetugas = (petugasData || []).map((p: any) => ({
                id: p.id,
                nama: p.nama,
                email: p.email,
                noHp: p.no_hp,
                bankSampahId: p.bank_sampah_id,
                bankSampahNama: p.bank_sampah?.nama || null,
                mustChangePassword: p.must_change_password,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));

            setPetugasList(mappedPetugas);
        } catch (error) {
            console.error('Failed to fetch petugas:', error);
            setPetugasList([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Load petugas on mount
    useEffect(() => {
        fetchPetugas();
    }, []);

    const addPetugas = async (petugas: Omit<Petugas, 'id' | 'createdAt' | 'updatedAt'>): Promise<Petugas | null> => {
        try {
            // Try inserting with password fields first
            let result = await supabase.from('petugas').insert({
                nama: petugas.nama,
                email: petugas.email,
                password: DEFAULT_PASSWORD,
                no_hp: petugas.noHp,
                bank_sampah_id: petugas.bankSampahId,
                must_change_password: true
            }).select().single();

            // If password column doesn't exist yet, try without it
            if (result.error && (result.error.message.includes('password') || result.error.message.includes('must_change_password') || result.error.code === '42703')) {
                console.warn('Password columns not found, inserting without them. Please run the ALTER TABLE SQL command.');
                console.warn('Password columns not found, inserting without them. Please run the ALTER TABLE SQL command.');
                result = await supabase.from('petugas').insert({
                    nama: petugas.nama,
                    email: petugas.email,
                    no_hp: petugas.noHp,
                    bank_sampah_id: petugas.bankSampahId
                }).select().single();
            }

            if (result.error) {
                console.error('Failed to add petugas:', result.error.message, result.error.details, result.error.hint);
                return null;
            }

            await fetchPetugas(); // Refresh data
            return result.data ? dbToPetugas(result.data) : null;
        } catch (error) {
            console.error('Failed to add petugas:', error);
            return null;
        }
    };

    const updatePetugas = async (id: string, updates: Partial<Petugas>) => {
        try {
            const dbUpdates: Partial<DbPetugas> = {};
            if (updates.nama !== undefined) dbUpdates.nama = updates.nama;
            if (updates.email !== undefined) dbUpdates.email = updates.email;
            if (updates.noHp !== undefined) dbUpdates.no_hp = updates.noHp;
            if (updates.bankSampahId !== undefined) dbUpdates.bank_sampah_id = updates.bankSampahId;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('petugas')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                console.error('Failed to update petugas:', error);
                return;
            }

            await fetchPetugas(); // Refresh data
        } catch (error) {
            console.error('Failed to update petugas:', error);
        }
    };

    const deletePetugas = async (id: string) => {
        try {
            const { error } = await supabase
                .from('petugas')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete petugas:', error);
                return;
            }

            setPetugasList(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete petugas:', error);
        }
    };

    const getPetugasById = (id: string) => {
        return petugasList.find(p => p.id === id);
    };

    const refreshPetugas = async () => {
        setIsLoading(true);
        await fetchPetugas();
    };

    // Authenticate petugas with email and password
    const authenticatePetugas = async (email: string, password: string): Promise<{ success: boolean; petugas?: Petugas; mustChangePassword?: boolean; error?: string }> => {
        try {
            const { data, error } = await supabase
                .from('petugas')
                .select(`
                    *,
                    bank_sampah:bank_sampah_id (
                        nama
                    )
                `)
                .eq('email', email.toLowerCase().trim())
                .single();

            if (error || !data) {
                return { success: false, error: 'Email tidak terdaftar' };
            }

            // Check password
            if (data.password !== password) {
                return { success: false, error: 'Password salah' };
            }

            const petugas: Petugas = {
                id: data.id,
                nama: data.nama,
                email: data.email,
                noHp: data.no_hp,
                bankSampahId: data.bank_sampah_id,
                bankSampahNama: data.bank_sampah?.nama || null,
                mustChangePassword: data.must_change_password,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };

            return {
                success: true,
                petugas,
                mustChangePassword: data.must_change_password
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Terjadi kesalahan saat autentikasi' };
        }
    };

    // Update password for petugas
    const updatePassword = async (id: string, newPassword: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('petugas')
                .update({
                    password: newPassword,
                    must_change_password: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('Failed to update password:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Failed to update password:', error);
            return false;
        }
    };

    return (
        <PetugasContext.Provider
            value={{
                petugasList,
                isLoading,
                addPetugas,
                updatePetugas,
                deletePetugas,
                getPetugasById,
                refreshPetugas,
                authenticatePetugas,
                updatePassword
            }}
        >
            {children}
        </PetugasContext.Provider>
    );
}

export function usePetugas() {
    const context = useContext(PetugasContext);
    if (context === undefined) {
        throw new Error('usePetugas must be used within a PetugasProvider');
    }
    return context;
}
