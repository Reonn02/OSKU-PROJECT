'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, DbPenyetoran } from '@/lib/supabase';

// Extended type for penyetoran with related data
interface PenyetoranWithDetails extends DbPenyetoran {
    nasabah_name?: string;
    waste_type_name?: string;
    waste_type_satuan?: string;
    bank_sampah_name?: string;
}

interface PenyetoranContextType {
    penyetoranList: PenyetoranWithDetails[];
    loading: boolean;
    error: string | null;
    fetchPenyetoranByBank: (bankId: string) => Promise<void>;
    fetchPenyetoranByNasabah: (nasabahId: string) => Promise<PenyetoranWithDetails[]>;
    addPenyetoran: (data: Omit<DbPenyetoran, 'id'>) => Promise<DbPenyetoran | null>;
    updatePenyetoran: (id: string, data: Partial<DbPenyetoran>) => Promise<boolean>;
    deletePenyetoran: (id: string) => Promise<boolean>;
    refreshPenyetoran: () => Promise<void>;
    getTotalPenyetoranByNasabah: (nasabahId: string) => Promise<number>;
    getSaldoByNasabah: (nasabahId: string) => Promise<number>;
}

const PenyetoranContext = createContext<PenyetoranContextType | undefined>(undefined);

export function PenyetoranProvider({ children }: { children: ReactNode }) {
    const [penyetoranList, setPenyetoranList] = useState<PenyetoranWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBankId, setCurrentBankId] = useState<string | null>(null);

    // Fetch penyetoran by bank ID (for petugas)
    const fetchPenyetoranByBank = useCallback(async (bankId: string) => {
        setLoading(true);
        setError(null);
        setCurrentBankId(bankId);

        try {
            const { data, error: fetchError } = await supabase
                .from('penyetoran')
                .select(`
                    *,
                    nasabah:nasabah_id (name),
                    waste_type:jenis_sampah_id (nama, satuan),
                    bank_sampah:bank_sampah_id (nama)
                `)
                .eq('bank_sampah_id', bankId)
                .order('tanggal', { ascending: false });

            if (fetchError) throw fetchError;

            const mappedData: PenyetoranWithDetails[] = (data || []).map((item: any) => ({
                ...item,
                nasabah_name: item.nasabah?.name || '-',
                waste_type_name: item.waste_type?.nama || '-',
                waste_type_satuan: item.waste_type?.satuan || 'kg',
                bank_sampah_name: item.bank_sampah?.nama || '-',
            }));

            setPenyetoranList(mappedData);
        } catch (err: any) {
            console.error('Error fetching penyetoran:', err);
            setError(err.message || 'Failed to fetch penyetoran data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch penyetoran by nasabah ID (for nasabah dashboard)
    const fetchPenyetoranByNasabah = useCallback(async (nasabahId: string): Promise<PenyetoranWithDetails[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('penyetoran')
                .select(`
                    *,
                    waste_type:jenis_sampah_id (nama),
                    bank_sampah:bank_sampah_id (nama)
                `)
                .eq('nasabah_id', nasabahId)
                .order('tanggal', { ascending: false });

            if (fetchError) throw fetchError;

            return (data || []).map((item: any) => ({
                ...item,
                waste_type_name: item.waste_type?.nama || '-',
                bank_sampah_name: item.bank_sampah?.nama || '-',
            }));
        } catch (err: any) {
            console.error('Error fetching penyetoran by nasabah:', err);
            return [];
        }
    }, []);

    // Add new penyetoran
    const addPenyetoran = useCallback(async (data: Omit<DbPenyetoran, 'id'>): Promise<DbPenyetoran | null> => {
        try {
            console.log('📝 Adding penyetoran with data:', data);

            const { data: inserted, error: insertError } = await supabase
                .from('penyetoran')
                .insert({
                    ...data,
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Supabase insert error:', insertError);
                throw insertError;
            }

            // Update nasabah saldo
            if (data.nasabah_id && data.total_harga) {
                const { data: nasabah } = await supabase
                    .from('nasabah')
                    .select('saldo')
                    .eq('id', data.nasabah_id)
                    .single();

                if (nasabah) {
                    await supabase
                        .from('nasabah')
                        .update({ saldo: (nasabah.saldo || 0) + data.total_harga })
                        .eq('id', data.nasabah_id);
                }
            }

            // Refresh list if we have a current bank
            if (currentBankId) {
                await fetchPenyetoranByBank(currentBankId);
            }

            return inserted;
        } catch (err: any) {
            console.error('Error adding penyetoran (Full):', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            setError(err.message || 'Failed to add penyetoran');
            return null;
        }
    }, [currentBankId, fetchPenyetoranByBank]);

    // Update penyetoran
    const updatePenyetoran = useCallback(async (id: string, data: Partial<DbPenyetoran>): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('penyetoran')
                .update(data)
                .eq('id', id);

            if (updateError) throw updateError;

            // Refresh list
            if (currentBankId) {
                await fetchPenyetoranByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error updating penyetoran:', err);
            setError(err.message || 'Failed to update penyetoran');
            return false;
        }
    }, [currentBankId, fetchPenyetoranByBank]);

    // Delete penyetoran
    const deletePenyetoran = useCallback(async (id: string): Promise<boolean> => {
        try {
            // First, fetch the penyetoran data to get nasabah_id and total_harga
            const { data: penyetoranData, error: fetchError } = await supabase
                .from('penyetoran')
                .select('nasabah_id, total_harga')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Delete the penyetoran
            const { error: deleteError } = await supabase
                .from('penyetoran')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Update nasabah saldo (subtract the deleted amount)
            if (penyetoranData?.nasabah_id && penyetoranData?.total_harga) {
                const { data: nasabah } = await supabase
                    .from('nasabah')
                    .select('saldo')
                    .eq('id', penyetoranData.nasabah_id)
                    .single();

                if (nasabah) {
                    const newSaldo = Math.max(0, (nasabah.saldo || 0) - penyetoranData.total_harga);
                    await supabase
                        .from('nasabah')
                        .update({ saldo: newSaldo })
                        .eq('id', penyetoranData.nasabah_id);
                }
            }

            // Refresh list
            if (currentBankId) {
                await fetchPenyetoranByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error deleting penyetoran:', err);
            setError(err.message || 'Failed to delete penyetoran');
            return false;
        }
    }, [currentBankId, fetchPenyetoranByBank]);

    // Refresh current data
    const refreshPenyetoran = useCallback(async () => {
        if (currentBankId) {
            await fetchPenyetoranByBank(currentBankId);
        }
    }, [currentBankId, fetchPenyetoranByBank]);

    // Get total count of penyetoran for a nasabah
    const getTotalPenyetoranByNasabah = useCallback(async (nasabahId: string): Promise<number> => {
        try {
            const { count, error } = await supabase
                .from('penyetoran')
                .select('*', { count: 'exact', head: true })
                .eq('nasabah_id', nasabahId);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Error getting total penyetoran:', err);
            return 0;
        }
    }, []);

    // Get current saldo for a nasabah (silently returns 0 if not found)
    const getSaldoByNasabah = useCallback(async (nasabahId: string): Promise<number> => {
        try {
            const { data, error } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('id', nasabahId)
                .single();

            if (error) return 0; // Silent fail - nasabah may not exist in DB
            return data?.saldo || 0;
        } catch {
            return 0; // Silent fail - fallback to localStorage in dashboard
        }
    }, []);

    const value: PenyetoranContextType = {
        penyetoranList,
        loading,
        error,
        fetchPenyetoranByBank,
        fetchPenyetoranByNasabah,
        addPenyetoran,
        updatePenyetoran,
        deletePenyetoran,
        refreshPenyetoran,
        getTotalPenyetoranByNasabah,
        getSaldoByNasabah,
    };

    return (
        <PenyetoranContext.Provider value={value}>
            {children}
        </PenyetoranContext.Provider>
    );
}

export function usePenyetoran() {
    const context = useContext(PenyetoranContext);
    if (context === undefined) {
        throw new Error('usePenyetoran must be used within a PenyetoranProvider');
    }
    return context;
}
