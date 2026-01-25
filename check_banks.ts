
import { supabase } from './src/lib/supabase';
async function check() {
    const { count, error } = await supabase
        .from('bank_sampah')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
    console.log('Approved Banks:', count);
    if (error) console.error(error);
}
check();

