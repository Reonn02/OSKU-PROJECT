'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Toggle body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileMenuOpen]);

    // Close menu when route changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsMobileMenuOpen(false);
    }, [pathname]);


    const navLinks = [
        { name: 'Beranda', href: '/' },
        { name: 'Tentang Kami', href: '/#about' },
        { name: 'Lokasi', href: '/lokasi' },
        { name: 'Pusat Informasi', href: '/pusat-informasi' },
        { name: 'Tata Cara', href: '/tata-cara' },

    ];

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        if (path === '/lokasi') return pathname === '/lokasi';
        if (path === '/pusat-informasi') return pathname === '/pusat-informasi';
        return false; // Hash links handling is tricky without more logic, simpler for now
    };


    return (
        <nav className="bg-white shadow-md fixed w-full z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4 flex items-center relative">
                {/* Logo */}
                <Link href="/" className="z-10 pl-2 lg:pl-12">
                    <Image
                        src="/images/LogoOskuNavbar.svg"
                        alt="OSKU Logo"
                        width={120}
                        height={32}
                        className="h-8 w-auto"
                        priority
                    />
                </Link>

                {/* Desktop Links */}

                <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex space-x-6 xl:space-x-8">
                    {navLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`relative transition-colors duration-200 font-medium 
                                    ${active ? 'text-primary-dark' : 'text-primary-light hover:text-primary-dark'}
                                    after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-3 after:w-1.5 after:h-1.5 after:bg-primary-dark after:rounded-full after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-200
                                `}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop Buttons */}
                <div className="ml-auto flex items-center space-x-4 pr-2 lg:pr-12 hidden lg:flex">
                    <Link href="/login" className="text-primary-light hover:text-primary transition font-medium text-[16px]">Login</Link>
                    <Link href="/register" className="bg-primary text-white font-medium py-2 px-6 rounded-full hover:bg-primary-dark transition text-[16px]">Daftar</Link>
                </div>

                {/* Mobile Menu Button (Hamburger) */}
                <button
                    className="lg:hidden text-gray-600 ml-auto mr-4 z-[60] relative w-8 h-8 flex flex-col justify-center items-center group"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle Menu"
                >
                    <div className="w-6 h-0.5 bg-gray-600 mb-1.5 transition-all duration-300 ease-in-out transform origin-center"
                        style={{ transform: isMobileMenuOpen ? 'translateY(8px) rotate(45deg)' : '' }}
                    ></div>
                    <div className="w-6 h-0.5 bg-gray-600 mb-1.5 transition-all duration-300 ease-in-out"
                        style={{ opacity: isMobileMenuOpen ? '0' : '1' }}
                    ></div>
                    <div className="w-6 h-0.5 bg-gray-600 transition-all duration-300 ease-in-out transform origin-center"
                        style={{ transform: isMobileMenuOpen ? 'translateY(-8px) rotate(-45deg)' : '' }}
                    ></div>
                </button>
            </div>

            {/* Full Screen Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-white z-50 lg:hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                <div className="flex flex-col h-full pt-20 pb-12 px-8">
                    {/* Navigation Links */}
                    <div className="flex flex-col space-y-8 mt-4 overflow-y-auto">
                        {navLinks.map((link, index) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-2xl font-bold transition-all duration-300 ${isActive(link.href) ? 'text-primary' : 'text-gray-800 hover:text-primary'} transform ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Actions - Bottom Position */}
                    <div className={`mt-auto space-y-4 pt-8 transition-all duration-500 transform ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '300ms' }}>
                        <Link
                            href="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-center border-2 border-primary text-primary hover:bg-primary/5 transition text-lg font-bold py-3.5 rounded-full w-full"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-center bg-primary text-white py-4 px-6 rounded-full hover:bg-primary-dark transition text-lg font-bold w-full shadow-lg"
                        >
                            Daftar
                        </Link>
                        <p className="text-center text-gray-400 text-xs mt-6 font-medium tracking-widest">OSKU © 2025</p>
                    </div>
                </div>
            </div>
        </nav>
    );
}
