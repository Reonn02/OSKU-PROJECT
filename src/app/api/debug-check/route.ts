
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
    // Lazy init to avoid build error
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
};

export async function GET() {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

    // 1. Get all banks
    const { data: banks } = await supabase.from('bank_sampah').select('id, nama');

    // 2. Get all nasabah
    const { data: nasabah } = await supabase.from('nasabah').select('id, name, bank_sampah');

    return NextResponse.json({
        banks,
        nasabah_sample: nasabah,
        analysis: "Check if nasabah.bank_sampah matches bank.id or bank.nama"
    }, { status: 200 });
}
