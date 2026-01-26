'use client';

import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface LocationData {
    address: string;
    rt: string;
    rw: string;
    kelurahan: string;
    kecamatan: string;
    kota: string;
    provinsi: string;
    postalCode: string;
}

type FormData = LocationData;

interface FormErrors {
    address?: string;
    rt?: string;
    rw?: string;
}

export default function DataDiri() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        address: '',
        rt: '',
        rw: '',
        kelurahan: 'Ciracas',
        kecamatan: 'Ciracas',
        kota: 'Jakarta Timur',
        provinsi: 'DKI Jakarta',
        postalCode: '13740',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Check if user came from registration
    useEffect(() => {
        const registrationData = sessionStorage.getItem('registrationData');
        if (!registrationData) {
            router.push('/register');
        }
    }, [router]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleBlur = (field: keyof FormData) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        if (!formData.address.trim()) {
            newErrors.address = 'Alamat lengkap wajib diisi';
            isValid = false;
        }

        if (!formData.rt.trim()) {
            newErrors.rt = 'RT wajib diisi';
            isValid = false;
        }

        if (!formData.rw.trim()) {
            newErrors.rw = 'RW wajib diisi';
            isValid = false;
        }



        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setTouched({
            address: true,
            rt: true,
            rw: true,
        });

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Get registration data
            const registrationDataStr = sessionStorage.getItem('registrationData');
            if (!registrationDataStr) {
                throw new Error('Registration data not found');
            }

            const registrationData = JSON.parse(registrationDataStr);

            // Merge with location data
            const profileData = {
                ...registrationData,
                ...formData,
            };

            // Save updated profile
            sessionStorage.setItem('registrationData', JSON.stringify(profileData));

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Redirect to bank selection page
            router.push('/pilih-lokasi');
        } catch (error) {
            console.error('Error submitting data:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col relative">
            <main className="flex-grow flex flex-col items-center justify-center p-4 py-8">
                <div className="w-full max-w-lg mb-4 flex justify-start">
                    <Link href="/register" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary-dark transition text-2xl">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                </div>
                <div className="w-full max-w-lg border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-2">Data Domisili</h1>
                        <p className="text-sm text-primary">Lengkapi informasi alamat tempat tinggal Anda</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Alamat Lengkap */}
                        <div className="space-y-1">
                            <label className="text-xs text-primary font-medium block">Alamat Lengkap*</label>
                            <textarea
                                placeholder="Contoh: Jl. Raya Bogor No. 123, dekat masjid Al-Ikhlas"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                onBlur={() => handleBlur('address')}
                                rows={3}
                                className={`w-full px-4 py-3 rounded-xl border ${touched.address && errors.address
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                                    } focus:outline-none focus:ring-1 text-sm text-gray-500 resize-none`}
                            />
                            {touched.address && errors.address && (
                                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                            )}
                        </div>

                        {/* RT & RW */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-primary font-medium block">RT*</label>
                                <input
                                    type="text"
                                    placeholder="01"
                                    maxLength={2}
                                    value={formData.rt}
                                    onChange={(e) => handleInputChange('rt', e.target.value.replace(/\D/g, ''))}
                                    onBlur={() => handleBlur('rt')}
                                    className={`w-full px-4 py-3 rounded-xl border ${touched.rt && errors.rt
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-primary focus:ring-primary'
                                        } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                                />
                                {touched.rt && errors.rt && (
                                    <p className="text-xs text-red-500 mt-1">{errors.rt}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-primary font-medium block">RW*</label>
                                <input
                                    type="text"
                                    placeholder="01"
                                    maxLength={2}
                                    value={formData.rw}
                                    onChange={(e) => handleInputChange('rw', e.target.value.replace(/\D/g, ''))}
                                    onBlur={() => handleBlur('rw')}
                                    className={`w-full px-4 py-3 rounded-xl border ${touched.rw && errors.rw
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:border-primary focus:ring-primary'
                                        } focus:outline-none focus:ring-1 text-sm text-gray-500`}
                                />
                                {touched.rw && errors.rw && (
                                    <p className="text-xs text-red-500 mt-1">{errors.rw}</p>
                                )}
                            </div>
                        </div>

                        {/* Location Info (Read-only) */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-xs text-primary font-bold mb-2">
                                <i className="fas fa-map-marker-alt mr-2"></i>
                                Lokasi Terdaftar
                            </p>
                            <div className="text-xs text-primary space-y-1">
                                <p><span className="font-semibold">Kelurahan:</span> {formData.kelurahan}</p>
                                <p><span className="font-semibold">Kecamatan:</span> {formData.kecamatan}</p>
                                <p><span className="font-semibold">Kota:</span> {formData.kota}</p>
                                <p><span className="font-semibold">Provinsi:</span> {formData.provinsi}</p>
                                <p><span className="font-semibold">Kode Pos:</span> 13740</p>
                            </div>
                        </div>



                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-full transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Lanjutkan'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
