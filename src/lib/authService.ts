'use client';

import { supabase } from './supabase';
import { User, AuthError, Session } from '@supabase/supabase-js';
import { getNasabahByUsername } from '@/data/nasabahData';

/**
 * Auth Service for Nasabah Authentication using Supabase Auth
 */

export interface AuthResult {
    success: boolean;
    user?: User | null;
    session?: Session | null;
    error?: string;
}

/**
 * Sign up a new nasabah with email and password
 * Note: This creates the Supabase Auth user, but the nasabah record
 * should be created separately after OTP verification
 */
export const signUpNasabah = async (
    email: string,
    password: string
): Promise<AuthResult> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Disable email confirmation from Supabase since we use custom OTP
                emailRedirectTo: undefined,
            },
        });

        if (error) {
            console.error('Supabase Auth signUp error:', error);
            return {
                success: false,
                error: getAuthErrorMessage(error),
            };
        }

        // Check if user already exists (Supabase returns user with identities = [] if email exists)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            return {
                success: false,
                error: 'Email sudah terdaftar. Silakan login.',
            };
        }

        return {
            success: true,
            user: data.user,
            session: data.session,
        };
    } catch (error) {
        console.error('SignUp error:', error);
        return {
            success: false,
            error: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.',
        };
    }
};

/**
 * Sign in nasabah with email and password
 */
export const signInNasabah = async (
    email: string,
    password: string
): Promise<AuthResult> => {
    try {
        let finalEmail = email;

        // If input is not an email (simple check), try to look up username
        if (!email.includes('@')) {
            const nasabah = await getNasabahByUsername(email);
            if (nasabah && nasabah.email) {
                finalEmail = nasabah.email;
            } else {
                return {
                    success: false,
                    error: 'Username tidak ditemukan.',
                };
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: finalEmail,
            password,
        });

        if (error) {
            console.error('Supabase Auth signIn error:', error);
            return {
                success: false,
                error: getAuthErrorMessage(error),
            };
        }

        return {
            success: true,
            user: data.user,
            session: data.session,
        };
    } catch (error) {
        console.error('SignIn error:', error);
        return {
            success: false,
            error: 'Terjadi kesalahan saat login. Silakan coba lagi.',
        };
    }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Supabase Auth signOut error:', error);
            return {
                success: false,
                error: 'Gagal logout. Silakan coba lagi.',
            };
        }

        return { success: true };
    } catch (error) {
        console.error('SignOut error:', error);
        return {
            success: false,
            error: 'Terjadi kesalahan saat logout.',
        };
    }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * Get current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
    callback: (user: User | null, session: Session | null) => void
) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null, session);
    });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
    email: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/forgot-password/reset`,
        });

        if (error) {
            return {
                success: false,
                error: getAuthErrorMessage(error),
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: 'Gagal mengirim email reset password.',
        };
    }
};

/**
 * Update user password
 */
export const updatePassword = async (
    newPassword: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            return {
                success: false,
                error: getAuthErrorMessage(error),
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Update password error:', error);
        return {
            success: false,
            error: 'Gagal memperbarui password.',
        };
    }
};

/**
 * Convert Supabase auth error to user-friendly message
 */
const getAuthErrorMessage = (error: AuthError): string => {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit') || message.includes('email rate limit exceeded')) {
        return 'Terlalu banyak percobaan. Silakan tunggu 1 jam dan coba lagi.';
    }

    switch (error.message) {
        case 'Invalid login credentials':
            return 'Email atau password salah.';
        case 'Email not confirmed':
            return 'Email belum diverifikasi.';
        case 'User already registered':
            return 'Email sudah terdaftar. Silakan login.';
        case 'Password should be at least 6 characters':
            return 'Password minimal 6 karakter.';
        case 'Unable to validate email address: invalid format':
            return 'Format email tidak valid.';
        case 'Signup requires a valid password':
            return 'Password tidak valid.';
        default:
            return error.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
};
