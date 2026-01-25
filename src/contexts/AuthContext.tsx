'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInNasabah, signOut as authSignOut, onAuthStateChange } from '@/lib/authService';
import { NasabahData } from '@/data/nasabahData';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    nasabah: NasabahData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    refreshNasabah: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [nasabah, setNasabah] = useState<NasabahData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch nasabah data based on auth user
    const fetchNasabahData = useCallback(async (authUserId: string) => {
        try {
            const data = await import('@/data/nasabahData').then(m => m.getNasabahByAuthUserId(authUserId));

            if (!data) {
                console.warn('Nasabah not found for auth user:', authUserId);
                setNasabah(null);
                return;
            }

            setNasabah(data);
        } catch (error) {
            console.error('Error fetching nasabah:', error);
            setNasabah(null);
        }
    }, []);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession?.user) {
                    setUser(currentSession.user);
                    setSession(currentSession);
                    await fetchNasabahData(currentSession.user.id);
                }
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = onAuthStateChange(async (authUser, authSession) => {
            setUser(authUser);
            setSession(authSession);

            if (authUser) {
                await fetchNasabahData(authUser.id);
            } else {
                setNasabah(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchNasabahData]);

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await signInNasabah(email, password);

            if (result.success && result.user) {
                setUser(result.user);
                setSession(result.session ?? null);
                await fetchNasabahData(result.user.id);
            }

            return {
                success: result.success,
                error: result.error,
            };
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await authSignOut();
            setUser(null);
            setSession(null);
            setNasabah(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshNasabah = async () => {
        if (user) {
            await fetchNasabahData(user.id);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        nasabah,
        isLoading,
        isAuthenticated: !!user && !!nasabah,
        signIn,
        signOut,
        refreshNasabah,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
