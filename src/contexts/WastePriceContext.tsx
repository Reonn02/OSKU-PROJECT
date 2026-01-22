'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useBankSampah } from './BankSampahContext';

export interface WastePrice {
    id: number;
    jenis: string;
    per: string;  // Kilogram, Liter, Satuan
    harga: number;
}

interface WastePriceContextType {
    wastePrices: WastePrice[];
    getUnitByJenis: (jenis: string) => string;
    calculateSaldo: (jenis: string, amount: number) => number;
}

const WastePriceContext = createContext<WastePriceContextType | undefined>(undefined);

export function WastePriceProvider({ children }: { children: ReactNode }) {
    const { banks } = useBankSampah();

    // Derive waste prices from all banks - aggregate unique waste types
    // If same waste type exists in multiple banks, use highest price
    const wastePrices = useMemo(() => {
        const priceMap = new Map<string, WastePrice>();
        let idCounter = 1;

        banks.forEach(bank => {
            (bank.wasteTypes || []).forEach(wt => {
                const key = wt.nama;
                const existing = priceMap.get(key);

                // Convert satuan to display format
                const per = wt.satuan === 'kg' ? 'Kilogram'
                    : wt.satuan === 'ltr' ? 'Liter'
                        : 'Satuan';

                if (!existing) {
                    priceMap.set(key, {
                        id: idCounter++,
                        jenis: wt.nama,
                        per: per,
                        harga: wt.hargaPerSatuan
                    });
                } else {
                    // Use the higher price if exists
                    if (wt.hargaPerSatuan > existing.harga) {
                        existing.harga = wt.hargaPerSatuan;
                    }
                }
            });
        });

        return Array.from(priceMap.values());
    }, [banks]);

    const getUnitByJenis = (jenis: string): string => {
        const found = wastePrices.find(w => w.jenis === jenis);
        return found?.per || 'Kilogram';
    };

    const calculateSaldo = (jenis: string, amount: number): number => {
        const found = wastePrices.find(w => w.jenis === jenis);
        if (!found) return 0;
        return found.harga * amount;
    };

    return (
        <WastePriceContext.Provider value={{
            wastePrices,
            getUnitByJenis,
            calculateSaldo
        }}>
            {children}
        </WastePriceContext.Provider>
    );
}

export function useWastePrice() {
    const context = useContext(WastePriceContext);
    if (!context) {
        throw new Error('useWastePrice must be used within a WastePriceProvider');
    }
    return context;
}

