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
    readyPencairan: (id: string) => Promise<boolean>;
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

            // Fetch history (approved, rejected, completed, cancelled)
            const { data: historyData, error: historyError } = await supabase
                .from('pencairan')
                .select(`
                    *,
                    nasabah:nasabah_id (name, username)
                `)
                .eq('bank_sampah_id', bankId)
                .in('status', ['approved', 'rejected', 'completed', 'cancelled'])
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

    // Add new pencairan request (from nasabah) - CHECK ONLY, consume saldo on APPROVAL
    const addPencairan = useCallback(async (data: Omit<DbPencairan, 'id'>): Promise<DbPencairan | null> => {
        try {
            // Check if nasabah exists and has enough balance (Validation Only)
            const { data: nasabah, error: nasabahError } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('id', data.nasabah_id)
                .single();

            if (nasabahError || !nasabah) {
                throw new Error('Nasabah tidak ditemukan');
            }

            if ((nasabah.saldo || 0) < data.jumlah) {
                throw new Error('Saldo tidak mencukupi');
            }

            // Generate sequential ID for id (PK) (format: O + 7 digits, e.g., O0000001)
            const { data: inserted, error: insertError } = await supabase
                .from('pencairan')
                .insert({
                    ...data,
                    status: 'pending',
                    tanggal_pengajuan: new Date().toISOString(),
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }


            // NOTIFICATION: Notify Petugas
            await supabase.from('notifikasi').insert({
                recipient_role: 'petugas',
                recipient_id: null, // Broadcast to all petugas
                type: 'persetujuan',
                title: 'Pengajuan Baru',
                message: `Nasabah mengajukan pencairan sebesar Rp ${data.jumlah.toLocaleString('id-ID')}`,
                link: '/petugas/dashboard?tab=persetujuan',
                reference_id: inserted.id, // Use UUID for reliable reference
                reference_type: 'pencairan'
            });

            // NOTIFICATION: Notify Nasabah (Confirmation)
            await supabase.from('notifikasi').insert({
                recipient_role: 'nasabah',
                recipient_id: data.nasabah_id,
                type: 'info',
                title: 'Pengajuan Terkirim',
                message: `Pengajuan pencairan sebesar Rp ${data.jumlah.toLocaleString('id-ID')} berhasil dikirim dan sedang menunggu persetujuan petugas.`,
                link: '/dashboard?tab=pencairan',
                reference_id: inserted.id,
                reference_type: 'pencairan',
                status: 'Menunggu',
                amount: `Rp ${data.jumlah.toLocaleString('id-ID')}`
            });

            return inserted;
        } catch (err: any) {
            console.error('Error adding pencairan:', err);
            setError(err.message || 'Failed to add pencairan');
            return null;
        }
    }, []);

    // Approve pencairan (petugas) - DEDUCT SALDO HERE
    const approvePencairan = useCallback(async (id: string, petugasId: string): Promise<boolean> => {
        try {
            // First get pencairan details 
            const { data: pencairan } = await supabase
                .from('pencairan')
                .select('id, nasabah_id, jumlah, status')
                .eq('id', id)
                .single();

            if (!pencairan) {
                return false;
            }

            // Prevent multiple deductions if already approved
            if (pencairan.status === 'approved') {
                console.warn('Pencairan already approved.');
                return true;
            }

            // Fetch nasabah current saldo
            const { data: nasabah } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('id', pencairan.nasabah_id)
                .single();

            if (!nasabah) {
                throw new Error('Nasabah not found');
            }

            // Check sufficiency again (Race condition safety)
            if ((nasabah.saldo || 0) < pencairan.jumlah) {
                throw new Error('Saldo nasabah tidak mencukupi saat ini');
            }

            // Deduct saldo
            const newSaldo = (nasabah.saldo || 0) - pencairan.jumlah;
            const { error: saldoError } = await supabase
                .from('nasabah')
                .update({ saldo: newSaldo })
                .eq('id', pencairan.nasabah_id);

            if (saldoError) throw new Error('Gagal memotong saldo nasabah');

            // Update pencairan status to approved
            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'approved',
                    petugas_id: petugasId,
                })
                .eq('id', id);

            if (updateError) {
                // Rollback deduction if update fails
                await supabase
                    .from('nasabah')
                    .update({ saldo: nasabah.saldo })
                    .eq('id', pencairan.nasabah_id);
                throw updateError;
            }

            // Refresh lists
            if (currentBankId) {
                await fetchPencairanByBank(currentBankId);
                await fetchApprovedByBank(currentBankId);
            }

            // AUTO-RESOLVE: Delete the "New Request" notification for Petugas
            await supabase.from('notifikasi')
                .delete()
                .eq('reference_id', id)
                .eq('recipient_role', 'petugas');

            // NOTIFICATION: Notify Nasabah
            await supabase.from('notifikasi').insert({
                recipient_role: 'nasabah',
                recipient_id: pencairan.nasabah_id,
                type: 'success',
                title: 'Pengajuan Disetujui',
                message: `Pengajuan pencairan Anda sebesar Rp ${pencairan.jumlah.toLocaleString('id-ID')} telah disetujui. Silakan ambil tunai di bank sampah.`,
                link: '/dashboard?tab=pencairan',
                reference_id: id,
                reference_type: 'pencairan',
                status: 'Disetujui',
                amount: `Rp ${pencairan.jumlah.toLocaleString('id-ID')}`
            });

            return true;
        } catch (err: any) {
            console.error('Error approving pencairan:', err);
            setError(err.message || 'Failed to approve pencairan');
            return false;
        }
    }, [currentBankId, fetchPencairanByBank, fetchApprovedByBank]);

    // Reject pencairan (petugas) - NO REFUND (Since not deducted yet)
    const rejectPencairan = useCallback(async (id: string, reason: string, petugasId: string): Promise<boolean> => {
        try {
            // First check status
            const { data: pencairan } = await supabase
                .from('pencairan')
                .select('status')
                .eq('id', id)
                .single();

            if (!pencairan) return false;

            // If it was somehow approved/deducted, we can't simple reject without refunding. 
            // But rejectPencairan is intended for Pending items.
            if (pencairan.status !== 'pending') {
                console.warn('Cannot reject non-pending pencairan via rejectPencairan');
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

            // AUTO-RESOLVE: Delete the "New Request" notification for Petugas
            await supabase.from('notifikasi')
                .delete()
                .eq('reference_id', id)
                .eq('recipient_role', 'petugas');

            // NOTIFICATION: Notify Nasabah
            // Get amount for message
            const { data: pencairanData } = await supabase.from('pencairan').select('jumlah, nasabah_id').eq('id', id).single();
            if (pencairanData) {
                await supabase.from('notifikasi').insert({
                    recipient_role: 'nasabah',
                    recipient_id: pencairanData.nasabah_id,
                    type: 'error',
                    title: 'Pengajuan Ditolak',
                    message: `Pengajuan pencairan Anda sebesar Rp ${pencairanData.jumlah.toLocaleString('id-ID')} ditolak. Alasan: ${reason}`,
                    link: '/dashboard?tab=pencairan',
                    reference_id: id,
                    reference_type: 'pencairan',
                    status: 'Ditolak'
                });
            }

            return true;
        } catch (err: any) {
            console.error('Error rejecting pencairan:', err);
            setError(err.message || 'Failed to reject pencairan');
            return false;
        }
    }, [currentBankId, fetchPencairanByBank]);

    // Complete pencairan - mark as completed after nasabah picks up cash (konfirmasi petugas)
    const completePencairan = useCallback(async (id: string): Promise<boolean> => {
        try {
            console.log('Completing pencairan with ID:', id);

            // Update pencairan status to completed
            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'completed',
                    tanggal_selesai: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            console.log('Pencairan completed successfully');

            // Refresh lists
            if (currentBankId) {
                await fetchApprovedByBank(currentBankId);
                await fetchPencairanByBank(currentBankId);
            }

            // NOTIFICATION: Notify Nasabah
            const { data: pencairanData } = await supabase.from('pencairan').select('jumlah, nasabah_id').eq('id', id).single();
            if (pencairanData) {
                await supabase.from('notifikasi').insert({
                    recipient_role: 'nasabah',
                    recipient_id: pencairanData.nasabah_id,
                    type: 'success',
                    title: 'Pencairan Selesai',
                    message: `Pencairan tunai sebesar Rp ${pencairanData.jumlah.toLocaleString('id-ID')} telah selesai.`,
                    link: '/dashboard?tab=pencairan',
                    status: 'Selesai'
                });
            }

            return true;
        } catch (err: any) {
            console.error('Error completing pencairan:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            setError(err.message || 'Failed to complete pencairan');
            return false;
        }
    }, [currentBankId, fetchApprovedByBank, fetchPencairanByBank]);

    // Ready pencairan - deprecated, use completePencairan instead
    const readyPencairan = useCallback(async (id: string): Promise<boolean> => {
        return await completePencairan(id);
    }, [completePencairan]);



    // Cancel pencairan (from konfirmasi page) - REFUND SALDO (Since it was approved/deducted)
    const cancelPencairan = useCallback(async (id: string, reason: string): Promise<boolean> => {
        try {
            console.log('Cancelling pencairan with ID:', id, 'Reason:', reason);

            // Get pencairan details first
            const { data: pencairan, error: fetchError } = await supabase
                .from('pencairan')
                .select('nasabah_id, jumlah, status')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('Fetch pencairan error:', fetchError);
                throw fetchError;
            }

            if (!pencairan) throw new Error('Pencairan not found');

            // Prevent double refund if already cancelled
            if (pencairan.status === 'cancelled' || pencairan.status === 'rejected') {
                console.warn('Pencairan already cancelled/rejected, skipping refund.');
                return false;
            }

            // Refund IS required here because we are cancelling an 'approved' request which has triggered a deduction

            // Refund saldo to nasabah
            const { data: nasabah, error: nasabahError } = await supabase
                .from('nasabah')
                .select('saldo')
                .eq('id', pencairan.nasabah_id)
                .single();

            if (nasabahError) {
                console.error('Fetch nasabah error:', nasabahError);
                throw nasabahError;
            }

            if (nasabah) {
                const newSaldo = (nasabah.saldo || 0) + pencairan.jumlah;
                console.log('Refunding saldo:', { oldSaldo: nasabah.saldo, refundAmount: pencairan.jumlah, newSaldo });

                const { error: saldoError } = await supabase
                    .from('nasabah')
                    .update({ saldo: newSaldo })
                    .eq('id', pencairan.nasabah_id);

                if (saldoError) {
                    console.error('Saldo update error:', saldoError);
                    throw saldoError;
                }
            }

            // Update pencairan status to cancelled
            const { error: updateError } = await supabase
                .from('pencairan')
                .update({
                    status: 'cancelled',
                    alasan: reason,
                    tanggal_selesai: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                console.error('Update pencairan error:', updateError);
                throw updateError;
            }

            console.log('Pencairan cancelled successfully');

            // Refresh lists
            if (currentBankId) {
                await fetchApprovedByBank(currentBankId);
                await fetchPencairanByBank(currentBankId);
            }

            // NOTIFICATION: Notify Nasabah
            await supabase.from('notifikasi').insert({
                recipient_role: 'nasabah',
                recipient_id: pencairan.nasabah_id,
                type: 'warning',
                title: 'Pengajuan Dibatalkan',
                message: `Pengajuan pencairan Anda sebesar Rp ${pencairan.jumlah.toLocaleString('id-ID')} dibatalkan oleh petugas. Alasan: ${reason}. Saldo telah dikembalikan.`,
                link: '/dashboard?tab=pencairan',
                reference_id: id,
                reference_type: 'pencairan',
                status: 'Dibatalkan'
            });

            return true;
        } catch (err: any) {
            console.error('Error canceling pencairan:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
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
        readyPencairan,
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
