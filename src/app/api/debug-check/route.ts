
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
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
