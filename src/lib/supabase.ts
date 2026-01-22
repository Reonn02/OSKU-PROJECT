import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    alasan: string | null;
    tanggal_pengajuan: string;
    tanggal_selesai: string | null;
    catatan: string | null;
}
