'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBankSampah } from '@/contexts/BankSampahContext';

interface ChartItem {
    label: string;
    value: number;
}

interface ChartStep {
    label: string;
    value: number;
}

interface WasteChartProps {
    title: string;
    unit: string;
    initialData: ChartItem[];
    showWasteFilter?: boolean;
    showBankSampahFilter?: boolean;
    initialWasteType?: string;
    yAxisSteps?: ChartStep[];
    maxY?: number;
    selectedYear?: number;
    chartFilter?: 'tahun' | 'bulan';
    showExportButton?: boolean; // New prop for export button
}

// Historical data - akan diambil dari database
// Empty for fresh database start
const HISTORICAL_DATA: { tahun: number; bulan: string; bulan_num: number; saldo: number }[] = [];

const generateHistoricalData = () => {
    return HISTORICAL_DATA;
};


// Get chart data for specific year
const getYearData = (year: number): ChartItem[] => {
    const allData = generateHistoricalData();
    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    return monthLabels.map((label, idx) => {
        const monthData = allData.find(d => d.tahun === year && d.bulan_num === idx + 1);
        return {
            label,
            value: monthData ? Math.round(monthData.saldo / 1000000) : 0 // Convert back to juta for chart
        };
    });
};

export default function WasteChart({
    title,
    unit,
    initialData,
    showWasteFilter = true,
    showBankSampahFilter = false,
    initialWasteType = '',
    yAxisSteps,
    maxY = 60,
    selectedYear = 2026,
    chartFilter = 'tahun',
    showExportButton = false
}: WasteChartProps) {
    const { banks } = useBankSampah();

    // Get all unique waste types from all banks
    const allWasteTypes = useMemo(() => {
        const types = new Set<string>();
        banks.forEach(bank => {
            (bank.wasteTypes || []).forEach(wt => types.add(wt.nama));
        });
        return Array.from(types);
    }, [banks]);

    const [wasteType, setWasteType] = useState<string>(initialWasteType || (allWasteTypes[0] || ''));
    const [displayData, setDisplayData] = useState<ChartItem[]>(initialData);
    const [currentUnit, setCurrentUnit] = useState(unit);

    // Update wasteType when allWasteTypes changes and current selection is empty
    useEffect(() => {
        if (!wasteType && allWasteTypes.length > 0) {
            setWasteType(allWasteTypes[0]);
        }
    }, [allWasteTypes, wasteType]);

    // Update unit based on wasteType if filter is shown
    useEffect(() => {
        if (showWasteFilter && wasteType) {
            // Find the unit from bank's wasteTypes
            for (const bank of banks) {
                const wt = (bank.wasteTypes || []).find(w => w.nama === wasteType);
                if (wt) {
                    setCurrentUnit(wt.satuan);
                    break;
                }
            }
        }
    }, [wasteType, showWasteFilter, banks]);

    // Update data based on selected year for saldo charts
    useEffect(() => {
        if (title.includes('Saldo Bank Sampah') || showExportButton) {
            // Use generated historical data for saldo charts
            const yearData = getYearData(selectedYear);
            setDisplayData(yearData);
        } else {
            // Original behavior for other charts
            const seed = wasteType.length + selectedYear + (chartFilter === 'tahun' ? 1 : 2);
            const multiplier = 0.5 + (seed % 10) / 10;

            const newData = initialData.map(item => ({
                ...item,
                value: Math.round(item.value * (maxY / 60) * multiplier)
            }));

            setDisplayData(newData);
        }
    }, [wasteType, selectedYear, chartFilter, initialData, maxY, title, showExportButton]);

    // Export CSV function - exports current displayData with title
    const handleExportCSV = () => {
        // Create CSV title and header based on chart title
        const sanitizedTitle = title.replace(/\s+/g, '_');
        const csvTitle = `Laporan ${title} Tahun ${selectedYear}\n\n`;
        const csvHeader = `Bulan,Nilai,Satuan\n`;

        // Create CSV rows from displayData
        const csvRows = displayData.map(item =>
            `${item.label},${item.value},${currentUnit}`
        ).join('\n');

        // Calculate total
        const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);
        const totalRow = `\n\nTotal,${totalValue},${currentUnit}`;

        const csvContent = csvTitle + csvHeader + csvRows + totalRow;

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan_${sanitizedTitle.toLowerCase()}_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Use provided steps or default to simulated steps
    const steps = yAxisSteps || [
        { label: `60${currentUnit}`, value: 60 },
        { label: `50${currentUnit}`, value: 50 },
        { label: `40${currentUnit}`, value: 40 },
        { label: `30${currentUnit}`, value: 30 },
        { label: `20${currentUnit}`, value: 20 },
        { label: '0', value: 0 },
    ];

    // Calculate dynamic labels if they are simple numbers to append unit correctly
    const displaySteps = steps.map(step => {
        // If label already contains unit or is 0, keep it
        if (step.label.includes(currentUnit) || step.label === '0') return step;
        return {
            ...step,
            label: `${step.label}${currentUnit}`
        };
    });

    const maxValue = maxY;

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                <div>
                    <p className="text-secondary font-bold text-[10px] sm:text-xs mb-1">Grafik</p>
                    <h2 className="text-primary font-bold text-base sm:text-lg tracking-tight">
                        {title}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {showBankSampahFilter && (
                        <div className="relative">
                            <select
                                className="appearance-none bg-tertiary text-primary text-[9px] sm:text-[10px] font-bold py-2 px-4 sm:px-6 pr-8 sm:pr-10 rounded-full focus:outline-none cursor-pointer"
                            >
                                <option value="">Pilih Bank Sampah</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.nama}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] text-primary pointer-events-none"></i>
                        </div>
                    )}

                    {showWasteFilter && (
                        <div className="relative">
                            <select
                                value={wasteType}
                                onChange={(e) => setWasteType(e.target.value)}
                                className="appearance-none bg-tertiary text-primary text-[9px] sm:text-[10px] font-bold py-2 px-4 sm:px-6 pr-8 sm:pr-10 rounded-full focus:outline-none cursor-pointer"
                            >
                                <option value="">Jenis Sampah</option>
                                {allWasteTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[8px] text-primary pointer-events-none"></i>
                        </div>
                    )}

                    {/* Export CSV Button */}
                    {showExportButton && (
                        <button
                            onClick={handleExportCSV}
                            className="bg-primary hover:bg-primary-dark text-white text-[9px] sm:text-[10px] font-bold py-2 px-3 sm:px-4 rounded-full transition-all shadow-sm flex items-center gap-1 sm:gap-2 cursor-pointer active:scale-95"
                            title="Download data ke CSV"
                        >
                            <i className="fas fa-download"></i>
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Chart Container - scrollable on mobile */}
            <div className="relative">
                {/* Y-axis labels - fixed on left */}
                <div className="absolute left-0 top-0 bottom-8 w-10 sm:w-12 flex flex-col justify-between py-0 z-20 bg-white">
                    {displaySteps.map((step, idx) => (
                        <div key={idx} className="flex items-center">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold whitespace-nowrap">{step.label}</span>
                        </div>
                    ))}
                </div>

                {/* Scrollable chart area */}
                <div className="overflow-x-auto scrollbar-hide pl-10 sm:pl-12">
                    <div className="h-[250px] sm:h-[300px] relative flex items-end pt-4 pb-4 min-w-[500px] sm:min-w-full">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-0 mb-8 pointer-events-none">
                            {displaySteps.map((step, idx) => (
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
                                            {item.value}{currentUnit}
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

