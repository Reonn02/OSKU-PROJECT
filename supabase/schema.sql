-- ============================================
-- OSKU Database Schema for Supabase
-- Run this script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    no_hp TEXT,
    role TEXT CHECK (role IN ('superadmin')) DEFAULT 'superadmin',
    kelurahan TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================
-- 2. BANK SAMPAH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_sampah (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    open_day TEXT NOT NULL,
    close_day TEXT NOT NULL,
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    kontak_layanan TEXT,
    image TEXT,
    komisi_persen INTEGER DEFAULT 30 CHECK (komisi_persen >= 0 AND komisi_persen <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================
-- 3. WASTE TYPES TABLE (relasi ke bank_sampah)
-- ============================================
CREATE TABLE IF NOT EXISTS waste_types (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    bank_id TEXT REFERENCES bank_sampah(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    satuan TEXT CHECK (satuan IN ('kg', 'ltr', 'pcs')) NOT NULL,
    harga_per_satuan INTEGER NOT NULL
);

-- ============================================
-- 4. PETUGAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS petugas (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'Test1234',
    no_hp TEXT,
    bank_sampah_id TEXT REFERENCES bank_sampah(id) ON DELETE SET NULL,
    avatar TEXT,
    must_change_password BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================
-- 5. NASABAH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nasabah (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    nik TEXT,
    saldo INTEGER DEFAULT 0,
    bank_sampah TEXT,
    address TEXT,
    rt TEXT,
    rw TEXT,
    kelurahan TEXT,
    kecamatan TEXT,
    kota TEXT,
    provinsi TEXT,
    kodepos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. BERITA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS berita (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    judul TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    author TEXT NOT NULL,
    ringkasan TEXT,
    konten_lengkap TEXT,
    gambar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================
-- 7. BERITA KEGIATAN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS berita_kegiatan (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    judul TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    author TEXT NOT NULL,
    deskripsi TEXT,
    konten_lengkap TEXT,
    gambar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ============================================
-- 8. PENYETORAN TABLE (Deposit/Waste Collection Records)
-- ============================================
CREATE TABLE IF NOT EXISTS penyetoran (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    id_penyetoran TEXT UNIQUE,
    nasabah_id TEXT REFERENCES nasabah(id) ON DELETE CASCADE,
    petugas_id TEXT REFERENCES petugas(id) ON DELETE SET NULL,
    bank_sampah_id TEXT REFERENCES bank_sampah(id) ON DELETE SET NULL,
    waste_type_id TEXT REFERENCES waste_types(id) ON DELETE SET NULL,
    berat DECIMAL(10,2) NOT NULL,
    total_harga INTEGER NOT NULL,
    tanggal TIMESTAMPTZ DEFAULT NOW(),
    catatan TEXT,
    bukti_foto TEXT[]
);

-- ============================================
-- 9. PENCAIRAN TABLE (Withdrawal Records)
-- ============================================
CREATE TABLE IF NOT EXISTS pencairan (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    id_pengajuan TEXT UNIQUE,
    nasabah_id TEXT REFERENCES nasabah(id) ON DELETE CASCADE,
    petugas_id TEXT REFERENCES petugas(id) ON DELETE SET NULL,
    bank_sampah_id TEXT REFERENCES bank_sampah(id) ON DELETE SET NULL,
    jumlah INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
    alasan TEXT,
    tanggal_pengajuan TIMESTAMPTZ DEFAULT NOW(),
    tanggal_selesai TIMESTAMPTZ,
    catatan TEXT
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sampah ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE nasabah ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyetoran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pencairan ENABLE ROW LEVEL SECURITY;

-- Allow public read access to most tables (for landing page)
CREATE POLICY "Allow public read access" ON bank_sampah FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON waste_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON berita FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON berita_kegiatan FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin full access" ON admins FOR ALL USING (true);
CREATE POLICY "Admin full access on bank_sampah" ON bank_sampah FOR ALL USING (true);
CREATE POLICY "Admin full access on waste_types" ON waste_types FOR ALL USING (true);
CREATE POLICY "Admin full access on petugas" ON petugas FOR ALL USING (true);
CREATE POLICY "Admin full access on nasabah" ON nasabah FOR ALL USING (true);
CREATE POLICY "Admin full access on berita" ON berita FOR ALL USING (true);
CREATE POLICY "Admin full access on berita_kegiatan" ON berita_kegiatan FOR ALL USING (true);
CREATE POLICY "Admin full access on penyetoran" ON penyetoran FOR ALL USING (true);
CREATE POLICY "Admin full access on pencairan" ON pencairan FOR ALL USING (true);

-- ============================================
-- SEED DATA (Admin Only)
-- ============================================

-- Seed Super Admin Data (password: admin123)
INSERT INTO admins (id, nama, email, password, no_hp, role, kelurahan, created_at) VALUES
('30001', 'Super Admin OSKU', 'oskuidn@gmail.com', 'admin123', '0812-3456-7890', 'superadmin', 'Kelurahan Ciracas', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_waste_types_bank_id ON waste_types(bank_id);
CREATE INDEX IF NOT EXISTS idx_nasabah_bank_sampah ON nasabah(bank_sampah);
CREATE INDEX IF NOT EXISTS idx_penyetoran_nasabah_id ON penyetoran(nasabah_id);
CREATE INDEX IF NOT EXISTS idx_penyetoran_tanggal ON penyetoran(tanggal);
CREATE INDEX IF NOT EXISTS idx_penyetoran_id_penyetoran ON penyetoran(id_penyetoran);
CREATE INDEX IF NOT EXISTS idx_pencairan_nasabah_id ON pencairan(nasabah_id);
CREATE INDEX IF NOT EXISTS idx_pencairan_status ON pencairan(status);
CREATE INDEX IF NOT EXISTS idx_pencairan_id_pengajuan ON pencairan(id_pengajuan);
CREATE INDEX IF NOT EXISTS idx_pencairan_bank_sampah_id ON pencairan(bank_sampah_id);
CREATE INDEX IF NOT EXISTS idx_nasabah_auth_user_id ON nasabah(auth_user_id);
