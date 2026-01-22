'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase, DbPencairan } from '@/lib/supabase';

// Extended type for pencairan with related data
interface PencairanWithDetails extends DbPencairan {
    nasabah_name?: string;
    nasabah_username?: string;
    bank_sampah_name?: string;
}

interface PencairanContextType {
    pencairanList: PencairanWithDetails[];
    approvedList: PencairanWithDetails[];
    historyList: PencairanWithDetails[];
    loading: boolean;
    error: string | null;
    fetchPencairanByBank: (bankId: string) => Promise<void>;
    fetchApprovedByBank: (bankId: string) => Promise<void>;
    fetchPencairanByNasabah: (nasabahId: string) => Promise<PencairanWithDetails[]>;
    addPencairan: (data: Omit<DbPencairan, 'id'>) => Promise<DbPencairan | null>;
    approvePencairan: (id: string, petugasId: string) => Promise<boolean>;
    rejectPencairan: (id: string, reason: string, petugasId: string) => Promise<boolean>;
    completePencairan: (id: string) => Promise<boolean>;
    cancelPencairan: (id: string, reason: string) => Promise<boolean>;
    refreshPencairan: () => Promise<void>;
    getTotalPencairanByNasabah: (nasabahId: string) => Promise<number>;
}

const PencairanContext = createContext<PencairanContextType | undefined>(undefined);

export function PencairanProvider({ children }: { children: ReactNode }) {
    const [pencairanList, setPencairanList] = useState<PencairanWithDetails[]>([]);
    const [approvedList, setApprovedList] = useState<PencairanWithDetails[]>([]);
    const [historyList, setHistoryList] = useState<PencairanWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBankId, setCurrentBankId] = useState<string | null>(null);

    // Fetch pending pencairan by bank ID (for persetujuan petugas)
    const fetchPencairanByBank = useCallback(async (bankId: string) => {
        setLoading(true);
        setError(null);
        setCurrentBankId(bankId);

        try {
            // Fetch pending requests
            const { data: pendingData, error: pendingError } = await supabase
                .from('pencairan')
                .select(`
                    *,
                    nasabah:nasabah_id (name, username)
                `)
                .eq('bank_sampah_id', bankId)
                .eq('status', 'pending')
                .order('tanggal_pengajuan', { ascending: false });

            if (pendingError) throw pendingError;

            const mappedPending: PencairanWithDetails[] = (pendingData || []).map((item: any) => ({
                ...item,
                nasabah_name: item.nasabah?.name || '-',
                nasabah_username: item.nasabah?.username || '-',
            }));

            setPencairanList(mappedPending);

            // Fetch history (approved, rejected, completed)
            const { data: historyData, error: historyError } = await supabase
                .from('pencairan')
                .select(`
                    *,
                    nasabah:nasabah_id (name, username)
                `)
                .eq('bank_sampah_id', bankId)
                .in('status', ['approved', 'rejected', 'completed'])
                .order('tanggal_pengajuan', { ascending: false });

            if (historyError) throw historyError;

            const mappedHistory: PencairanWithDetails[] = (historyData || []).map((item: any) => ({
                ...item,
                nasabah_name: item.nasabah?.name || '-',
                nasabah_username: item.nasabah?.username || '-',
            }));

            setHistoryList(mappedHistory);

        } catch (err: any) {
            console.error('Error fetching pencairan:', err);
            setError(err.message || 'Failed to fetch pencairan data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch approved pencairan (for konfirmasi petugas)
    const fetchApprovedByBank = useCallback(async (bankId: string) => {
        setLoading(true);
        setError(null);
        setCurrentBankId(bankId);

        try {
            const { data, error: fetchError } = await supabase
                .from('pencairan')
                .select(`
                    *,
                    nasabah:nasabah_id (name, username)
                `)
                .eq('bank_sampah_id', bankId)
                .eq('status', 'approved')
                .order('tanggal_pengajuan', { ascending: false });

            if (fetchError) throw fetchError;

            const mappedData: PencairanWithDetails[] = (data || []).map((item: any) => ({
                ...item,
                nasabah_name: item.nasabah?.name || '-',
                nasabah_username: item.nasabah?.username || '-',
            }));

            setApprovedList(mappedData);
        } catch (err: any) {
            console.error('Error fetching approved pencairan:', err);
            setError(err.message || 'Failed to fetch approved data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch pencairan by nasabah ID (for nasabah dashboard)
    const fetchPencairanByNasabah = useCallback(async (nasabahId: string): Promise<PencairanWithDetails[]> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('pencairan')
                .select('*')
                .eq('nasabah_id', nasabahId)
                .order('tanggal_pengajuan', { ascending: false });

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err: any) {
            console.error('Error fetching pencairan by nasabah:', err);
            return [];
        }
    }, []);

    // Add new pencairan request (from nasabah)
    const addPencairan = useCallback(async (data: Omit<DbPencairan, 'id'>): Promise<DbPencairan | null> => {
        try {
            // Generate sequential ID for id_pengajuan
            const { data: lastRecord } = await supabase
                .from('pencairan')
                .select('id_pengajuan')
                .order('id_pengajuan', { ascending: false })
                .limit(1);

            const lastId = lastRecord?.[0]?.id_pengajuan ? parseInt(lastRecord[0].id_pengajuan) : 0;
            const newIdPengajuan = (lastId + 1).toString().padStart(8, '0');

            const { data: inserted, error: insertError } = await supabase
                .from('pencairan')
                .insert({
                    ...data,
                    id_pengajuan: newIdPengajuan,
                    status: 'pending',
                    tanggal_pengajuan: new Date().toISOString(),
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return inserted;
        } catch (err: any) {
            console.error('Error adding pencairan:', err);
            setError(err.message || 'Failed to add pencairan');
            return null;
        }
    }, []);

    // Approve pencairan (petugas)
    const approvePencairan = useCallback(async (id: string, petugasId: string): Promise<boolean> => {
        try {
            // First check if record exists in database
            const { data: existing } = await supabase
                .from('pencairan')
                .select('id')
                .eq('id', id)
                .single();

            // If record doesn't exist in database, return false to trigger localStorage fallback
            if (!existing) {
                return false;
            }

            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'approved',
                    petugas_id: petugasId,
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Refresh lists
            if (currentBankId) {
                await fetchPencairanByBank(currentBankId);
                await fetchApprovedByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error approving pencairan:', err);
            setError(err.message || 'Failed to approve pencairan');
            return false;
        }
    }, [currentBankId, fetchPencairanByBank, fetchApprovedByBank]);

    // Reject pencairan (petugas)
    const rejectPencairan = useCallback(async (id: string, reason: string, petugasId: string): Promise<boolean> => {
        try {
            // First check if record exists in database
            const { data: existing } = await supabase
                .from('pencairan')
                .select('id')
                .eq('id', id)
                .single();

            // If record doesn't exist in database, return false to trigger localStorage fallback
            if (!existing) {
                return false;
            }

            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'rejected',
                    alasan: reason,
                    petugas_id: petugasId,
                    tanggal_selesai: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Refresh lists
            if (currentBankId) {
                await fetchPencairanByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error rejecting pencairan:', err);
            setError(err.message || 'Failed to reject pencairan');
            return false;
        }
    }, [currentBankId, fetchPencairanByBank]);

    // Complete pencairan (konfirmasi petugas)
    const completePencairan = useCallback(async (id: string): Promise<boolean> => {
        try {
            // Get pencairan details first
            const { data: pencairan } = await supabase
                .from('pencairan')
                .select('nasabah_id, jumlah')
                .eq('id', id)
                .single();

            if (!pencairan) throw new Error('Pencairan not found');

            // Update pencairan status
            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'completed',
                    tanggal_selesai: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Deduct saldo from nasabah
            const { data: nasabah } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('id', pencairan.nasabah_id)
                .single();

            if (nasabah) {
                const newSaldo = Math.max(0, (nasabah.saldo || 0) - pencairan.jumlah);
                await supabase
                    .from('nasabah')
                    .update({ saldo: newSaldo })
                    .eq('id', pencairan.nasabah_id);
            }

            // Refresh lists
            if (currentBankId) {
                await fetchApprovedByBank(currentBankId);
                await fetchPencairanByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error completing pencairan:', err);
            setError(err.message || 'Failed to complete pencairan');
            return false;
        }
    }, [currentBankId, fetchApprovedByBank, fetchPencairanByBank]);

    // Cancel pencairan (from konfirmasi page)
    const cancelPencairan = useCallback(async (id: string, reason: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'rejected',
                    alasan: reason,
                    tanggal_selesai: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Refresh lists
            if (currentBankId) {
                await fetchApprovedByBank(currentBankId);
                await fetchPencairanByBank(currentBankId);
            }

            return true;
        } catch (err: any) {
            console.error('Error canceling pencairan:', err);
            setError(err.message || 'Failed to cancel pencairan');
            return false;
        }
    }, [currentBankId, fetchApprovedByBank, fetchPencairanByBank]);

    // Refresh current data
    const refreshPencairan = useCallback(async () => {
        if (currentBankId) {
            await fetchPencairanByBank(currentBankId);
            await fetchApprovedByBank(currentBankId);
        }
    }, [currentBankId, fetchPencairanByBank, fetchApprovedByBank]);

    // Get total count of completed pencairan for a nasabah
    const getTotalPencairanByNasabah = useCallback(async (nasabahId: string): Promise<number> => {
        try {
            const { count, error } = await supabase
                .from('pencairan')
                .select('*', { count: 'exact', head: true })
                .eq('nasabah_id', nasabahId)
                .eq('status', 'completed');

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Error getting total pencairan:', err);
            return 0;
        }
    }, []);

    const value: PencairanContextType = {
        pencairanList,
        approvedList,
        historyList,
        loading,
        error,
        fetchPencairanByBank,
        fetchApprovedByBank,
        fetchPencairanByNasabah,
        addPencairan,
        approvePencairan,
        rejectPencairan,
        completePencairan,
        cancelPencairan,
        refreshPencairan,
        getTotalPencairanByNasabah,
    };

    return (
        <PencairanContext.Provider value={value}>
            {children}
        </PencairanContext.Provider>
    );
}

export function usePencairan() {
    const context = useContext(PencairanContext);
    if (context === undefined) {
        throw new Error('usePencairan must be used within a PencairanProvider');
    }
    return context;
}
