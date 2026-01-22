'use client';

import { useState, useRef, useEffect } from 'react';

interface YearPickerProps {
    selectedYear: number;
    onYearChange: (year: number) => void;
}

export default function YearPicker({ selectedYear, onYearChange }: YearPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayYear, setDisplayYear] = useState(selectedYear);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate years around the display year
    const generateYears = () => {
        const years = [];
        const startYear = Math.floor((displayYear - 1) / 9) * 9; // Group by 9 years

        for (let i = 0; i < 9; i++) {
            years.push(startYear + i);
        }
        return years;
    };

    const years = generateYears();
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    const handlePrevious = () => {
        setDisplayYear(displayYear - 9);
    };

    const handleNext = () => {
        setDisplayYear(displayYear + 9);
    };

    const handleYearSelect = (year: number) => {
        onYearChange(year);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2 pr-10 text-xs font-bold text-primary shadow-sm focus:outline-none hover:border-primary transition-colors cursor-pointer flex items-center gap-2"
            >
                <span>{selectedYear}</span>
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-primary transition-transform`}></i>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 z-50 w-[260px] sm:min-w-[280px]">
                    {/* Header with Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-tertiary rounded-lg transition-colors"
                        >
                            <i className="fas fa-angle-double-left text-sm"></i>
                        </button>

                        <div className="text-primary font-bold text-lg">
                            {minYear} - {maxYear}
                        </div>

                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-tertiary rounded-lg transition-colors"
                        >
                            <i className="fas fa-angle-double-right text-sm"></i>
                        </button>
                    </div>

                    {/* Year Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {years.map((year) => (
                            <button
                                key={year}
                                type="button"
                                onClick={() => handleYearSelect(year)}
                                className={`
                                    py-3 px-4 rounded-xl font-bold text-sm transition-all
                                    ${selectedYear === year
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-primary hover:bg-tertiary hover:shadow-sm'
                                    }
                                `}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
