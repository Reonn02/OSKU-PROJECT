'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-[#0f172a] text-white pt-16 pb-12 px-4 sm:px-6 lg:px-12 font-sans">
            <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-1">OSKU</h2>
                            <p className="text-xs text-gray-400 mb-4 italic">Olah Sampah Ku</p>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            {t('landing.footer.about_desc')}
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://www.youtube.com/" className="text-gray-400 hover:text-white transition">
                                <i className="fab fa-youtube text-xl"></i>
                            </a>
                            <a href="https://www.instagram.com/" className="text-gray-400 hover:text-white transition">
                                <i className="fab fa-instagram text-xl"></i>
                            </a>
                            <a href="https://www.linkedin.com/" className="text-gray-400 hover:text-white transition">
                                <i className="fab fa-linkedin text-xl"></i>
                            </a>
                        </div>
                    </div>

                    {/* Menu Section */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Menu</h4>
                        <ul className="space-y-4 text-sm text-gray-400 font-medium">
                            <li><Link href="/" className="hover:text-white transition">{t('landing.nav.home')}</Link></li>
                            <li><Link href="/#about" className="hover:text-white transition">{t('landing.nav.about')}</Link></li>
                            <li><Link href="/lokasi" className="hover:text-white transition">{t('landing.features.locations')}</Link></li>
                            <li><Link href="/pusat-informasi" className="hover:text-white transition">Pusat Informasi</Link></li>
                            <li><Link href="/tata-cara" className="hover:text-white transition">Tata Cara</Link></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">{t('landing.footer.contact_us')}</h4>
                        <ul className="space-y-5 text-sm">
                            <li className="flex items-start space-x-3 text-gray-400">
                                <i className="fas fa-map-marker-alt mt-1 text-white"></i>
                                <span>Jl. Raya Ciracas No.2 Blok K, RT.7/RW.3, Ciracas, Kec. Ciracas, Kota Jakarta Timur</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-400">
                                <i className="fas fa-phone-alt text-white"></i>
                                <span>+6200000000000</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-400">
                                <i className="far fa-envelope text-white"></i>
                                <span>info@osku-banksampah.id</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-400">
                                <i className="far fa-clock text-white"></i>
                                <span>Senin - Juma'at : 8:00 - 16:30</span>
                            </li>
                        </ul>
                    </div>

                    {/* Collaboration Section */}
                    <div>
                        <h4 className="text-lg font-bold mb-6">Kolaborasi</h4>
                        <div className="grid grid-cols-4 lg:grid-cols-4 gap-4 items-center">
                            <Image src="/images/KelurahanCiracasFoot.svg" alt="Kelurahan Ciracas" width={40} height={40} className="w-10 h-auto" />
                            <Image src="/images/Logo Jakarta HP.svg" alt="Jakarta" width={40} height={40} className="w-10 h-auto" />
                            <Image src="/images/LogoAptikomFoot.svg" alt="APTIKOM" width={40} height={40} className="w-10 h-auto" />
                            <Image src="/images/LogoGundarHP.svg" alt="Universitas Gunadarma" width={40} height={40} className="w-10 h-auto" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col items-center">
                    <p className="text-gray-500 text-sm">
                        {t('landing.footer.copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
