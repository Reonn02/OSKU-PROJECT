-- Drop the check constraint on waste_types.satuan to allow any unit (e.g. 'pcs', 'butir', 'meter')
ALTER TABLE waste_types DROP CONSTRAINT IF EXISTS waste_types_satuan_check;
