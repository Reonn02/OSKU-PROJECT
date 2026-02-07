'use client';

import { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from '@/components/shared/Toast';

interface WeeklyData {
    tanggal: string; // Format: YYYY-MM-DD
    saldo: number;
    minggu_ke?: number;
    bulan?: number;
    minggu_dalam_bulan?: number;
}

interface PredictionResult {
    tanggal: string;
    saldo: number | null;
    prediksi: number | null;
    isPredict: boolean;
}

// Format date for display (parse YYYY-MM-DD without timezone issues)
function formatDate(dateStr: string): string {
    // Parse YYYY-MM-DD format directly to avoid timezone conversion
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // 0-indexed
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
    // Fallback for other formats
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Format currency
function formatCurrency(value: number): string {
    return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function PrediksiAdmin() {
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [nextWeekPrediction, setNextWeekPrediction] = useState<number | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [apiEndpoint, setApiEndpoint] = useState<string>('');
    const [apiError, setApiError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate trend directly from weeklyData using useMemo
    const trendPercentage = useMemo((): number | null => {
        if (weeklyData.length >= 2 && hasAnalyzed) {
            const firstValue = weeklyData[0].saldo;
            const lastValue = weeklyData[weeklyData.length - 1].saldo;

            // Return null if firstValue is 0 (can't calculate percentage change)
            if (firstValue === 0) {
                console.log('=== TREND CALCULATION (useMemo) ===');
                console.log('First value is 0, cannot calculate trend');
                return null;
            }

            const trend = ((lastValue - firstValue) / firstValue) * 100;
            console.log('=== TREND CALCULATION (useMemo) ===');
            console.log('First:', firstValue, 'Last:', lastValue, 'Trend:', Math.round(trend * 10) / 10);
            return Math.round(trend * 10) / 10;
        }
        return null;
    }, [weeklyData, hasAnalyzed]);

    // Handle drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Handle file drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Parse date from various formats
    const parseFlexibleDate = (dateStr: string): Date | null => {
        // Month mapping (English + Indonesian)
        const monthMap: Record<string, number> = {
            'jan': 0, 'januari': 0, 'january': 0,
            'feb': 1, 'februari': 1, 'february': 1,
            'mar': 2, 'maret': 2, 'march': 2,
            'apr': 3, 'april': 3,
            'may': 4, 'mei': 4,
            'jun': 5, 'juni': 5, 'june': 5,
            'jul': 6, 'juli': 6, 'july': 6,
            'aug': 7, 'agu': 7, 'agustus': 7, 'august': 7,
            'sep': 8, 'september': 8,
            'oct': 9, 'okt': 9, 'oktober': 9, 'october': 9,
            'nov': 10, 'november': 10,
            'dec': 11, 'des': 11, 'desember': 11, 'december': 11
        };

        // Clean the string
        const cleanStr = dateStr.trim();

        // Helper to get month number from string
        const getMonthNum = (str: string): number | undefined => {
            const lower = str.toLowerCase();
            return monthMap[lower] ?? monthMap[lower.slice(0, 3)];
        };

        // 1. Try format "Jan 1-7 2026" or "Jan 1-14 2026" (date range format)
        const rangeMatch = cleanStr.match(/^([A-Za-z]+)\s+(\d+)[-–]\d+\s+(\d{4})$/);
        if (rangeMatch) {
            const monthNum = getMonthNum(rangeMatch[1]);
            const day = parseInt(rangeMatch[2]);
            const year = parseInt(rangeMatch[3]);
            if (monthNum !== undefined && !isNaN(day) && !isNaN(year)) {
                return new Date(year, monthNum, day);
            }
        }

        // 2. Try format "Jan 1 2025" or "Feb 15 2025" (Month Day Year)
        const mdyMatch = cleanStr.match(/^([A-Za-z]+)\s+(\d+)\s+(\d{4})$/);
        if (mdyMatch) {
            const monthNum = getMonthNum(mdyMatch[1]);
            const day = parseInt(mdyMatch[2]);
            const year = parseInt(mdyMatch[3]);
            if (monthNum !== undefined && !isNaN(day) && !isNaN(year)) {
                console.log(`Parsed "${cleanStr}" -> ${year}-${monthNum + 1}-${day}`);
                return new Date(year, monthNum, day);
            }
        }

        // 3. Try format "21 Mei 2031" or "7 Jan 2026" (Day Month Year)
        const dmyMatch = cleanStr.match(/^(\d+)\s+([A-Za-z]+)\s+(\d{4})$/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1]);
            const monthNum = getMonthNum(dmyMatch[2]);
            const year = parseInt(dmyMatch[3]);
            if (monthNum !== undefined && !isNaN(day) && !isNaN(year)) {
                return new Date(year, monthNum, day);
            }
        }

        // 4. Try ISO format "2026-01-01" or similar standard formats
        // Only use native parser for clearly formatted dates
        const isoMatch = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1]);
            const month = parseInt(isoMatch[2]) - 1; // 0-indexed
            const day = parseInt(isoMatch[3]);
            return new Date(year, month, day);
        }

        // 5. Try "DD/MM/YYYY" or "DD-MM-YYYY" format
        const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (ddmmyyyyMatch) {
            const day = parseInt(ddmmyyyyMatch[1]);
            const month = parseInt(ddmmyyyyMatch[2]) - 1;
            const year = parseInt(ddmmyyyyMatch[3]);
            return new Date(year, month, day);
        }

        console.warn('Could not parse date:', dateStr);
        return null;
    };

    // Parse CSV for weekly data - flexible column matching
    const parseCSV = (content: string): WeeklyData[] => {
        const lines = content.trim().split('\n');

        // Find header line - look for various possible column names
        const headerLine = lines.find(l => {
            const lower = l.toLowerCase();
            const hasDateCol = lower.includes('tanggal') || lower.includes('date') || lower.includes('minggu') || lower.includes('bulan');
            const hasValueCol = lower.includes('saldo') || lower.includes('nilai') || lower.includes('value') || lower.includes('amount');
            return hasDateCol && hasValueCol;
        });

        if (!headerLine) {
            throw new Error('Format CSV tidak valid. Pastikan ada header: "Bulan, Nilai" atau "tanggal, saldo"');
        }

        const rows: WeeklyData[] = [];
        const headerIndex = lines.indexOf(headerLine);
        const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

        // Flexible column matching
        const tanggalIdx = headers.findIndex(h =>
            h === 'tanggal' || h === 'date' || h === 'minggu' || h === 'bulan' || h.includes('tanggal') || h.includes('date')
        );
        const saldoIdx = headers.findIndex(h =>
            h === 'saldo' || h === 'nilai' || h === 'value' || h === 'amount' || h.includes('saldo') || h.includes('nilai')
        );

        if (tanggalIdx === -1 || saldoIdx === -1) {
            throw new Error('Kolom tanggal/date dan saldo/nilai harus ada');
        }

        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const tanggalStr = values[tanggalIdx];
            const saldoStr = values[saldoIdx];
            const saldo = parseFloat(saldoStr.replace(/[^\d.-]/g, '')); // Remove non-numeric chars

            if (tanggalStr && !isNaN(saldo)) {
                const date = parseFlexibleDate(tanggalStr);
                if (!date) continue;

                const bulan = date.getMonth() + 1;
                const minggu_dalam_bulan = Math.ceil(date.getDate() / 7);

                // Calculate week of year
                const startOfYear = new Date(date.getFullYear(), 0, 1);
                const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                const minggu_ke = Math.ceil((days + startOfYear.getDay() + 1) / 7);

                // Store in local YYYY-MM-DD format (not ISO which converts to UTC)
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const localDate = `${year}-${month}-${day}`;

                rows.push({
                    tanggal: localDate,
                    saldo,
                    minggu_ke,
                    bulan,
                    minggu_dalam_bulan
                });
            }
        }

        // Sort by date
        rows.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

        return rows;
    };


    // Handle file upload
    const handleFileUpload = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            showStandaloneToast('warning', 'Format Tidak Valid', 'Hanya file CSV yang diizinkan.');
            // Reset file input to allow re-upload
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showStandaloneToast('warning', 'File Terlalu Besar', 'Maksimal ukuran file 5MB.');
            // Reset file input to allow re-upload
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const isReplacing = fileName !== '' && fileName === file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = parseCSV(content);

                if (parsed.length === 0) {
                    showStandaloneToast('warning', 'Data Kosong', 'Tidak ditemukan data valid dalam CSV.');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                if (parsed.length < 4) {
                    showStandaloneToast('warning', 'Data Kurang', 'Minimal 4 minggu data diperlukan untuk prediksi.');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return;
                }

                setWeeklyData(parsed);
                setFileName(file.name);
                setHasAnalyzed(false);
                setPredictions([]);
                setNextWeekPrediction(null);
                setApiError('');

                // Show appropriate toast message
                if (isReplacing) {
                    showStandaloneToast('success', 'File Berhasil Diubah', `Data diperbarui dengan ${parsed.length} minggu data.`);
                } else {
                    showStandaloneToast('success', 'File Berhasil Diupload', `${parsed.length} minggu data ditemukan.`);
                }

                // Reset file input to allow re-upload of same file
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (error: any) {
                showStandaloneToast('error', 'Parsing Gagal', error.message || 'Terjadi kesalahan saat membaca CSV.');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    // Calculate features from CSV data for the prediction API
    const calculateFeatures = () => {
        if (weeklyData.length < 4) {
            throw new Error('Minimal 4 data diperlukan untuk prediksi');
        }

        // Data should already be sorted by date from parseCSV
        const length = weeklyData.length;

        // Lag features (saldo dari minggu-minggu sebelumnya)
        const lag_1 = weeklyData[length - 1].saldo; // Saldo minggu terakhir
        const lag_2 = weeklyData[length - 2].saldo; // Saldo 2 minggu lalu
        const lag_3 = weeklyData[length - 3].saldo; // Saldo 3 minggu lalu

        // Moving average 4 minggu terakhir
        const ma_4 = (
            weeklyData[length - 1].saldo +
            weeklyData[length - 2].saldo +
            weeklyData[length - 3].saldo +
            weeklyData[length - 4].saldo
        ) / 4;

        // Hitung tanggal prediksi (1 minggu ke depan)
        const lastDate = new Date(weeklyData[length - 1].tanggal);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + 7);

        const bulan = nextDate.getMonth() + 1; // 1-12
        const minggu_dalam_bulan = Math.ceil(nextDate.getDate() / 7); // 1-5

        return {
            lag_1,
            lag_2,
            lag_3,
            ma_4,
            bulan,
            minggu_dalam_bulan,
            predictionDate: nextDate.toISOString().split('T')[0]
        };
    };

    // Call API for prediction (Random Forest model)
    const callApiPrediction = async () => {
        if (!apiEndpoint) {
            setApiError('API Endpoint harus diisi');
            return null;
        }

        try {
            // Calculate features from data
            const features = calculateFeatures();

            console.log('=== API REQUEST DEBUG ===');
            console.log('Endpoint:', apiEndpoint);
            console.log('Features:', features);

            const response = await fetch(`${apiEndpoint}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    features: {
                        lag_1: features.lag_1,
                        lag_2: features.lag_2,
                        lag_3: features.lag_3,
                        ma_4: features.ma_4,
                        bulan: features.bulan,
                        minggu_dalam_bulan: features.minggu_dalam_bulan
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('=== API RESPONSE DEBUG ===');
            console.log('Result:', result);

            // Expected response format: { success: true, prediction: number, message: string }
            if (result.success && result.prediction !== undefined) {
                return {
                    prediction: result.prediction,
                    next_date: features.predictionDate
                };
            }

            throw new Error(result.message || 'Format response API tidak valid');
        } catch (error: any) {
            setApiError(error.message || 'Gagal menghubungi API');
            showStandaloneToast('error', 'API Error', error.message || 'Gagal menghubungi API.');
            return null;
        }
    };

    // Get next week date from last data
    const getNextWeekDate = (): string => {
        if (weeklyData.length === 0) return '';
        const lastDate = new Date(weeklyData[weeklyData.length - 1].tanggal);
        lastDate.setDate(lastDate.getDate() + 7);
        return lastDate.toISOString().split('T')[0];
    };

    // Analyze data and get prediction
    const handleAnalyze = async () => {
        if (weeklyData.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Silakan upload file CSV terlebih dahulu.');
            return;
        }

        if (!apiEndpoint) {
            showStandaloneToast('warning', 'API Endpoint Kosong', 'Silakan masukkan URL API prediksi.');
            return;
        }

        // Validate data quality - check if all values are 0
        const allZero = weeklyData.every(d => d.saldo === 0);
        if (allZero) {
            showStandaloneToast('warning', 'Data Tidak Valid', 'Semua data saldo bernilai 0. Prediksi tidak dapat dilakukan dengan data kosong.');
            return;
        }

        // Check if last 4 weeks are all 0 (minimum requirement for prediction)
        const last4Weeks = weeklyData.slice(-4);
        const last4AllZero = last4Weeks.every(d => d.saldo === 0);
        if (last4AllZero) {
            showStandaloneToast('warning', 'Data Tidak Valid', 'Data 4 minggu terakhir bernilai 0. Prediksi memerlukan data saldo yang valid.');
            return;
        }

        setIsAnalyzing(true);
        setApiError('');

        const result = await callApiPrediction();

        if (result) {
            // Build prediction data for chart
            const allData: PredictionResult[] = weeklyData.map(d => ({
                tanggal: d.tanggal,
                saldo: d.saldo,
                prediksi: null,
                isPredict: false
            }));

            // Add prediction for next week
            allData.push({
                tanggal: result.next_date,
                saldo: null,
                prediksi: result.prediction,
                isPredict: true
            });

            setPredictions(allData);
            setNextWeekPrediction(result.prediction);
            setHasAnalyzed(true);

            // Note: Trend is now calculated via useMemo based on weeklyData and hasAnalyzed

            showStandaloneToast('success', 'Prediksi Selesai', 'Prediksi 1 minggu ke depan berhasil dibuat.');
        }

        setIsAnalyzing(false);
    };

    // Reset all
    const handleReset = () => {
        setWeeklyData([]);
        setPredictions([]);
        setFileName('');
        setHasAnalyzed(false);
        setNextWeekPrediction(null);
        setApiError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Calculate max chart value
    const maxChartValue = Math.max(
        ...predictions.map(p => Math.max(p.saldo || 0, p.prediksi || 0)),
        1
    );

    // Get last week data for comparison
    const lastWeekData = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
    const predictionChange = lastWeekData && nextWeekPrediction && lastWeekData.saldo !== 0
        ? ((nextWeekPrediction - lastWeekData.saldo) / lastWeekData.saldo) * 100
        : null; // null indicates cannot calculate (division by zero)

    // Helper to format percentage safely
    const formatPercentage = (value: number | null): string => {
        if (value === null || !isFinite(value) || isNaN(value)) {
            return 'N/A';
        }
        return `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}%`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10 w-full max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                    <img src="/icon/Prediksi.svg" className="w-6 h-6" alt="prediksi logo" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Prediksi Saldo Mingguan</h1>
                    <p className="text-xs text-primary-light opacity-70">Prediksi saldo 1 minggu ke depan menggunakan AI</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white border border-blue-100 rounded-2xl p-5">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 bg-tertiary rounded-[8px] p-2">
                        <i className="fas fa-brain text-primary text-xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary text-sm mb-1">Prediksi AI - Random Forest</h4>
                        <p className="text-primary text-xs">
                            Unggah data CSV saldo mingguan untuk melihat prediksi 1 minggu ke depan.
                            Format CSV: <span className="font-semibold">tanggal (YYYY-MM-DD), saldo</span>. Minimal 4 minggu data.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload & Settings Section */}
            <div className="bg-white rounded-[32px] p-4 md:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Drag & Drop Zone */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-primary-light block px-1">Upload Data CSV</label>

                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all relative cursor-pointer min-h-[200px] ${fileName
                                ? 'border-primary/40 bg-tertiary/20'
                                : 'border-gray-300 hover:border-primary/40 hover:bg-tertiary/10'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                className="hidden"
                            />

                            {fileName ? (
                                <>
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                        <i className="fas fa-file-csv text-primary text-3xl"></i>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-primary mb-1">{fileName}</p>
                                        <p className="text-xs text-gray-500">{weeklyData.length} minggu data</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                        className="text-xs text-warning hover:underline"
                                    >
                                        Hapus & Upload Ulang
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-tertiary/50 rounded-2xl flex items-center justify-center">
                                        <Image src="/icon/upload.svg" alt="Upload" width={32} height={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            Seret & lepaskan file CSV di sini atau <span className="text-primary font-bold">Pilih file</span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Max 5MB • Format .csv
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* CSV Preview */}
                        {weeklyData.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4 max-h-[200px] overflow-auto">
                                <h4 className="text-xs font-bold text-gray-600 mb-2">Preview Data (5 baris terakhir)</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Tanggal</th>
                                            <th className="pb-2">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklyData.slice(-5).map((row, idx) => (
                                            <tr key={idx} className="border-t border-gray-200">
                                                <td className="py-2">{formatDate(row.tanggal)}</td>
                                                <td className="py-2 font-medium text-primary">{formatCurrency(row.saldo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {weeklyData.length > 5 && (
                                    <p className="text-xs text-gray-400 mt-2 text-center">Menampilkan 5 dari {weeklyData.length} baris</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-primary-light block px-1 mb-3">Pengaturan API</label>

                            {/* API Endpoint */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-600 block mb-2">API Base URL (tanpa /api/predict)</label>
                                <input
                                    type="text"
                                    value={apiEndpoint}
                                    onChange={(e) => { setApiEndpoint(e.target.value); setApiError(''); }}
                                    placeholder="https://web-production-40b2a.up.railway.app"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-primary ${apiError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setApiEndpoint('https://web-production-40b2a.up.railway.app');
                                        showStandaloneToast('success', 'URL Disalin', 'URL API telah diisi otomatis.');
                                    }}
                                    className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                                >
                                    <i className="fas fa-link mr-1"></i>
                                    Gunakan: https://web-production-40b2a.up.railway.app
                                </button>
                                {apiError && (
                                    <p className="text-xs text-red-500 mt-1">
                                        <i className="fas fa-exclamation-circle mr-1"></i>
                                        {apiError}
                                    </p>
                                )}
                            </div>

                            {/* Prediction Info */}
                            <div className="bg-tertiary/30 rounded-xl p-4 mb-4">
                                <p className="text-xs text-primary">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Prediksi menggunakan model <strong>Random Forest</strong> dengan fitur: lag_1, lag_2, lag_3, ma_4, bulan, minggu_dalam_bulan.
                                </p>
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || weeklyData.length === 0 || !apiEndpoint}
                            className="w-full bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isAnalyzing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Menganalisis...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-chart-line"></i>
                                    Prediksi 1 Minggu Ke Depan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {hasAnalyzed && nextWeekPrediction !== null && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Next Week Prediction */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                                    <i className="fas fa-calendar-week text-primary"></i>
                                </div>
                                <p className="text-xs font-bold text-primary opacity-60 uppercase">Prediksi Minggu Depan</p>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                                {formatCurrency(nextWeekPrediction)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatDate(getNextWeekDate())}
                            </p>
                        </div>

                        {/* Change from Last Week */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${predictionChange === null ? 'bg-gray-100' : predictionChange >= 0 ? 'bg-tertiary' : 'bg-red-50'}`}>
                                    <i className={`fas ${predictionChange === null ? 'fa-minus text-gray-400' : predictionChange >= 0 ? 'fa-arrow-up text-primary' : 'fa-arrow-down text-warning'}`}></i>
                                </div>
                                <p className={`text-xs font-bold uppercase ${predictionChange === null ? 'text-gray-400' : predictionChange >= 0 ? 'text-primary opacity-60' : 'text-warning'}`}>Perubahan</p>
                            </div>
                            <p className={`text-2xl font-bold ${predictionChange === null ? 'text-gray-400' : predictionChange >= 0 ? 'text-primary' : 'text-warning'}`}>
                                {formatPercentage(predictionChange)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {predictionChange === null ? 'Data sebelumnya 0' : 'Dari minggu terakhir'}
                            </p>
                        </div>

                        {/* Historical Trend */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trendPercentage === null ? 'bg-gray-100' : trendPercentage >= 0 ? 'bg-tertiary' : 'bg-red-50'}`}>
                                    <i className={`fas ${trendPercentage === null ? 'fa-minus text-gray-400' : trendPercentage >= 0 ? 'fa-arrow-trend-up text-primary' : 'fa-arrow-trend-down text-warning'}`}></i>
                                </div>
                                <p className={`text-xs font-bold uppercase ${trendPercentage === null ? 'text-gray-400' : trendPercentage >= 0 ? 'text-primary opacity-60' : 'text-warning'}`}>Trend Historis</p>
                            </div>
                            <p className={`text-2xl font-bold ${trendPercentage === null ? 'text-gray-400' : trendPercentage >= 0 ? 'text-primary' : 'text-warning'}`}>
                                {formatPercentage(trendPercentage)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {trendPercentage === null ? 'Data awal 0' : `Selama ${weeklyData.length} minggu`}
                            </p>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white rounded-[32px] p-4 md:p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Grafik Saldo Mingguan</h3>
                                <p className="text-xs text-gray-500">Data historis dan prediksi 1 minggu ke depan</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    <span className="text-gray-600">Data Aktual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-gray-600">Prediksi</span>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="relative h-[360px] w-full overflow-visible">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-10 w-28 flex flex-col justify-between text-[10px] text-gray-400 pr-3 text-right z-10 bg-white">
                                <span>{formatCurrency(Math.round(maxChartValue * 1.1))}</span>
                                <span>{formatCurrency(Math.round(maxChartValue * 0.75))}</span>
                                <span>{formatCurrency(Math.round(maxChartValue * 0.5))}</span>
                                <span>{formatCurrency(Math.round(maxChartValue * 0.25))}</span>
                                <span>0</span>
                            </div>

                            {/* Chart area with horizontal scroll */}
                            <div className="ml-28 h-full overflow-x-auto">
                                <div
                                    className="h-full border-l border-b border-gray-200 relative"
                                    style={{
                                        minWidth: predictions.length > 8 ? `${predictions.length * 60}px` : '100%',
                                        width: predictions.length <= 8 ? '100%' : 'auto'
                                    }}
                                >
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ paddingBottom: '40px' }}>
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div key={i} className="border-t border-gray-100 w-full"></div>
                                        ))}
                                    </div>

                                    {/* Bar chart data */}
                                    <div className="absolute inset-0 flex items-end justify-around gap-1" style={{ paddingBottom: '40px', paddingLeft: '60px', paddingRight: '8px' }}>
                                        {predictions.map((p, idx) => {
                                            const value = p.isPredict ? p.prediksi : p.saldo;
                                            const chartAreaHeight = 250;
                                            const maxVal = maxChartValue * 1.1;
                                            const barHeight = maxVal > 0 ? ((value || 0) / maxVal) * chartAreaHeight : 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="relative group flex-1"
                                                    style={{ minWidth: predictions.length > 8 ? '30px' : 'auto', maxWidth: '40px' }}
                                                >
                                                    {/* Bar */}
                                                    <div
                                                        className={`w-full rounded-t-lg cursor-pointer transition-all duration-300 hover:opacity-80 ${p.isPredict ? 'bg-green-500' : 'bg-primary'
                                                            }`}
                                                        style={{
                                                            height: `${barHeight}px`,
                                                            minHeight: value ? '4px' : '0'
                                                        }}
                                                    ></div>

                                                    {/* Tooltip - positioned to the right for first few bars to avoid clipping */}
                                                    <div
                                                        className={`absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] ${idx < 2 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}
                                                        style={{ bottom: `${barHeight + 10}px` }}
                                                    >
                                                        <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                                            <p className="font-bold">{formatDate(p.tanggal)}</p>
                                                            <p>{p.isPredict ? 'Prediksi' : 'Aktual'}: {formatCurrency(value || 0)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* X-axis labels */}
                                    <div className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-around gap-1" style={{ paddingLeft: '60px', paddingRight: '8px' }}>
                                        {predictions.map((p, idx) => {
                                            // For prediction point, show "Prediksi" instead of date
                                            if (p.isPredict) {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="text-center text-[9px] flex-1 text-green-600 font-bold"
                                                        style={{ minWidth: predictions.length > 8 ? '30px' : 'auto', maxWidth: '40px' }}
                                                    >
                                                        <span className="whitespace-nowrap">Prediksi</span>
                                                    </div>
                                                );
                                            }

                                            const currentDate = parseFlexibleDate(p.tanggal) || new Date(p.tanggal);
                                            const day = currentDate.getDate();
                                            const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
                                            const year = currentDate.getFullYear();
                                            const monthIndex = currentDate.getMonth();

                                            // Get the actual number of days in the month
                                            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

                                            let startDay: number, endDay: number;
                                            if (day <= 7) {
                                                startDay = 1; endDay = 7;
                                            } else if (day <= 14) {
                                                startDay = 8; endDay = 14;
                                            } else if (day <= 21) {
                                                startDay = 15; endDay = 21;
                                            } else {
                                                // Last week of the month - use actual last day
                                                startDay = 22; endDay = daysInMonth;
                                            }

                                            const label = `${month} ${startDay}-${endDay}`;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="text-center text-[9px] flex-1 text-gray-400"
                                                    style={{ minWidth: predictions.length > 8 ? '30px' : 'auto', maxWidth: '40px' }}
                                                >
                                                    <span className="whitespace-nowrap">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-[32px] p-4 md:p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Detail Data</h3>
                                <p className="text-xs text-gray-500">Data aktual dan hasil prediksi</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary text-white text-xs uppercase">
                                        <th className="px-4 py-3 text-left rounded-tl-xl">Tanggal</th>
                                        <th className="px-4 py-3 text-right">Saldo Aktual</th>
                                        <th className="px-4 py-3 text-right">Prediksi</th>
                                        <th className="px-4 py-3 text-center rounded-tr-xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.slice(-10).map((p, idx) => (
                                        <tr key={idx} className={`border-b border-gray-100 ${p.isPredict ? 'bg-green-50' : 'bg-white'}`}>
                                            <td className="px-4 py-3 font-medium">{formatDate(p.tanggal)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {p.saldo ? formatCurrency(p.saldo) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-green-600">
                                                {p.prediksi ? formatCurrency(p.prediksi) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${p.isPredict
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-tertiary text-primary'
                                                    }`}>
                                                    <i className={`fas ${p.isPredict ? 'fa-robot' : 'fa-check-circle'} text-[10px]`}></i>
                                                    {p.isPredict ? 'Prediksi' : 'Aktual'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
