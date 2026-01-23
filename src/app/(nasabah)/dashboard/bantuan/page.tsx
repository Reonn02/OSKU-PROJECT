'use client';

import { useState, useEffect } from 'react';
import NavbarNasabah from '@/components/NavbarNasabah';
import BantuanContent from '@/components/BantuanContent';
import KonfirmasiLogout from '@/components/konfirmasiLogout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function BantuanPage() {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { nasabah, signOut } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState<string>('-');

    useEffect(() => {
        if (nasabah?.name) {
            setDisplayName(nasabah.name);
        } else {
            // Fallback to sessionStorage
            try {
                const userProfileStr = sessionStorage.getItem('userProfile');
                if (userProfileStr) {
                    const userProfile = JSON.parse(userProfileStr);
                    setDisplayName(userProfile.fullName || '-');
                }
            } catch (error) {
                console.error('Error reading user profile:', error);
                setDisplayName('-');
            }
        }
    }, [nasabah]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-tertiary/20 pb-24 md:pb-8">
            <NavbarNasabah
                activeTab="bantuan"
                userName={displayName}
                setShowLogoutModal={setShowLogoutModal}
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 lg:px-12 py-8 pt-4">
                <BantuanContent role="nasabah" />
            </main>

            {/* Logout Confirmation Modal - using consistent component */}
            {showLogoutModal && (
                <KonfirmasiLogout onCancel={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
            )}
        </div>
    );
}
