'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { showStandaloneToast } from './Toast';

interface CSVRow {
    tahun: number;
    bulan: string;
    bulan_num: number;
    saldo_rup: number;
    saldo_juta: number;
}

interface PredictionData {
    bulan: string;
    tahun: number;
    bulan_num: number;
    saldo_aktual: number | null;
    prediksi: number | null;
    isPredict: boolean;
}

// Simple Linear Regression for simulation
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
    const n = data.length;
    if (n === 0) return { slope: 0, intercept: 0 };

    const sumX = data.reduce((acc, d) => acc + d.x, 0);
    const sumY = data.reduce((acc, d) => acc + d.y, 0);
    const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
    const sumXX = data.reduce((acc, d) => acc + d.x * d.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function PrediksiAdmin() {
    const [csvData, setCsvData] = useState<CSVRow[]>([]);
    const [predictions, setPredictions] = useState<PredictionData[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [trendPercentage, setTrendPercentage] = useState<number>(0);
    const [predictionMonths, setPredictionMonths] = useState<number>(6);
    const [useApiMode, setUseApiMode] = useState<boolean>(false);
    const [apiEndpoint, setApiEndpoint] = useState<string>('http://localhost:5000/predict');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Parse CSV content
    const parseCSV = (content: string): CSVRow[] => {
        const lines = content.trim().split('\n');
        const rows: CSVRow[] = [];

        // Find header row (skip title rows)
        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (line.includes('tahun') && (line.includes('bulan') || line.includes('saldo'))) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            throw new Error('Format CSV tidak valid. Pastikan ada header: Tahun, Bulan, Bulan_Num, Saldo_Rup/Saldo_Juta');
        }

        // Parse headers
        const headers = lines[headerIndex].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const tahunIdx = headers.findIndex(h => h === 'tahun');
        const bulanIdx = headers.findIndex(h => h === 'bulan');
        const bulanNumIdx = headers.findIndex(h => h.includes('bulan_num') || h === 'bulan_num');
        const saldoRupIdx = headers.findIndex(h => h.includes('saldo_rup') || h === 'saldo_rup');
        const saldoJutaIdx = headers.findIndex(h => h.includes('saldo_juta') || h === 'saldo_juta');

        if (tahunIdx === -1 || bulanIdx === -1) {
            throw new Error('Kolom Tahun dan Bulan harus ada dalam CSV');
        }

        // Parse data rows
        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.toLowerCase().includes('total')) continue;

            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));

            const tahun = parseInt(values[tahunIdx]);
            const bulan = values[bulanIdx];
            const bulanNum = bulanNumIdx !== -1 ? parseInt(values[bulanNumIdx]) : BULAN_NAMES.indexOf(bulan) + 1;
            const saldoRup = saldoRupIdx !== -1 ? parseInt(values[saldoRupIdx].replace(/\D/g, '')) : 0;
            const saldoJuta = saldoJutaIdx !== -1 ? parseFloat(values[saldoJutaIdx]) : saldoRup / 1000000;

            if (!isNaN(tahun) && bulan && !isNaN(bulanNum)) {
                rows.push({
                    tahun,
                    bulan,
                    bulan_num: bulanNum,
                    saldo_rup: saldoRup || saldoJuta * 1000000,
                    saldo_juta: saldoJuta || saldoRup / 1000000
                });
            }
        }

        return rows;
    };

    // Handle file upload
    const handleFileUpload = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            showStandaloneToast('warning', 'Format Tidak Valid', 'Hanya file CSV yang diizinkan.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showStandaloneToast('warning', 'File Terlalu Besar', 'Maksimal ukuran file 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = parseCSV(content);

                if (parsed.length === 0) {
                    showStandaloneToast('warning', 'Data Kosong', 'Tidak ditemukan data valid dalam CSV.');
                    return;
                }

                setCsvData(parsed);
                setFileName(file.name);
                setHasAnalyzed(false);
                setPredictions([]);
                showStandaloneToast('success', 'File Berhasil Diupload', `${parsed.length} baris data ditemukan.`);
            } catch (error: any) {
                showStandaloneToast('error', 'Parsing Gagal', error.message || 'Terjadi kesalahan saat membaca CSV.');
            }
        };
        reader.readAsText(file);
    };

    // Generate predictions using Linear Regression (simulation)
    const generateSimulatedPredictions = () => {
        if (csvData.length === 0) return;

        // Sort data by year and month
        const sortedData = [...csvData].sort((a, b) => {
            if (a.tahun !== b.tahun) return a.tahun - b.tahun;
            return a.bulan_num - b.bulan_num;
        });

        // Prepare data for regression (x = sequential month number, y = saldo)
        const regressionData = sortedData.map((row, idx) => ({
            x: idx + 1,
            y: row.saldo_juta
        }));

        const { slope, intercept } = linearRegression(regressionData);

        // Get last data point
        const lastRow = sortedData[sortedData.length - 1];
        let nextYear = lastRow.tahun;
        let nextBulanNum = lastRow.bulan_num + 1;

        // Build prediction data
        const allData: PredictionData[] = [];

        // Add historical data
        sortedData.forEach(row => {
            allData.push({
                bulan: row.bulan,
                tahun: row.tahun,
                bulan_num: row.bulan_num,
                saldo_aktual: row.saldo_juta,
                prediksi: null,
                isPredict: false
            });
        });

        // Generate future predictions
        const startX = sortedData.length + 1;
        for (let i = 0; i < predictionMonths; i++) {
            if (nextBulanNum > 12) {
                nextBulanNum = 1;
                nextYear++;
            }

            const predictedValue = slope * (startX + i) + intercept;
            // Add some random variation for realism
            const variation = (Math.random() - 0.5) * 5;
            const finalPrediction = Math.max(0, predictedValue + variation);

            allData.push({
                bulan: BULAN_NAMES[nextBulanNum - 1],
                tahun: nextYear,
                bulan_num: nextBulanNum,
                saldo_aktual: null,
                prediksi: Math.round(finalPrediction * 100) / 100,
                isPredict: true
            });

            nextBulanNum++;
        }

        // Calculate trend percentage
        const firstValue = sortedData[0].saldo_juta;
        const lastValue = sortedData[sortedData.length - 1].saldo_juta;
        const trend = ((lastValue - firstValue) / firstValue) * 100;
        setTrendPercentage(Math.round(trend * 10) / 10);

        return allData;
    };

    // Call API for predictions (for future use)
    const callApiPrediction = async () => {
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: csvData,
                    months: predictionMonths
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const result = await response.json();
            return result.predictions;
        } catch (error) {
            showStandaloneToast('error', 'API Error', 'Gagal menghubungi API. Menggunakan simulasi.');
            return generateSimulatedPredictions();
        }
    };

    // Analyze data
    const handleAnalyze = async () => {
        if (csvData.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Silakan upload file CSV terlebih dahulu.');
            return;
        }

        setIsAnalyzing(true);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        let result: PredictionData[] | undefined;

        if (useApiMode) {
            result = await callApiPrediction();
        } else {
            result = generateSimulatedPredictions();
        }

        if (result) {
            setPredictions(result);
            setHasAnalyzed(true);
            showStandaloneToast('success', 'Analisis Selesai', `Prediksi ${predictionMonths} bulan ke depan berhasil dibuat.`);
        }

        setIsAnalyzing(false);
    };

    // Reset all
    const handleReset = () => {
        setCsvData([]);
        setPredictions([]);
        setFileName('');
        setHasAnalyzed(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Calculate max chart value
    const maxChartValue = Math.max(
        ...predictions.map(p => Math.max(p.saldo_aktual || 0, p.prediksi || 0)),
        1 // Prevent division by zero
    );

    // Calculate summary stats
    const nextMonthPrediction = predictions.find(p => p.isPredict);
    const threeMonthPrediction = predictions.filter(p => p.isPredict).slice(0, 3).pop();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                    <img src="/icon/Prediksi.svg" className="w-6 h-6" alt="prediksi logo" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Prediksi Pemasukan</h1>
                    <p className="text-xs text-primary-light opacity-70">Analisis trend dan prediksi pemasukan bank sampah</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white border border-blue-100 rounded-2xl p-5">
                <div className="flex gap-4">
                    <div className="flex-shrink-0  bg-tertiary rounded-[8px] p-2">
                        <i className="fas fa-brain text-primary text-xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-primary text-sm mb-1">Analisis Prediksi AI</h4>
                        <p className="text-primary text-xs">
                            Unggah data CSV pemasukan bank sampah untuk melihat prediksi trend kenaikan.
                            Format CSV harus memiliki kolom: <span className="font-semibold">Tahun, Bulan, Bulan_Num, Saldo_Rup (atau Saldo_Juta)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload & Settings Section */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                        <p className="text-xs text-gray-500">{csvData.length} baris data</p>
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
                        {csvData.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4 max-h-[200px] overflow-auto">
                                <h4 className="text-xs font-bold text-gray-600 mb-2">Preview Data (5 baris pertama)</h4>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Tahun</th>
                                            <th className="pb-2">Bulan</th>
                                            <th className="pb-2">Saldo (Juta)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="border-t border-gray-200">
                                                <td className="py-2">{row.tahun}</td>
                                                <td className="py-2">{row.bulan}</td>
                                                <td className="py-2 font-medium text-primary">Rp {row.saldo_juta.toLocaleString('id-ID')} jt</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {csvData.length > 5 && (
                                    <p className="text-xs text-gray-400 mt-2 text-center">... dan {csvData.length - 5} baris lainnya</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-primary-light block px-1 mb-3">Pengaturan Prediksi</label>

                            {/* Prediction Months */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-600 block mb-2">Jumlah Bulan Prediksi</label>
                                <div className="flex gap-2">
                                    {[3, 6, 12].map(months => (
                                        <button
                                            key={months}
                                            onClick={() => setPredictionMonths(months)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${predictionMonths === months
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {months} Bulan
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* API Mode Toggle */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-600 block mb-2">Mode Prediksi</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setUseApiMode(false)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${!useApiMode
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <i className="fas fa-calculator mr-2"></i>
                                        Simulasi
                                    </button>
                                    <button
                                        onClick={() => setUseApiMode(true)}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${useApiMode
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <i className="fas fa-cloud mr-2"></i>
                                        API (Backend)
                                    </button>
                                </div>
                            </div>

                            {/* API Endpoint (if API mode) */}
                            {useApiMode && (
                                <div className="mb-4">
                                    <label className="text-xs text-gray-600 block mb-2">API Endpoint</label>
                                    <input
                                        type="text"
                                        value={apiEndpoint}
                                        onChange={(e) => setApiEndpoint(e.target.value)}
                                        placeholder="http://localhost:5000/predict"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || csvData.length === 0}
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
                                    Analisis & Prediksi
                                </>
                            )}
                        </button>

                        {/* Info about mode */}
                        <div className="bg-tertiary/30 rounded-xl p-4">
                            <p className="text-xs text-primary">
                                <i className="fas fa-info-circle mr-2"></i>
                                {useApiMode
                                    ? 'Mode API akan memanggil backend untuk prediksi menggunakan model ML (ARIMA/Prophet).'
                                    : 'Mode Simulasi menggunakan Linear Regression sederhana untuk demo. Cocok untuk presentasi.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {hasAnalyzed && predictions.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Next Month Prediction */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                                    <i className="fas fa-calendar-day text-primary"></i>
                                </div>
                                <p className="text-xs font-bold text-primary opacity-60 uppercase">Prediksi Bulan Depan</p>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                                Rp {nextMonthPrediction?.prediksi?.toLocaleString('id-ID') || '-'} jt
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {nextMonthPrediction?.bulan} {nextMonthPrediction?.tahun}
                            </p>
                        </div>

                        {/* 3 Month Prediction */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-tertiary flex items-center justify-center">
                                    <i className="fas fa-chart-bar text-primary"></i>
                                </div>
                                <p className="text-xs font-bold text-primary opacity-60 uppercase">Prediksi 3 Bulan</p>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                                Rp {threeMonthPrediction?.prediksi?.toLocaleString('id-ID') || '-'} jt
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {threeMonthPrediction?.bulan} {threeMonthPrediction?.tahun}
                            </p>
                        </div>

                        {/* Trend */}
                        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trendPercentage >= 0 ? 'bg-tertiary' : 'bg-red-50'
                                    }`}>
                                    <i className={`fas ${trendPercentage >= 0 ? 'fa-arrow-trend-up text-primary' : 'fa-arrow-trend-down text-warning'}`}></i>
                                </div>
                                <p className="text-xs font-bold text-primary opacity-60 uppercase">Trend Historis</p>
                            </div>
                            <p className={`text-2xl font-bold ${trendPercentage >= 0 ? 'text-primary' : 'text-warning'}`}>
                                {trendPercentage >= 0 ? '+' : ''}{trendPercentage}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Dibanding awal periode
                            </p>
                        </div>
                    </div>

                    {/* Chart Section - Dot/Line Chart Style */}
                    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Grafik Prediksi Pemasukan</h3>
                                <p className="text-xs text-gray-500">Data historis dan prediksi {predictionMonths} bulan ke depan</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    <span className="text-gray-600">Data Aktual</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary/50 rounded-full"></div>
                                    <span className="text-gray-600">Prediksi</span>
                                </div>
                            </div>
                        </div>

                        {/* Dot/Line Chart */}
                        <div className="relative h-[300px] w-full">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-8 w-14 flex flex-col justify-between text-xs text-gray-400 pr-2 text-right">
                                <span>{Math.round(maxChartValue * 1.1)} jt</span>
                                <span>{Math.round(maxChartValue * 0.75)} jt</span>
                                <span>{Math.round(maxChartValue * 0.5)} jt</span>
                                <span>{Math.round(maxChartValue * 0.25)} jt</span>
                                <span>0</span>
                            </div>

                            {/* Chart area */}
                            <div className="ml-14 h-full border-l border-b border-gray-200 relative">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ paddingBottom: '32px' }}>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div key={i} className="border-t border-gray-100 w-full"></div>
                                    ))}
                                </div>

                                {/* Dots only - no connecting lines for cleaner look */}

                                {/* Data points (dots) */}
                                <div className="absolute inset-0 flex items-end justify-between" style={{ paddingBottom: '32px', paddingLeft: '4px', paddingRight: '4px' }}>
                                    {predictions.map((p, idx) => {
                                        const value = p.isPredict ? p.prediksi : p.saldo_aktual;
                                        const chartAreaHeight = 268; // 300px - 32px padding
                                        const maxVal = maxChartValue * 1.1;
                                        const dotBottom = maxVal > 0 ? ((value || 0) / maxVal) * chartAreaHeight : 0;

                                        return (
                                            <div
                                                key={idx}
                                                className="relative group"
                                                style={{ flex: 1 }}
                                            >
                                                {/* Dot */}
                                                <div
                                                    className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-150 ${p.isPredict ? 'bg-primary/50' : 'bg-primary'
                                                        }`}
                                                    style={{
                                                        bottom: `${dotBottom}px`,
                                                        transform: 'translateX(-50%) translateY(50%)'
                                                    }}
                                                ></div>

                                                {/* Tooltip */}
                                                <div
                                                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 left-1/2 -translate-x-1/2"
                                                    style={{ bottom: `${dotBottom + 20}px` }}
                                                >
                                                    <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                                                        <p className="font-bold">{p.bulan} {p.tahun}</p>
                                                        <p>{p.isPredict ? 'Prediksi' : 'Aktual'}: Rp {value?.toLocaleString('id-ID')} jt</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* X-axis labels */}
                                <div className="absolute bottom-0 left-0 right-0 h-8 flex justify-between items-end px-1">
                                    {predictions.map((p, idx) => {
                                        // Show label for every nth item depending on total count
                                        const showLabel = predictions.length <= 12
                                            || idx === 0
                                            || idx === predictions.length - 1
                                            || idx % Math.ceil(predictions.length / 6) === 0;

                                        return (
                                            <div
                                                key={idx}
                                                className={`text-center text-[10px] ${p.isPredict ? 'text-primary/60 font-medium' : 'text-gray-400'}`}
                                                style={{ flex: 1 }}
                                            >
                                                {showLabel && (
                                                    <span>{p.bulan.substring(0, 3)} {p.tahun.toString().slice(-2)}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prediction Table */}
                    <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-primary">Detail Prediksi</h3>
                                <p className="text-xs text-gray-500">Perbandingan data aktual dan prediksi</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary text-white text-xs uppercase">
                                        <th className="px-4 py-3 text-left rounded-tl-xl">Bulan</th>
                                        <th className="px-4 py-3 text-left">Tahun</th>
                                        <th className="px-4 py-3 text-right">Saldo Aktual</th>
                                        <th className="px-4 py-3 text-right">Prediksi</th>
                                        <th className="px-4 py-3 text-center rounded-tr-xl">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((p, idx) => (
                                        <tr key={idx} className={`border-b border-gray-100 ${p.isPredict ? 'bg-tertiary/20' : 'bg-white'}`}>
                                            <td className="px-4 py-3 font-medium">{p.bulan}</td>
                                            <td className="px-4 py-3">{p.tahun}</td>
                                            <td className="px-4 py-3 text-right">
                                                {p.saldo_aktual ? `Rp ${p.saldo_aktual.toLocaleString('id-ID')} jt` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-primary">
                                                {p.prediksi ? `Rp ${p.prediksi.toLocaleString('id-ID')} jt` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${p.isPredict
                                                    ? 'bg-blue-50 text-blue-600'
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
            )}
        </div>
    );
}
