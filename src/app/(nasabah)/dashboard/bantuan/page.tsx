'use client';

import { useState, useEffect } from 'react';
import NavbarNasabah from '@/components/NavbarNasabah';
import BantuanContent from '@/components/BantuanContent';
import KonfirmasiLogout from '@/components/konfirmasiLogout';

export default function BantuanPage() {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [displayName, setDisplayName] = useState<string>('-');

    useEffect(() => {
        // Read display name from sessionStorage (same as dashboard)
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
    }, []);

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
                <KonfirmasiLogout onCancel={() => setShowLogoutModal(false)} />
            )}
        </div>
    );
}
