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
    onWasteTypeChange?: (type: string) => void;
    valueFormatter?: (value: number) => string;
    bankId?: string; // Filter waste types to specific bank
}



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
    showExportButton = false,
    onWasteTypeChange,
    valueFormatter,
    bankId
}: WasteChartProps) {
    const { banks } = useBankSampah();

    // Get unique waste types - filter by bankId if provided
    const allWasteTypes = useMemo(() => {
        const types = new Set<string>();
        const banksToUse = bankId ? banks.filter(b => b.id === bankId) : banks;
        banksToUse.forEach(bank => {
            (bank.wasteTypes || []).forEach(wt => types.add(wt.nama));
        });
        return Array.from(types);
    }, [banks, bankId]);

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

    // Sync displayData with initialData
    useEffect(() => {
        setDisplayData(initialData);
    }, [initialData]);

    // Handle waste type change
    const handleWasteTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setWasteType(newValue);
        if (onWasteTypeChange) {
            onWasteTypeChange(newValue);
        }
    };

    // Export CSV function - exports current displayData with title
    const handleExportCSV = () => {
        // Create CSV title and header based on chart title
        const sanitizedTitle = title.replace(/\s+/g, '_');
        const csvTitle = `Laporan ${title} Tahun ${selectedYear}\n\n`;

        // Determine if we should show "Satuan" column
        // If currentUnit is empty OR valueFormatter is defined (implies currency), skip unit column
        const showUnitColumn = Boolean(currentUnit && !valueFormatter);

        const csvHeader = showUnitColumn ? `Bulan,Nilai,Satuan\n` : `Bulan,Nilai\n`;

        // Create CSV rows from displayData
        const csvRows = displayData.map(item => {
            const baseRow = `${item.label},${item.value}`;
            return showUnitColumn ? `${baseRow},${currentUnit}` : baseRow;
        }).join('\n');

        // Calculate total
        const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);
        const totalRow = showUnitColumn
            ? `\n\nTotal,${totalValue},${currentUnit}`
            : `\n\nTotal,${totalValue}`;

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
        // Just pass the step through, let the render logic handle unit appending
        // This avoids the double unit issue (e.g. 15kgkg) if label already has it
        return step;
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
                                onChange={handleWasteTypeChange}
                                className="appearance-none bg-tertiary text-primary text-[9px] sm:text-[10px] font-bold py-2 px-4 sm:px-6 pr-8 sm:pr-10 rounded-full focus:outline-none cursor-pointer"
                            >
                                <option value="">Semua Jenis Sampah</option>
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
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                {/* Only append unit if label doesn't already have it and it's not 0 */}
                                {/* Only append unit if label doesn't already have it and it's not 0 */}
                                {(() => {
                                    if (step.label === '0' || valueFormatter) return step.label;

                                    // Check if label already ends with currentUnit (case insensitive)
                                    const regex = new RegExp(`${currentUnit}$`, 'i');
                                    if (regex.test(step.label)) return step.label;

                                    return `${step.label}${currentUnit}`;
                                })()}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Scrollable chart area - Scrollbar visible as requested */}
                <div className="overflow-x-auto pb-4 ml-10 sm:ml-12 custom-scrollbar">
                    {/* Dynamic min-width: 60px per item is standard, prevents squeezing. Minimum 600px to fill space. */}
                    <div
                        className="h-[250px] sm:h-[300px] relative flex items-end pt-12 pb-0"
                        style={{ minWidth: `${Math.max(600, displayData.length * 60)}px` }}
                    >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-0 mb-8 pointer-events-none">
                            {displaySteps.map((step, idx) => (
                                <div key={idx} className="flex items-center w-full">
                                    <div className="flex-1 border-t border-dashed border-gray-100"></div>
                                </div>
                            ))}
                        </div>

                        {/* Bars Area */}
                        <div className="flex-1 h-full flex items-end justify-between relative z-10 px-2 sm:px-4 gap-1">
                            {displayData.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group px-0.5 min-w-[20px]">
                                    <div
                                        className="w-full max-w-[32px] bg-primary hover:bg-primary-dark transition-all duration-300 relative rounded-t-sm cursor-pointer"
                                        style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg font-bold">
                                            {valueFormatter ? valueFormatter(item.value) : `${item.value}${currentUnit}`}
                                        </div>
                                    </div>
                                    {/* X-Axis Label - Show only if it's the first week of the month to avoid clutter, or rotate */}
                                    <span className="text-[8px] text-gray-400 font-bold mt-2 rotate-0 text-center w-full px-0.5 whitespace-nowrap">
                                        {item.label.replace(selectedYear.toString(), '').trim()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll hint for all devices since chart is now wide */}

            </div>
        </div>
    );
}

