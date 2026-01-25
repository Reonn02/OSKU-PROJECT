-- Migration to restore default UUID generation for all relevant tables

-- 1. Admins
ALTER TABLE admins ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 2. Bank Sampah (Already default but ensuring)
ALTER TABLE bank_sampah ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 3. Petugas
ALTER TABLE petugas ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 4. Nasabah
ALTER TABLE nasabah ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 5. Penyetoran (Restore default removed previously)
ALTER TABLE penyetoran ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 6. Pencairan (Restore default removed previously)
ALTER TABLE pencairan ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;

-- 7. Waste Types
ALTER TABLE waste_types ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;