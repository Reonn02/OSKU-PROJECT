import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request: NextRequest) {
    try {
        const { email: rawEmail, newPassword } = await request.json();

        // Validate input
        if (!rawEmail || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Email dan password baru wajib diisi' },
                { status: 400 }
            );
        }

        const email = rawEmail.trim();

        // Validate password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password minimal 6 karakter' },
                { status: 400 }
            );
        }

        let userType = null;
        let passwordReset = false;

        // 1. Try to find user in nasabah table (Supabase Auth) and update if found
        const { data: nasabah, error: nasabahError } = await supabaseAdmin
            .from('nasabah')
            .select('auth_user_id')
            .eq('email', email)
            .single();

        if (nasabah && nasabah.auth_user_id) {
            const userId = nasabah.auth_user_id;

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                {
                    password: newPassword,
                    email_confirm: true,
                    user_metadata: { email_verified: true }
                }
            );

            if (!updateError) {
                console.log('✅ Password berhasil direset untuk nasabah:', email);
                userType = 'nasabah';
                passwordReset = true;
            } else {
                console.error('Error updating nasabah password:', updateError);
                // Continue to try petugas even if nasabah failed
            }
        }

        // 2. Try to find user in petugas table (Custom Auth/Plaintext) and update if found
        const { data: petugas, error: petugasError } = await supabaseAdmin
            .from('petugas')
            .select('id')
            .eq('email', email)
            .single();

        if (petugas && petugas.id) {
            // Update password in petugas table
            const { error: updatePetugasError } = await supabaseAdmin
                .from('petugas')
                .update({ password: newPassword })
                .eq('id', petugas.id);

            if (!updatePetugasError) {
                console.log('✅ Password berhasil direset untuk petugas:', email);
                // If it's a petugas, we prefer redirecting to petugas login as it's more specific
                userType = 'petugas';
                passwordReset = true;
            } else {
                console.error('Error updating petugas password:', updatePetugasError);
            }
        }

        if (passwordReset) {
            return NextResponse.json({
                success: true,
                message: 'Password berhasil direset',
                userType: userType
            });
        }

        // If not found in either or both failed
        return NextResponse.json(
            { success: false, error: 'Email tidak terdaftar sebagai nasabah atau petugas' },
            { status: 404 }
        );

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
