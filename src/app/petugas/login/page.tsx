'use client';

import Link from 'next/link';
import { useState, Suspense, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePetugas, Petugas } from '@/contexts/PetugasContext';
import { showStandaloneToast } from '@/components/shared/Toast';
import { loginPetugas } from '@/app/actions/auth';

function PetugasLoginContent() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Kept for password change loading state

    // Password change modal states
    const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
    const [currentPetugas, setCurrentPetugas] = useState<any>(null); // Type any for session data
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const router = useRouter();
    const { updatePassword } = usePetugas();

    const [state, formAction, isPending] = useActionState(loginPetugas, { success: false, error: '' });

    useEffect(() => {
        if (state.success && state.petugas) {
            // Check if password change is required
            if (state.mustChangePassword) {
                setCurrentPetugas(state.petugas);
                setShowPasswordChangeModal(true);
                return;
            }

            // Login successful
            completeLogin(state.petugas);
        } else if (state.error) {
            showStandaloneToast('error', 'Login Gagal', state.error);
        }
    }, [state, router]);

    const completeLogin = (petugasData: any, skipToast?: boolean) => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'petugas');
        localStorage.setItem('petugasData', JSON.stringify({
            id: petugasData.id,
            nama: petugasData.nama,
            email: petugasData.email,
            noHp: petugasData.noHp,
            bankSampahId: petugasData.bankSampahId,
            bankSampahNama: petugasData.bankSampahNama
        }));

        if (!skipToast) {
            showStandaloneToast('success', 'Login Berhasil', `Selamat datang, ${petugasData.nama}!`);
        }
        router.push('/petugas/dashboard');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (newPassword.length < 6) {
            showStandaloneToast('error', 'Password Terlalu Pendek', 'Password minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            showStandaloneToast('error', 'Password Tidak Cocok', 'Password baru dan konfirmasi tidak sama');
            return;
        }

        if (newPassword === 'Test1234') {
            showStandaloneToast('error', 'Password Tidak Valid', 'Gunakan password yang berbeda dari password default');
            return;
        }

        setIsChangingPassword(true);

        try {
            if (currentPetugas) {
                // Note: updatePassword from context might fail if it relies on RLS and we don't have a Supabase session.
                // However, petugas table updates usually typically require RLS or admin rights.
                // Since we are migrating to Cookies, this client-side call might be risky if RLS expects auth.uid().
                // But for now we try. If it fails, we might need a server action for password update too.
                const success = await updatePassword(currentPetugas.id, newPassword);

                if (success) {
                    showStandaloneToast('success', 'Password Berhasil Diubah', `Selamat datang, ${currentPetugas.nama}!`);
                    setShowPasswordChangeModal(false);
                    completeLogin(currentPetugas, true);
                } else {
                    showStandaloneToast('error', 'Gagal', 'Tidak dapat mengubah password. Silakan coba lagi.');
                }
            }
        } catch (err) {
            showStandaloneToast('error', 'Error', 'Terjadi kesalahan saat mengubah password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link href="/" title="" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Login Petugas</h1>
                        <p className="text-sm text-primary">Masuk ke sistem petugas untuk melayani penyetoran sampah OSKU</p>
                    </div>

                    {state.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                            <i className="fas fa-exclamation-circle"></i>
                            {state.error}
                        </div>
                    )}

                    <form className="space-y-4" action={formAction}>
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Email Petugas</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="Masukkan email petugas"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-500"
                                />
                            </div>
                        </div>

                        {/* Show Password Checkbox & Forgot Password */}
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show-password"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                                />
                                <label htmlFor="show-password" className="text-xs text-primary select-none cursor-pointer">
                                    Tampilkan Password
                                </label>
                            </div>
                            <Link href="/forgot-password?role=petugas" title="" className="text-xs text-primary hover:underline font-medium">
                                Lupa Password?
                            </Link>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="block w-full bg-primary hover:bg-primary-dark text-white text-center font-medium py-3 rounded-full transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Memproses...
                                    </span>
                                ) : (
                                    'Masuk Petugas'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Password Change Modal */}
            {showPasswordChangeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-key text-primary text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-primary mb-2">Ganti Password</h3>
                            <p className="text-gray-600 text-sm">
                                Ini adalah login pertama Anda. Demi keamanan, silakan buat password baru.
                            </p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Password Baru</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimal 6 karakter"
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-primary mb-2">Konfirmasi Password Baru</label>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi password baru"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none text-sm"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="show-new-password"
                                    checked={showNewPassword}
                                    onChange={() => setShowNewPassword(!showNewPassword)}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                                />
                                <label htmlFor="show-new-password" className="text-xs text-primary select-none cursor-pointer">
                                    Tampilkan Password
                                </label>
                            </div>

                            <div className="bg-tertiary rounded-xl p-3 mt-4">
                                <p className="text-xs text-primary">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Password harus berbeda dari password default (Test1234)
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPassword || !newPassword || !confirmPassword}
                                className="w-full px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isChangingPassword ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Menyimpan...
                                    </span>
                                ) : (
                                    'Simpan Password Baru'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PetugasLogin() {
    return (
        <Suspense fallback={null}>
            <PetugasLoginContent />
        </Suspense>
    );
}
