'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed ${isDashboard ? 'bottom-24' : 'bottom-8'} md:bottom-8 right-8 bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-all duration-300 cursor-pointer z-[200] ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
}
