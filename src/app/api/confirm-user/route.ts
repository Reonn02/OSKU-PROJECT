import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route to confirm a user's email after OTP verification
 * POST /api/confirm-user
 * 
 * This uses the service role key to bypass RLS and confirm the user
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if service role key is configured
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            console.error('Missing Supabase service role key or URL');
            return NextResponse.json(
                { success: false, message: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Update user to set email_confirmed_at
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
        );

        if (error) {
            console.error('Error confirming user:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to confirm user' },
                { status: 500 }
            );
        }

        console.log('✅ User confirmed successfully:', userId);

        return NextResponse.json(
            { success: true, message: 'User confirmed successfully', user: data.user },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in confirm-user API:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
