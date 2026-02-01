'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Initialize Supabase Client for Server Actions
// Note: We use a fresh client per request in server actions to ensure thread safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loginAdmin(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'Email dan Password wajib diisi.' };
    }

    try {
        // Query admin from database
        const { data, error } = await supabase
            .rpc('get_admin_by_email', { p_email: email.trim().toLowerCase() })
            .single();

        if (error || !data) {
            return { success: false, error: 'Email tidak ditemukan.' };
        }

        const admin = data as any;

        // Check password (simple comparison as per current implementation)
        // Ideally this should use bcrypt/argon2 hashing, but following existing pattern for now
        if (admin.password !== password) {
            return { success: false, error: 'Password salah.' };
        }

        // Set HttpOnly Cookie
        const sessionData = {
            id: admin.id,
            role: 'admin',
            nama: admin.nama,
            email: admin.email
        };

        const cookieStore = await cookies(); // Await cookies() in Next.js 15+
        cookieStore.set('admin_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Admin Login Error:', error);
        return { success: false, error: 'Terjadi kesalahan pada server.' };
    }
}

export async function loginPetugas(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'Email dan Password wajib diisi.' };
    }

    try {
        const { data, error } = await supabase
            .from('petugas')
            .select(`
                *,
                bank_sampah:bank_sampah_id (
                    nama
                )
            `)
            .eq('email', email.trim().toLowerCase())
            .single();

        if (error || !data) {
            return { success: false, error: 'Email tidak ditemukan.' };
        }

        const petugas = data as any;

        if (petugas.password !== password) {
            return { success: false, error: 'Password salah.' };
        }

        const sessionData = {
            id: petugas.id,
            role: 'petugas',
            nama: petugas.nama,
            email: petugas.email,
            noHp: petugas.no_hp,
            bankSampahId: petugas.bank_sampah_id,
            bankSampahNama: petugas.bank_sampah?.nama || null,
            mustChangePassword: petugas.must_change_password
        };

        const cookieStore = await cookies();
        cookieStore.set('petugas_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return {
            success: true,
            mustChangePassword: petugas.must_change_password,
            petugas: sessionData // Return data to client for localStorage sync if needed
        };
    } catch (error) {
        console.error('Petugas Login Error:', error);
        return { success: false, error: 'Terjadi kesalahan pada server.' };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    cookieStore.delete('petugas_session');
    // Nasabah session (sb- authToken) is managed by Supabase client, 
    // but we can try to clear it here too if we know the name
}
