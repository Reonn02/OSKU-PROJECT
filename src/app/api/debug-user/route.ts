import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        // Use listUsers but handling pagination or just hoping for best for now,
        // actually let's try to loop a few pages if needed, or just list 100.
        const { data: { users }, error } = await getSupabaseAdmin().auth.admin.listUsers({
            perPage: 1000
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at,
                last_sign_in_at: user.last_sign_in_at,
                app_metadata: user.app_metadata,
                user_metadata: user.user_metadata,
                role: user.role,
                aud: user.aud,
                identities: user.identities
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
