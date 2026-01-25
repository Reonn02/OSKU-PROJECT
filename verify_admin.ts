
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
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifyAdminData() {
    console.log('--- Verifying Admin Data Aggregation ---');

    console.log('1. Fetching Banks...');
    const { data: banks } = await supabase.from('bank_sampah').select('*');
    if (!banks) return console.error('No banks found');

    console.log('2. Fetching Transactions (joined)...');
    const { data: transactions } = await supabase
        .from('penyetoran')
        .select('*, jenis_sampah:jenis_sampah_id(nama, satuan, harga_per_satuan)');

    if (transactions && transactions.length > 0) {
        console.log(`- Found ${transactions.length} transactions`);
        const sample = transactions[0];
        console.log('- Sample Joined Data:', JSON.stringify({
            id: sample.id,
            jenis_sampah_id: sample.jenis_sampah_id,
            joined: sample.jenis_sampah
        }, null, 2));

        if (!sample.jenis_sampah?.nama) {
            console.error('❌ JOIN FAILED: jenis_sampah.nama is missing!');
        } else {
            console.log('✅ JOIN SUCCESS: jenis_sampah.nama is present');
        }
    } else {
        console.log('- No transactions found');
    }

    console.log('3. Fetching Pencairan...');
    const { data: pencairanList } = await supabase.from('pencairan').select('*');
    if (pencairanList) {
        console.log(`- Found ${pencairanList.length} pencairan records`);

        // Sum check
        const total = pencairanList.reduce((sum, p) => sum + (p.jumlah || 0), 0);
        console.log(`- Total Pencairan Amount: ${total}`);
    }

}

verifyAdminData();
