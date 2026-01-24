import { createClient } from '@supabase/supabase-js'

// Helper to create client safely - allows build to proceed even if env vars are missing
const getSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If env vars are missing (e.g. during build), return a dummy or null, 
    // OR create client but knowing it might fail at runtime.
    // Better: throw error only when invoked or used.

    if (!supabaseUrl || !supabaseAnonKey) {
        // Log warning but don't crash immediately to allow build static analysis
        console.warn('Supabase URL or Key missing. This is fine during build/static generation, but will fail at runtime.');

        // Return a proxy or just create client with empty strings if possible?
        // createClient throws if URL is required.
        // We can't export a valid client without URL.

        // Strategy: Export 'supabase' as a getter or proxy?
        // But 'supabase' is widely used as an object.

        // Alternative: Just check if we are in 'phase: production build' vs runtime?
        // Next.js doesn't easily expose this to code directly in a standard way.

        // Safest approach: If missing, don't crash, but validation will fail later.
        // But createClient throws.

        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance if possible, or force users to function call.
// Since refactoring the whole app is risky, let's try to export an object that initializes lazily?
// No, simpler: Modify the export to be null-safe or just throw custom error?
// The error 'supabaseUrl is required' comes from createClient.

// FIX: Check vars before creating.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

// Valid URL check
const isValidUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');
// We use a placeholder to allow build to pass. 
// This assumes the client isn't actively USED during build static generation (fetching data).
// If it is used, it will fail connection, which is better than crashing on import.


// Types for database tables
export interface DbAdmin {
    id: string;
    nama: string;
    email: string;
    password: string;
    no_hp: string | null;
    role: 'superadmin';
    kelurahan: string | null;
    avatar: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbBankSampah {
    id: string;
    nama: string;
    alamat: string;
    open_day: string;
    close_day: string;
    open_time: string;
    close_time: string;
    kontak_layanan: string | null;
    image: string | null;
    komisi_persen: number;
    created_at: string;
    updated_at: string | null;
}

export interface DbWasteType {
    id: string;
    bank_id: string;
    nama: string;
    satuan: 'kg' | 'ltr' | 'pcs';
    harga_per_satuan: number;
}

export interface DbNasabah {
    id: string;
    auth_user_id: string | null;
    username: string;
    name: string;
    email: string;
    phone: string | null;
    nik: string | null;
    saldo: number;
    bank_sampah: string | null;
    address: string | null;
    rt: string | null;
    rw: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    kota: string | null;
    provinsi: string | null;
    kodepos: string | null;
    created_at: string;
}

export interface DbBerita {
    id: string;
    judul: string;
    tanggal: string;
    author: string;
    ringkasan: string | null;
    konten_lengkap: string | null;
    gambar: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbBeritaKegiatan {
    id: string;
    judul: string;
    tanggal: string;
    author: string;
    deskripsi: string | null;
    konten_lengkap: string | null;
    gambar: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbPetugas {
    id: string;
    nama: string;
    email: string;
    password: string;
    no_hp: string | null;
    bank_sampah_id: string | null;
    avatar: string | null;
    must_change_password: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface DbPenyetoran {
    id: string;
    id_penyetoran: string | null;
    nasabah_id: string;
    petugas_id: string | null;
    bank_sampah_id: string | null;
    waste_type_id: string | null;
    berat: number;
    total_harga: number;
    tanggal: string;
    catatan: string | null;
    bukti_foto: string[] | null;
}

export interface DbPencairan {
    id: string;
    id_pengajuan: string | null;
    nasabah_id: string;
    petugas_id: string | null;
    bank_sampah_id: string | null;
    jumlah: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    alasan: string | null;
    tanggal_pengajuan: string;
    tanggal_selesai: string | null;
    catatan: string | null;
}
