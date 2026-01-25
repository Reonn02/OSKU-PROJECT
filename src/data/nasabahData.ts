// Shared nasabah data storage service
// This service manages nasabah data using Supabase

import { supabase, DbNasabah } from '@/lib/supabase';

export interface NasabahData {
    id: string;
    authUserId?: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    nik?: string;
    saldo: number;
    bankSampah: string;
    bankSampahId?: string;
    address?: string;
    rt?: string;
    rw?: string;
    kelurahan?: string;
    kecamatan?: string;
    kota?: string;
    provinsi?: string;
    kodepos?: string;
    createdAt?: string;
}

// Default/seed data for nasabah (fallback) - Empty for fresh database
const DEFAULT_NASABAH_DATA: NasabahData[] = [];

// Convert database record to NasabahData interface
const dbToNasabah = (db: DbNasabah & { bank_info?: { nama: string } | null }): NasabahData => ({
    id: db.id,
    authUserId: db.auth_user_id || undefined,
    username: db.username,
    name: db.name,
    email: db.email,
    phone: db.phone || '',
    nik: db.nik || undefined,
    saldo: db.saldo,
    bankSampah: db.bank_info?.nama || '',
    bankSampahId: db.bank_sampah_id || undefined,
    address: db.address || undefined,
    rt: db.rt || undefined,
    rw: db.rw || undefined,
    kelurahan: db.kelurahan || undefined,
    kecamatan: db.kecamatan || undefined,
    kota: db.kota || undefined,
    provinsi: db.provinsi || undefined,
    kodepos: db.kodepos || undefined,
    createdAt: db.created_at
});

// Get all nasabah data from Supabase
export const getAllNasabah = async (): Promise<NasabahData[]> => {
    try {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*, bank_info:bank_sampah_id(nama)')
            .order('name');

        if (error) {
            console.warn('Supabase fetch error:', error.message);
            return DEFAULT_NASABAH_DATA;
        }

        return (data || []).map(dbToNasabah);
    } catch (error) {
        console.error('Failed to fetch nasabah:', error);
        return DEFAULT_NASABAH_DATA;
    }
};

// Synchronous version for backward compatibility (uses cached data)
let cachedNasabah: NasabahData[] = DEFAULT_NASABAH_DATA;
export const getAllNasabahSync = (): NasabahData[] => cachedNasabah;

// Initialize cache
export const initNasabahCache = async (): Promise<void> => {
    cachedNasabah = await getAllNasabah();
};

// Get nasabah by ID
export const getNasabahById = async (id: string): Promise<NasabahData | undefined> => {
    try {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*, bank_info:bank_sampah_id(nama)')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;
        return dbToNasabah(data);
    } catch {
        return undefined;
    }
};

// Get nasabah by name
export const getNasabahByName = async (name: string): Promise<NasabahData | undefined> => {
    try {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*, bank_info:bank_sampah_id(nama)')
            .eq('name', name)
            .single();

        if (error || !data) return undefined;
        return dbToNasabah(data);
    } catch {
        return undefined;
    }
};

// Get nasabah by bank sampah
export const getNasabahByBankSampah = async (bankSampah: string): Promise<NasabahData[]> => {
    try {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*, bank_info:bank_sampah_id(nama)')
            .ilike('bank_sampah', `%${bankSampah}%`);

        if (error) return [];
        return (data || []).map(dbToNasabah);
    } catch {
        return [];
    }
};

// Add new nasabah
export const addNasabah = async (nasabah: Omit<NasabahData, 'id' | 'saldo'>): Promise<NasabahData | null> => {
    try {
        const newId = Date.now().toString();
        // Lookup bank sampah ID if name is provided
        let bankId = null;
        if (nasabah.bankSampah) {
            const { data: bankData } = await supabase
                .from('bank_sampah')
                .select('id')
                .eq('nama', nasabah.bankSampah)
                .single();
            if (bankData) {
                bankId = bankData.id;
            }
        }

        const { data, error } = await supabase
            .from('nasabah')
            .insert({
                id: newId,
                auth_user_id: nasabah.authUserId || null,
                username: nasabah.username,
                name: nasabah.name,
                email: nasabah.email,
                phone: nasabah.phone,
                nik: nasabah.nik,
                saldo: 0,
                bank_sampah_id: bankId,
                address: nasabah.address,
                rt: nasabah.rt,
                rw: nasabah.rw,
                kelurahan: nasabah.kelurahan,
                kecamatan: nasabah.kecamatan,
                kota: nasabah.kota,
                provinsi: nasabah.provinsi,
                kodepos: nasabah.kodepos
            })
            .select('*, bank_info:bank_sampah_id(nama)')
            .single();

        if (error || !data) {
            console.error('Failed to add nasabah:', error);
            return null;
        }

        await initNasabahCache(); // Refresh cache
        return dbToNasabah(data);
    } catch (error) {
        console.error('Failed to add nasabah:', error);
        return null;
    }
};

// Get nasabah by Supabase Auth User ID
export const getNasabahByAuthUserId = async (authUserId: string): Promise<NasabahData | undefined> => {
    try {
        const { data, error } = await supabase
            .from('nasabah')
            .select('*, bank_info:bank_sampah_id(nama)')
            .eq('auth_user_id', authUserId)
            .single();

        if (error || !data) return undefined;
        return dbToNasabah(data);
    } catch {
        return undefined;
    }
};

// Update nasabah data
export const updateNasabah = async (id: string, updates: Partial<NasabahData>): Promise<NasabahData | null> => {
    try {
        const dbUpdates: Partial<DbNasabah> = {};
        if (updates.username !== undefined) dbUpdates.username = updates.username;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.nik !== undefined) dbUpdates.nik = updates.nik;
        if (updates.saldo !== undefined) dbUpdates.saldo = updates.saldo;
        // Lookup bank sampah ID if name is being updated
        if (updates.bankSampah !== undefined) {
            // bank_sampah text column is removed, we only update the ID
            // Try to find the ID
            const { data: bankData } = await supabase
                .from('bank_sampah')
                .select('id')
                .eq('nama', updates.bankSampah)
                .single();
            if (bankData) {
                dbUpdates.bank_sampah_id = bankData.id;
            }
        }

        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.rt !== undefined) dbUpdates.rt = updates.rt;
        if (updates.rw !== undefined) dbUpdates.rw = updates.rw;
        if (updates.kelurahan !== undefined) dbUpdates.kelurahan = updates.kelurahan;
        if (updates.kecamatan !== undefined) dbUpdates.kecamatan = updates.kecamatan;
        if (updates.kota !== undefined) dbUpdates.kota = updates.kota;
        if (updates.provinsi !== undefined) dbUpdates.provinsi = updates.provinsi;
        if (updates.kodepos !== undefined) dbUpdates.kodepos = updates.kodepos;

        const { data, error } = await supabase
            .from('nasabah')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, bank_info:bank_sampah_id(nama)')
            .single();

        if (error || !data) {
            console.error('Failed to update nasabah:', error);
            return null;
        }

        await initNasabahCache(); // Refresh cache
        return dbToNasabah(data);
    } catch (error) {
        console.error('Failed to update nasabah:', error);
        return null;
    }
};

// Update nasabah saldo (add to existing saldo)
export const addSaldoToNasabah = async (name: string, amount: number): Promise<NasabahData | null> => {
    try {
        // First get current saldo
        const { data: current, error: fetchError } = await supabase
            .from('nasabah')
            .select('id, saldo')
            .eq('name', name)
            .single();

        if (fetchError || !current) return null;

        const newSaldo = (current.saldo || 0) + amount;

        const { data, error } = await supabase
            .from('nasabah')
            .update({ saldo: newSaldo })
            .eq('id', current.id)
            .select()
            .single();

        if (error || !data) return null;

        await initNasabahCache();
        return dbToNasabah(data);
    } catch (error) {
        console.error('Failed to add saldo:', error);
        return null;
    }
};

// Delete nasabah completely (including Auth account)
export const deleteNasabah = async (id: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('delete_nasabah_completely', {
            target_nasabah_id: id
        });

        if (error) {
            console.error('Failed to delete nasabah (RPC):', error);
            // Fallback: Try deleting locally if RPC failed (though likely auth error)
            const { error: localError } = await supabase
                .from('nasabah')
                .delete()
                .eq('id', id);

            if (localError) return false;
            await initNasabahCache();
            return true;
        }

        await initNasabahCache();
        return true;
    } catch (error) {
        console.error('Failed to delete nasabah:', error);
        return false;
    }
};

// Get all nasabah names (for dropdowns)
export const getNasabahNames = async (): Promise<string[]> => {
    const nasabah = await getAllNasabah();
    return nasabah.map(n => n.name);
};

// Get total saldo of all nasabah
export const getTotalSaldo = async (): Promise<number> => {
    const nasabah = await getAllNasabah();
    return nasabah.reduce((total, n) => total + (n.saldo || 0), 0);
};

// Get total count of nasabah
export const getTotalNasabah = async (): Promise<number> => {
    const nasabah = await getAllNasabah();
    return nasabah.length;
};

// Format saldo as currency string
export const formatSaldo = (saldo: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(saldo).replace('IDR', 'Rp.');
};

// Legacy exports for backward compatibility
export const NASABAH_DATA = DEFAULT_NASABAH_DATA;
export const findNasabahByName = getNasabahByName;
