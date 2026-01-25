
import { supabase } from './src/lib/supabase';

async function check() {
    console.log('Checking recent pencairan records...');
    const { data, error } = await supabase
        .from('pencairan')
        .select(`
            id,
            status,
            jumlah,
            bank_sampah_id,
            tanggal_pengajuan,
            nasabah:nasabah_id (name)
        `)
        .order('tanggal_pengajuan', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

check();
