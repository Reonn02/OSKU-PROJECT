'use client';

import { useState, useEffect } from 'react';

interface ChartItem {
    label: string;
    value: number;
}

interface WasteType {
    id: string;
    name: string;
    unit: string;
    data: ChartItem[];
    maxY: number;
}

interface NasabahWasteChartProps {
    wasteTypes: WasteType[];
    selectedYear: number;
    onYearChange: (year: number) => void;
}

export default function NasabahWasteChart({
    wasteTypes,
    selectedYear,
    onYearChange
}: NasabahWasteChartProps) {
    const [selectedWasteType, setSelectedWasteType] = useState<string>('');

    // Auto-select first waste type when data changes
    useEffect(() => {
        if (wasteTypes.length > 0) {
            // If currently selected is not in the new list, or nothing selected, pick first
            const exists = wasteTypes.find(w => w.id === selectedWasteType);
            if (!exists) {
                setSelectedWasteType(wasteTypes[0].id);
            }
        } else {
            setSelectedWasteType('');
        }
    }, [wasteTypes, selectedWasteType]);

    // Get current waste type data
    const currentWasteType = wasteTypes.find(w => w.id === selectedWasteType) || wasteTypes[0];
    const displayData = currentWasteType?.data || [];
    const unit = currentWasteType?.unit || 'kg';
    const maxValue = currentWasteType?.maxY || 10;

    // Generate Y-axis steps dynamically based on maxY
    const generateSteps = (max: number) => {
        const stepCount = 5;
        const stepValue = Math.ceil(max / stepCount);
        const steps = [];
        for (let i = stepCount; i >= 0; i--) {
            const value = stepValue * i;
            steps.push({ label: `${value}`, value });
        }
        return steps;
    };

    const steps = generateSteps(maxValue);

    // Generate year options (current year and 4 years back)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                <div>
                    <h2 className="text-[#3B8A51] font-bold text-base sm:text-xl tracking-tight">
                        Total Penyetoran Sampah
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Waste Type Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedWasteType}
                            onChange={(e) => setSelectedWasteType(e.target.value)}
                            className="appearance-none bg-tertiary text-primary text-xs font-bold py-2.5 px-4 sm:px-6 pr-8 sm:pr-10 rounded-xl focus:outline-none cursor-pointer hover:bg-[#D4E9DB] transition-colors"
                        >
                            <option value="">Jenis Sampah</option>
                            {wasteTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] text-primary pointer-events-none"></i>
                    </div>
                </div>
            </div>

            {/* Chart Container - scrollable on mobile */}
            <div className="relative">
                {/* Y-axis labels - fixed on left */}
                <div className="absolute left-0 top-0 bottom-8 w-12 sm:w-16 flex flex-col justify-between py-0 z-20 bg-white">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold whitespace-nowrap">{step.label}</span>
                        </div>
                    ))}
                </div>

                {/* Scrollable chart area */}
                <div className="overflow-x-auto scrollbar-hide pl-12 sm:pl-16">
                    <div className="h-[280px] sm:h-[300px] relative flex items-end pt-12 pb-4 min-w-[500px] sm:min-w-full">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-0 mb-8 pointer-events-none">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-center w-full">
                                    <div className="flex-1 border-t border-dashed border-gray-100"></div>
                                </div>
                            ))}
                        </div>

                        {/* Bars Area */}
                        <div className="flex-1 h-full flex items-end justify-between relative z-10 px-2 sm:px-4">
                            {displayData.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group px-1 min-w-[32px] sm:min-w-0">
                                    <div
                                        className="w-3 sm:w-2.5 bg-primary hover:bg-primary-dark transition-all duration-300 relative rounded-full cursor-pointer"
                                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg font-bold">
                                            {item.value}
                                        </div>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-4 sm:mt-6 tracking-tight">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll hint for mobile */}
                <div className="sm:hidden text-center mt-2">
                    <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                        <i className="fas fa-arrows-alt-h"></i>
                        Geser untuk melihat lebih banyak
                    </p>
                </div>
            </div>
        </div>
    );
}
