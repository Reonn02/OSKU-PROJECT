'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, DbAdmin } from '@/lib/supabase';

// Interface for Admin profile
export interface Admin {
    id: string;
    nama: string;
    email: string;
    noHp: string;
    role: 'superadmin';
    kelurahan: string;
    createdAt: Date;
    updatedAt?: Date;
}

interface AdminContextType {
    admin: Admin | null;
    isLoading: boolean;
    updateAdmin: (updates: Partial<Admin>) => Promise<void>;
    setAdmin: (admin: Admin) => void;
    refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Default admin data - placeholder when database is not yet seeded
// This data will be replaced with actual data from Supabase after seeding
const DEFAULT_ADMIN: Admin = {
    id: '-',
    nama: '-',
    email: '-',
    noHp: '-',
    role: 'superadmin',
    kelurahan: '-',
    createdAt: new Date()
};

// Convert database record to Admin interface
const dbToAdmin = (db: DbAdmin): Admin => ({
    id: db.id,
    nama: db.nama,
    email: db.email,
    noHp: db.no_hp || '',
    role: db.role,
    kelurahan: db.kelurahan || '',
    createdAt: new Date(db.created_at),
    updatedAt: db.updated_at ? new Date(db.updated_at) : undefined
});

// Convert Admin interface to database format
const adminToDb = (admin: Partial<Admin>): Partial<DbAdmin> => {
    const result: Partial<DbAdmin> = {};
    if (admin.nama !== undefined) result.nama = admin.nama;
    if (admin.email !== undefined) result.email = admin.email;
    if (admin.noHp !== undefined) result.no_hp = admin.noHp;
    if (admin.role !== undefined) result.role = admin.role;
    if (admin.kelurahan !== undefined) result.kelurahan = admin.kelurahan;
    result.updated_at = new Date().toISOString();
    return result;
};

export function AdminProvider({ children }: { children: ReactNode }) {
    const [admin, setAdminState] = useState<Admin | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch admin from Supabase
    const fetchAdmin = async () => {
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .limit(1)
                .single();

            if (error) {
                console.warn('Supabase fetch error, using default:', error.message);
                setAdminState(DEFAULT_ADMIN);
                return;
            }

            if (data) {
                setAdminState(dbToAdmin(data));
                // Also store in sessionStorage for other components
                sessionStorage.setItem('userName', data.nama);
                sessionStorage.setItem('fullName', data.nama);
            } else {
                setAdminState(DEFAULT_ADMIN);
            }
        } catch (error) {
            console.error('Failed to fetch admin:', error);
            setAdminState(DEFAULT_ADMIN);
        } finally {
            setIsLoading(false);
        }
    };

    // Load admin on mount
    useEffect(() => {
        fetchAdmin();
    }, []);

    const updateAdmin = async (updates: Partial<Admin>) => {
        if (!admin) return;

        try {
            const dbUpdates = adminToDb(updates);
            const { error } = await supabase
                .from('admins')
                .update(dbUpdates)
                .eq('id', admin.id);

            if (error) {
                console.error('Failed to update admin:', error);
                return;
            }

            // Update local state
            setAdminState(prev => prev ? {
                ...prev,
                ...updates,
                updatedAt: new Date()
            } : null);

            // Update sessionStorage
            if (updates.nama) {
                sessionStorage.setItem('userName', updates.nama);
                sessionStorage.setItem('fullName', updates.nama);
            }
        } catch (error) {
            console.error('Failed to update admin:', error);
        }
    };

    const setAdmin = (newAdmin: Admin) => {
        setAdminState(newAdmin);
    };

    const refreshAdmin = async () => {
        setIsLoading(true);
        await fetchAdmin();
    };

    return (
        <AdminContext.Provider
            value={{
                admin,
                isLoading,
                updateAdmin,
                setAdmin,
                refreshAdmin,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
