
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars manually
const envPath = path.resolve(__dirname, '.env.local');
const envVars: any = {};

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            envVars[key] = value;
        }
    });
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- FIXING PENDING REQUESTS ---');

    // 1. Get Pending Requests
    const { data: pending, error } = await supabase
        .from('pencairan')
        .select('id, jumlah, bank_sampah_id, nasabah_id')
        .eq('status', 'pending');

    // 2. Find Target Bank
    const checkName = 'Bank Sampah Pelangi Bulan 76';
    const { data: targetBank } = await supabase.from('bank_sampah').select('id, nama').ilike('nama', `%${checkName}%`).single();

    if (targetBank && pending && pending.length > 0) {
        console.log(`\nMoving ${pending.length} pending requests to ${targetBank.nama} (${targetBank.id})...`);

        for (const p of pending) {
            // Only move if it's NOT already there
            if (p.bank_sampah_id !== targetBank.id) {
                const { error: updateError } = await supabase
                    .from('pencairan')
                    .update({ bank_sampah_id: targetBank.id })
                    .eq('id', p.id);

                if (!updateError) console.log(`Moved Request ${p.id} to ${targetBank.nama}`);
                else console.error(`Failed to move ${p.id}:`, updateError);
            } else {
                console.log(`Request ${p.id} is already in correct bank.`);
            }
        }
    } else {
        console.log('No eligible pending requests or target bank not found.');
    }

}

check();
