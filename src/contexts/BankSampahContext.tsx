'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DbBankSampah, DbWasteType } from '@/lib/supabase';

export interface WasteType {
    id: string;
    nama: string;
    satuan: string;
    hargaPerSatuan: number;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface BankSampah {
    id: string;
    nama: string;
    alamat: string;
    openDay: DayOfWeek;
    closeDay: DayOfWeek;
    openTime: string;
    closeTime: string;
    kontakLayanan?: string;
    image: string;
    komisiPersen: number;
    wasteTypes: WasteType[];
}

interface BankSampahContextType {
    banks: BankSampah[];
    isLoading: boolean;
    addBank: (bank: Omit<BankSampah, 'id'>, petugasId?: string) => Promise<void>;
    updateBank: (id: string, updates: Partial<BankSampah>, petugasId?: string) => Promise<void>;
    deleteBank: (id: string) => Promise<void>;
    getBankById: (id: string) => BankSampah | undefined;
    refreshBanks: () => Promise<void>;
    // Waste type management per bank
    addWasteType: (bankId: string, wasteType: Omit<WasteType, 'id'>) => Promise<void>;
    updateWasteType: (bankId: string, wasteTypeId: string, updates: Partial<WasteType>) => Promise<void>;
    deleteWasteType: (bankId: string, wasteTypeId: string) => Promise<void>;
}

const BankSampahContext = createContext<BankSampahContextType | undefined>(undefined);

// Default data fallback - Empty for fresh database
const DEFAULT_BANKS: BankSampah[] = [];

// Convert database records to BankSampah interface
const dbToBankSampah = (bank: DbBankSampah, wasteTypes: DbWasteType[]): BankSampah => ({
    id: bank.id,
    nama: bank.nama,
    alamat: bank.alamat,
    openDay: bank.open_day as DayOfWeek,
    closeDay: bank.close_day as DayOfWeek,
    openTime: bank.open_time,
    closeTime: bank.close_time,
    kontakLayanan: bank.kontak_layanan || undefined,
    image: bank.image || '/images/location1.svg',
    komisiPersen: bank.komisi_persen ?? 30,
    wasteTypes: wasteTypes
        .filter(wt => wt.bank_id === bank.id)
        .map(wt => ({
            id: wt.id,
            nama: wt.nama,
            satuan: wt.satuan,
            hargaPerSatuan: wt.harga_per_satuan
        }))
});

export function BankSampahProvider({ children }: { children: ReactNode }) {
    const [banks, setBanks] = useState<BankSampah[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch banks from Supabase
    const fetchBanks = async () => {
        try {
            // Fetch banks
            const { data: banksData, error: banksError } = await supabase
                .from('bank_sampah')
                .select('*')
                .order('nama');

            if (banksError) {
                console.warn('Supabase fetch error, using default:', banksError.message);
                setBanks(DEFAULT_BANKS);
                return;
            }

            // Fetch all waste types
            const { data: wasteTypesData, error: wtError } = await supabase
                .from('waste_types')
                .select('*');

            if (wtError) {
                console.warn('Failed to fetch waste types:', wtError.message);
            }

            const wasteTypes = wasteTypesData || [];
            const mappedBanks = (banksData || []).map(bank =>
                dbToBankSampah(bank, wasteTypes)
            );

            setBanks(mappedBanks.length > 0 ? mappedBanks : DEFAULT_BANKS);
        } catch (error) {
            console.error('Failed to fetch banks:', error);
            setBanks(DEFAULT_BANKS);
        } finally {
            setIsLoading(false);
        }
    };

    // Load banks on mount
    useEffect(() => {
        fetchBanks();
    }, []);

    const addBank = async (bank: Omit<BankSampah, 'id'>, petugasId?: string) => {
        try {
            const newId = Date.now().toString();
            const { error } = await supabase.from('bank_sampah').insert({
                id: newId,
                nama: bank.nama,
                alamat: bank.alamat,
                open_day: bank.openDay,
                close_day: bank.closeDay,
                open_time: bank.openTime,
                close_time: bank.closeTime,
                kontak_layanan: bank.kontakLayanan,
                image: bank.image
            });

            if (error) {
                console.error('Failed to add bank:', error);
                return;
            }

            // If a petugasId is provided, update the petugas record to link to this bank
            if (petugasId) {
                const { error: petugasError } = await supabase
                    .from('petugas')
                    .update({ bank_sampah_id: newId })
                    .eq('id', petugasId);

                if (petugasError) {
                    console.error('Failed to update petugas bank linkage:', petugasError);
                    // Optionally show a warning toast here if we had access to toast function
                }
            }

            // Add waste types if any
            if (bank.wasteTypes && bank.wasteTypes.length > 0) {
                const wasteTypesToInsert = bank.wasteTypes.map(wt => ({
                    id: `${newId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    bank_id: newId,
                    nama: wt.nama,
                    satuan: wt.satuan,
                    harga_per_satuan: wt.hargaPerSatuan
                }));

                await supabase.from('waste_types').insert(wasteTypesToInsert);
            }

            await fetchBanks(); // Refresh data
        } catch (error) {
            console.error('Failed to add bank:', error);
        }
    };

    const updateBank = async (id: string, updates: Partial<BankSampah>, petugasId?: string) => {
        try {
            const dbUpdates: Partial<DbBankSampah> = {};
            if (updates.nama !== undefined) dbUpdates.nama = updates.nama;
            if (updates.alamat !== undefined) dbUpdates.alamat = updates.alamat;
            if (updates.openDay !== undefined) dbUpdates.open_day = updates.openDay;
            if (updates.closeDay !== undefined) dbUpdates.close_day = updates.closeDay;
            if (updates.openTime !== undefined) dbUpdates.open_time = updates.openTime;
            if (updates.closeTime !== undefined) dbUpdates.close_time = updates.closeTime;
            if (updates.kontakLayanan !== undefined) dbUpdates.kontak_layanan = updates.kontakLayanan;
            if (updates.image !== undefined) dbUpdates.image = updates.image;
            if (updates.komisiPersen !== undefined) dbUpdates.komisi_persen = updates.komisiPersen;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('bank_sampah')
                .update(dbUpdates)
                .eq('id', id);

            if (error) {
                console.error('Failed to update bank:', error);
                return;
            }

            // If a petugasId is provided, update the petugas record to link to this bank
            if (petugasId) {
                const { error: petugasError } = await supabase
                    .from('petugas')
                    .update({ bank_sampah_id: id })
                    .eq('id', petugasId);

                if (petugasError) {
                    console.error('Failed to update petugas bank linkage:', petugasError);
                }
            }

            await fetchBanks(); // Refresh data
        } catch (error) {
            console.error('Failed to update bank:', error);
        }
    };

    const deleteBank = async (id: string) => {
        try {
            const { error } = await supabase
                .from('bank_sampah')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Failed to delete bank:', error);
                return;
            }

            setBanks(prev => prev.filter(bank => bank.id !== id));
        } catch (error) {
            console.error('Failed to delete bank:', error);
        }
    };

    const getBankById = (id: string) => {
        return banks.find(bank => bank.id === id);
    };

    const refreshBanks = async () => {
        setIsLoading(true);
        await fetchBanks();
    };

    // Waste type management functions
    const addWasteType = async (bankId: string, wasteTypeData: Omit<WasteType, 'id'>) => {
        try {
            const newId = `${bankId}-${Date.now()}`;
            const { error } = await supabase.from('waste_types').insert({
                id: newId,
                bank_id: bankId,
                nama: wasteTypeData.nama,
                satuan: wasteTypeData.satuan,
                harga_per_satuan: wasteTypeData.hargaPerSatuan
            });

            if (error) {
                console.error('Failed to add waste type:', error);
                return;
            }

            await fetchBanks(); // Refresh data
        } catch (error) {
            console.error('Failed to add waste type:', error);
        }
    };

    const updateWasteType = async (bankId: string, wasteTypeId: string, updates: Partial<WasteType>) => {
        try {
            const dbUpdates: Partial<DbWasteType> = {};
            if (updates.nama !== undefined) dbUpdates.nama = updates.nama;
            if (updates.satuan !== undefined) dbUpdates.satuan = updates.satuan as any;
            if (updates.hargaPerSatuan !== undefined) dbUpdates.harga_per_satuan = updates.hargaPerSatuan;

            const { error } = await supabase
                .from('waste_types')
                .update(dbUpdates)
                .eq('id', wasteTypeId);

            if (error) {
                console.error('Failed to update waste type:', error);
                return;
            }

            await fetchBanks(); // Refresh data
        } catch (error) {
            console.error('Failed to update waste type:', error);
        }
    };

    const deleteWasteType = async (bankId: string, wasteTypeId: string) => {
        try {
            const { error } = await supabase
                .from('waste_types')
                .delete()
                .eq('id', wasteTypeId);

            if (error) {
                console.error('Failed to delete waste type:', error);
                return;
            }

            await fetchBanks(); // Refresh data
        } catch (error) {
            console.error('Failed to delete waste type:', error);
        }
    };

    return (
        <BankSampahContext.Provider
            value={{
                banks,
                isLoading,
                addBank,
                updateBank,
                deleteBank,
                getBankById,
                refreshBanks,
                addWasteType,
                updateWasteType,
                deleteWasteType
            }}
        >
            {children}
        </BankSampahContext.Provider>
    );
}

export function useBankSampah() {
    const context = useContext(BankSampahContext);
    if (context === undefined) {
        throw new Error('useBankSampah must be used within a BankSampahProvider');
    }
    return context;
}
