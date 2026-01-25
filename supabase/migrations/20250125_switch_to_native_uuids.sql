-- WARNING: THIS MIGRATION WILL DELETE ALL DATA
-- Purpose: Convert all ID columns from TEXT to native UUID type

-- 1. Truncate all tables to ensure clean state
TRUNCATE TABLE 
    admins, 
    bank_sampah, 
    waste_types, 
    petugas, 
    nasabah, 
    berita, 
    berita_kegiatan, 
    penyetoran, 
    pencairan 
    CASCADE;

-- 2. Modify Tables to use UUID type
-- We use interpreting/casting to UUID, which works on empty tables perfectly.

-- Admin
ALTER TABLE admins 
    DROP CONSTRAINT IF EXISTS admins_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    DROP COLUMN IF EXISTS avatar,
    ADD PRIMARY KEY (id);

-- Bank Sampah
ALTER TABLE bank_sampah 
    DROP CONSTRAINT IF EXISTS bank_sampah_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ADD PRIMARY KEY (id);

-- Waste Types (Depends on Bank Sampah)
ALTER TABLE waste_types 
    DROP CONSTRAINT IF EXISTS waste_types_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN bank_id TYPE uuid USING bank_id::uuid,
    ADD PRIMARY KEY (id),
    ADD CONSTRAINT waste_types_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES bank_sampah(id) ON DELETE CASCADE;

-- Petugas (Depends on Bank Sampah)
ALTER TABLE petugas 
    DROP CONSTRAINT IF EXISTS petugas_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN bank_sampah_id TYPE uuid USING bank_sampah_id::uuid,
    DROP COLUMN IF EXISTS avatar,
    ADD PRIMARY KEY (id),
    ADD CONSTRAINT petugas_bank_sampah_id_fkey FOREIGN KEY (bank_sampah_id) REFERENCES bank_sampah(id) ON DELETE SET NULL;

-- Nasabah
ALTER TABLE nasabah 
    DROP CONSTRAINT IF EXISTS nasabah_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ADD PRIMARY KEY (id);
    -- auth_user_id is usually already UUID because it refs auth.users(id), which is uuid.
    -- If not, we would alter it too, but let's assume it matches auth.users.

-- Berita
ALTER TABLE berita 
    DROP CONSTRAINT IF EXISTS berita_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ADD PRIMARY KEY (id);

-- Berita Kegiatan
ALTER TABLE berita_kegiatan 
    DROP CONSTRAINT IF EXISTS berita_kegiatan_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ADD PRIMARY KEY (id);

-- Penyetoran
ALTER TABLE penyetoran 
    DROP CONSTRAINT IF EXISTS penyetoran_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN nasabah_id TYPE uuid USING nasabah_id::uuid,
    ALTER COLUMN petugas_id TYPE uuid USING petugas_id::uuid,
    ALTER COLUMN bank_sampah_id TYPE uuid USING bank_sampah_id::uuid,
    ALTER COLUMN waste_type_id TYPE uuid USING waste_type_id::uuid,
    ADD PRIMARY KEY (id),
    ADD CONSTRAINT penyetoran_nasabah_id_fkey FOREIGN KEY (nasabah_id) REFERENCES nasabah(id) ON DELETE CASCADE,
    ADD CONSTRAINT penyetoran_petugas_id_fkey FOREIGN KEY (petugas_id) REFERENCES petugas(id) ON DELETE SET NULL,
    ADD CONSTRAINT penyetoran_bank_sampah_id_fkey FOREIGN KEY (bank_sampah_id) REFERENCES bank_sampah(id) ON DELETE SET NULL,
    ADD CONSTRAINT penyetoran_waste_type_id_fkey FOREIGN KEY (waste_type_id) REFERENCES waste_types(id) ON DELETE SET NULL;

-- Pencairan
ALTER TABLE pencairan 
    DROP CONSTRAINT IF EXISTS pencairan_pkey CASCADE,
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
    ALTER COLUMN nasabah_id TYPE uuid USING nasabah_id::uuid,
    ALTER COLUMN petugas_id TYPE uuid USING petugas_id::uuid,
    ALTER COLUMN bank_sampah_id TYPE uuid USING bank_sampah_id::uuid,
    ADD PRIMARY KEY (id),
    ADD CONSTRAINT pencairan_nasabah_id_fkey FOREIGN KEY (nasabah_id) REFERENCES nasabah(id) ON DELETE CASCADE,
    ADD CONSTRAINT pencairan_petugas_id_fkey FOREIGN KEY (petugas_id) REFERENCES petugas(id) ON DELETE SET NULL,
    ADD CONSTRAINT pencairan_bank_sampah_id_fkey FOREIGN KEY (bank_sampah_id) REFERENCES bank_sampah(id) ON DELETE SET NULL;


-- 3. Re-Seed Data
-- Insert Default Super Admin
INSERT INTO admins (id, nama, email, password, no_hp, role, kelurahan) 
VALUES (
    uuid_generate_v4(), 
    'Super Admin OSKU', 
    'oskuidn@gmail.com', 
    'admin123', 
    '0812-3456-7890', 
    'superadmin', 
    'Kelurahan Ciracas'
);
