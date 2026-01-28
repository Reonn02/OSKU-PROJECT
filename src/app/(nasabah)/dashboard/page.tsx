'use client';

import Link from 'next/link';
import Image from 'next/image';
import BackToTop from '@/components/shared/BackToTop';
import WasteChart from '@/components/shared/WasteChart';
import NasabahWasteChart from '@/components/nasabah/NasabahWasteChart';
import KonfirmasiLogout from '@/components/shared/konfirmasiLogout';
import NavbarNasabah from '@/components/nasabah/NavbarNasabah';
import YearPicker from '@/components/shared/YearPicker';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { useWastePrice } from '@/contexts/WastePriceContext';
import { useBerita } from '@/contexts/BeritaContext';
import { usePenyetoran } from '@/contexts/PenyetoranContext';
import { usePencairan } from '@/contexts/PencairanContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePetugas } from '@/contexts/PetugasContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/lib/supabase';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { showStandaloneToast } from '@/components/shared/Toast'; // Import custom toast
import { useLanguage } from '@/contexts/LanguageContext';


// Helper function to format number with thousand separator (dots)
const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDate = (dateString: string): string => {
    if (!dateString) return '-';

    // If already in DD/MM/YYYY format, return as is
    if (dateString.includes('/') && !dateString.includes('T')) return dateString;

    // Handle ISO string or YYYY-MM-DD
    const cleanDate = dateString.split('T')[0]; // Take only the date part
    const parts = cleanDate.split('-');

    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateString;
};

function Dashboard() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { banks } = useBankSampah(); // Get banks from context
    const { wastePrices, getUnitByJenis, calculateSaldo } = useWastePrice(); // Get waste prices from context
    const { berita } = useBerita(); // Get news from context
    const { fetchPenyetoranByNasabah, getSaldoByNasabah } = usePenyetoran();
    const { fetchPencairanByNasabah, addPencairan } = usePencairan();
    const { nasabah, isLoading: authLoading, isAuthenticated, signOut } = useAuth(); // Get authenticated nasabah
    const { petugasList } = usePetugas(); // Get officer list
    const initialTab = searchParams.get('tab') || 'dashboard';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    // Calculator states
    const [calcJenisSampah, setCalcJenisSampah] = useState<string>('');
    const [calcBerat, setCalcBerat] = useState<string>('');
    const [calcSaldo, setCalcSaldo] = useState<number>(0);
    // Withdrawal status: 'empty' | 'processing' | 'completed' | 'failed' | 'ready'
    const [withdrawalStatus, setWithdrawalStatus] = useState<string>('empty');
    const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
    const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
    const [withdrawalDate, setWithdrawalDate] = useState<string>('');
    const [withdrawalBank, setWithdrawalBank] = useState<string>('');
    const [withdrawalRejectReason, setWithdrawalRejectReason] = useState<string>('');
    const [submittedData, setSubmittedData] = useState<{ amount: number, date: string, bank: string, id: string } | null>(null);
    const [scrollPercentage, setScrollPercentage] = useState(0);
    const [currentPageSetoran, setCurrentPageSetoran] = useState(1);
    const [currentPagePenarikan, setCurrentPagePenarikan] = useState(1);
    const [currentPageBerita, setCurrentPageBerita] = useState(1); // Pagination for news
    const beritaPerPage = 3; // Show 3 news per page
    const [selectedBankSampah, setSelectedBankSampah] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('-'); // Display name from registration or "-"
    const [username, setUsername] = useState<string>('-');
    const [userEmail, setUserEmail] = useState<string>(''); // Email from userProfile
    const [userPhone, setUserPhone] = useState<string>(''); // Phone from userProfile
    const [userId, setUserId] = useState<string>('-');
    const [userNIK, setUserNIK] = useState<string>('-');
    const [userAddress, setUserAddress] = useState<string>('-');
    const [userRT, setUserRT] = useState<string>('-');
    const [userRW, setUserRW] = useState<string>('-');
    const itemsPerPage = 10;
    const [depositHistoryData, setDepositHistoryData] = useState<any[]>([]);

    // Filter states
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [chartFilter, setChartFilter] = useState<'tahun' | 'bulan'>('tahun');
    const [showProfileSuccess, setShowProfileSuccess] = useState(false);

    // Dynamic data from database (initialized to 0 - will be fetched from Supabase)
    const [saldoAmount, setSaldoAmount] = useState<number>(0);
    const [totalPenyetoran, setTotalPenyetoran] = useState<number>(0);
    const [totalPencairan, setTotalPencairan] = useState<number>(0);
    const [wasteSummary, setWasteSummary] = useState<{ label: string, value: string, unit: string }[]>([]);
    const [adminContact, setAdminContact] = useState<string>('+6281234567890');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            const scrollableWidth = scrollWidth - clientWidth;
            if (scrollableWidth > 0) {
                const percentage = (scrollLeft / scrollableWidth) * 100;
                setScrollPercentage(percentage);
            }
        }
    };

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const clickRatio = clickX / width;
            const { scrollWidth, clientWidth } = scrollContainerRef.current;
            const targetScroll = clickRatio * (scrollWidth - clientWidth);
            scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
        }
    };

    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Logout handler
    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Logout failed:', error);
        }
        router.push('/login');
    };

    // Fetch Admin Contact
    useEffect(() => {
        const fetchAdminContact = async () => {
            const { data } = await supabase.from('admins').select('no_hp').eq('role', 'superadmin').limit(1).single();
            if (data?.no_hp) setAdminContact(data.no_hp);
        };
        fetchAdminContact();
    }, []);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            console.log('❌ Not authenticated, redirecting to login...');
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Effect to load nasabah data from AuthContext
    useEffect(() => {
        if (nasabah) {
            // Load data from authenticated nasabah (Supabase)
            setDisplayName(nasabah.name || '-');
            setUsername(nasabah.username || '-');
            setUserEmail(nasabah.email || '');
            setUserPhone(nasabah.phone || '');
            setUserNIK(nasabah.nik || '-');
            setUserAddress(nasabah.address || '-');
            setUserRT(nasabah.rt || '-');
            setUserRW(nasabah.rw || '-');
            setUserId(nasabah.id || '-');
            setSaldoAmount(nasabah.saldo || 0);

            if (nasabah.bankSampah) {
                setSelectedBankSampah(nasabah.bankSampah);
            }

            console.log('✅ Loaded nasabah from AuthContext:', nasabah.name);
        }
    }, [nasabah]);

    useEffect(() => {
        setIsMounted(true);
        setCurrentTime(new Date());

        // Update active tab if URL changes
        const tab = searchParams.get('tab');
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }

        // Only load from localStorage if we don't have a nasabah bank defined
        const savedBank = localStorage.getItem('selectedBankSampah');
        if (savedBank && !nasabah?.bankSampah) {
            setSelectedBankSampah(savedBank);
        }

        // Fallback: Read display name from sessionStorage (for users not yet migrated to Supabase Auth)
        if (!nasabah) {
            try {
                const userProfileStr = sessionStorage.getItem('userProfile');
                if (userProfileStr) {
                    const userProfile = JSON.parse(userProfileStr);
                    setDisplayName(userProfile.fullName || '-');
                    setUsername(userProfile.username || '-');
                    setUserEmail(userProfile.email || '');
                    setUserPhone(userProfile.phoneNumber || '');
                    setUserNIK(userProfile.nik || '-');
                    setUserAddress(userProfile.address || '-');
                    setUserRT(userProfile.rt || '-');
                    setUserRW(userProfile.rw || '-');

                    // Read selected bank sampah
                    if (userProfile.bankSampahName) {
                        setSelectedBankSampah(userProfile.bankSampahName);
                    }

                }
            } catch (error) {
                console.error('Error reading user profile:', error);
                setDisplayName('-');
            }
        }


        // Fetch withdrawal status from database
        const fetchWithdrawalStatus = async () => {
            const currentUserId = nasabah?.id;
            if (!currentUserId) return;

            try {
                const pencairanList = await fetchPencairanByNasabah(currentUserId);

                if (pencairanList.length > 0) {
                    // Get the most recent pengajuan
                    const mostRecent = pencairanList[0]; // Already sorted by date desc

                    setWithdrawalId(mostRecent.id || null);

                    const dbStatus = mostRecent.status;
                    if (dbStatus === 'pending') {
                        setWithdrawalStatus('processing'); // Pengajuan Diproses
                    } else if (dbStatus === 'approved') {
                        setWithdrawalStatus('approved'); // Pengajuan Disetujui (struk bisa dicetak)
                    } else {
                        // For final states (rejected, completed, cancelled), we reset to empty
                        // so it doesn't look like an active transaction status for a new request
                        // UNLESS it was just interacting with it. 
                        // But for "Bukti Pengajuan", we might want to show it if it was recent?
                        // For now, keep original logic but populate data if active
                        setWithdrawalStatus('empty');
                        setWithdrawalId(null); // Clear ID as well
                    }

                    // FIX: Populate submittedData if we have an active withdrawal so receipts persist after refresh
                    if (dbStatus === 'pending' || dbStatus === 'approved' || dbStatus === 'completed') {
                        // Find bank name
                        let bankName = '-';
                        if (banks.length > 0 && mostRecent.bank_sampah_id) {
                            const foundBank = banks.find(b => b.id === mostRecent.bank_sampah_id);
                            if (foundBank) bankName = foundBank.nama;
                        }

                        // Parse amount if string or number
                        // amount is string or number in db? DbPencairan says jumlah: number
                        const amount = typeof mostRecent.jumlah === 'string' ? parseFloat(mostRecent.jumlah) : mostRecent.jumlah;

                        setSubmittedData({
                            amount: amount,
                            date: mostRecent.tanggal_pengajuan || new Date().toISOString(),
                            bank: bankName,
                            id: mostRecent.id
                        });

                        // Also populate local state for editing if needed (though typically we don't edit submitted ones)
                        setWithdrawalDate(mostRecent.tanggal_pengajuan?.split('T')[0] || '');
                        // withdrawalAmount string format
                        // setWithdrawalAmount(...) 
                    }
                }
            } catch (error) {
                console.error('Error fetching withdrawal status:', error);
            }
        };

        fetchWithdrawalStatus();

        // Poll for status changes every 5 seconds
        const statusInterval = setInterval(fetchWithdrawalStatus, 5000);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => {
            clearInterval(timer);
            clearInterval(statusInterval);
        };
    }, [nasabah, fetchPencairanByNasabah]);

    // Handle profile save
    // Handle profile save
    const handleSaveProfile = async () => {
        try {
            // Update Supabase
            if (userId && userId !== '-') {
                const { error } = await supabase
                    .from('nasabah')
                    .update({
                        name: displayName,
                        username: username,
                        phone: userPhone,
                        address: userAddress,
                        rt: userRT,
                        rw: userRW,
                        // email is usually read-only or handled via auth
                    })
                    .eq('id', userId);

                if (error) throw error;
            }

            // Get current userProfile from sessionStorage and update it to keep sync
            const userProfileStr = sessionStorage.getItem('userProfile');
            if (userProfileStr) {
                const userProfile = JSON.parse(userProfileStr);
                // Update with current values
                userProfile.fullName = displayName;
                userProfile.username = username;
                userProfile.phoneNumber = userPhone;
                userProfile.address = userAddress;
                userProfile.rt = userRT;
                userProfile.rw = userRW;
                // Save back
                sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
            }

            // Show success notification
            showStandaloneToast('success', 'Berhasil', 'Profil berhasil disimpan ke database');
        } catch (error) {
            console.error('Error saving profile:', error);
            showStandaloneToast('error', 'Gagal', 'Gagal menyimpan profil');
        }
    };

    // Helper to check if open
    const checkOperationalStatus = (openTime: string, closeTime: string) => {
        if (!currentTime) return false;
        const utc = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
        const wibTime = new Date(utc + (3600000 * 7));

        const currentHour = wibTime.getHours();
        const currentMinute = wibTime.getMinutes();
        const currentDay = wibTime.getDay();

        if (currentDay === 0) return false;

        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);

        const currentTimeValue = currentHour * 60 + currentMinute;
        const openTimeValue = openH * 60 + openM;
        const closeTimeValue = closeH * 60 + closeM;

        return currentTimeValue >= openTimeValue && currentTimeValue < closeTimeValue;
    };

    // Removed hardcoded locationData - now using banks from BankSampahContext

    // Filter waste prices by nasabah's selected bank
    const filteredWastePrices = useMemo(() => {
        // Debug: log available banks and selected bank
        console.log('Available banks:', banks.map(b => ({ id: b.id, nama: b.nama, wasteTypesCount: b.wasteTypes?.length || 0 })));
        console.log('Selected bank sampah:', selectedBankSampah);

        // Find the selected bank with case-insensitive matching
        const userBank = banks.find(b => {
            const bankName = b.nama.toLowerCase().trim();
            const selected = selectedBankSampah.toLowerCase().trim();

            return bankName === selected ||
                bankName.includes(selected.replace('bank sampah ', '')) ||
                selected.includes(bankName.replace('bank sampah ', ''));
        });

        console.log('Found userBank:', userBank ? { id: userBank.id, nama: userBank.nama, wasteTypes: userBank.wasteTypes } : null);

        if (!userBank || !userBank.wasteTypes) {
            return [];
        }

        // Convert to WastePrice format
        return userBank.wasteTypes.map((wt, idx) => ({
            id: idx + 1,
            jenis: wt.nama,
            per: wt.satuan === 'kg' ? 'Kilogram' : wt.satuan === 'ltr' ? 'Liter' : 'Satuan',
            harga: wt.hargaPerSatuan
        }));
    }, [banks, selectedBankSampah]);

    // Helper functions for filtered waste prices
    const getFilteredUnitByJenis = (jenis: string): string => {
        const found = filteredWastePrices.find(w => w.jenis === jenis);
        return found?.per || 'Kilogram';
    };

    const calculateFilteredSaldo = (jenis: string, amount: number): number => {
        const found = filteredWastePrices.find(w => w.jenis === jenis);
        if (!found) return 0;
        return found.harga * amount;
    };

    const [chartWasteData, setChartWasteData] = useState<any[]>([]);

    // 1. Filter History by Selected Year
    const filteredDepositHistory = useMemo(() => {
        return depositHistoryData.filter(item => {
            if (item.type === '-') return false;

            // Parse date
            let itemYear;
            if (item.rawDate) {
                const date = new Date(item.rawDate);
                itemYear = date.getFullYear();
            } else {
                // Fallback for string dates dd/mm/yyyy
                const parts = item.date.split('/');
                if (parts.length === 3) {
                    itemYear = parseInt(parts[2]);
                }
            }
            return itemYear === selectedYear;
        });
    }, [depositHistoryData, selectedYear]);

    // 2. Process Stats (Summary & Chart) from Filtered Data
    useEffect(() => {
        // --- Summary Calculation ---
        const summaryMap = new Map<string, { weight: number, unit: string }>();

        // Initialize with all available waste prices (types) from the selected bank
        // This ensures types with 0 deposits are still shown
        if (filteredWastePrices.length > 0) {
            filteredWastePrices.forEach(price => {
                // Determine unit from 'per' field (Kilogram -> kg, Liter -> ltr)
                let unit = 'kg'; // default
                if (price.per === 'Liter') unit = 'ltr';
                else if (price.per !== 'Kilogram') unit = 'pcs';

                summaryMap.set(price.jenis, { weight: 0, unit: unit });
            });
        }

        // Add actual data from history
        filteredDepositHistory.forEach(item => {
            // Only count if this type exists in our bank's waste types (or add it if we want to show historical types that might no longer range)
            // For now, let's assume we match by name. 
            // If the map doesn't have it (maybe from a different bank?), we can choose to add it or skip.
            // Let's add it to be safe so we don't lose data.

            const current = summaryMap.get(item.type) || { weight: 0, unit: item.unit || 'kg' };
            summaryMap.set(item.type, {
                weight: current.weight + (typeof item.weight === 'number' ? item.weight : parseFloat(item.weight)),
                unit: current.unit
            });
        });

        const summaryArray = Array.from(summaryMap.entries()).map(([label, data]) => ({
            label: label,
            value: data.weight % 1 === 0 ? data.weight.toString() : data.weight.toFixed(2),
            unit: data.unit
        }));
        setWasteSummary(summaryArray);

        // --- Chart Calculation ---
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agust', 'Sep', 'Okt', 'Nov', 'Des'];
        const chartMap = new Map<string, { name: string, unit: string, monthlyData: number[] }>();

        // Also initialize chart map with empty data for all types, if desired. 
        // For the chart, it might be better to only show active ones OR show all. 
        // Let's show all to match the summary logic.
        if (filteredWastePrices.length > 0) {
            filteredWastePrices.forEach(price => {
                let unit = 'kg';
                if (price.per === 'Liter') unit = 'ltr';
                else if (price.per !== 'Kilogram') unit = 'pcs';

                chartMap.set(price.jenis, {
                    name: price.jenis,
                    unit: unit,
                    monthlyData: new Array(12).fill(0)
                });
            });
        }

        filteredDepositHistory.forEach(item => {
            // Parse month
            let itemMonth;
            if (item.rawDate) {
                const date = new Date(item.rawDate);
                itemMonth = date.getMonth();
            } else {
                const parts = item.date.split('/');
                if (parts.length === 3) {
                    itemMonth = parseInt(parts[1]) - 1;
                }
            }

            if (itemMonth !== undefined) {
                if (!chartMap.has(item.type)) {
                    chartMap.set(item.type, {
                        name: item.type,
                        unit: 'kg', // fallback
                        monthlyData: new Array(12).fill(0)
                    });
                }
                const entry = chartMap.get(item.type)!;
                entry.monthlyData[itemMonth] += (typeof item.weight === 'number' ? item.weight : parseFloat(item.weight));
            }
        });

        const chartDataArray = Array.from(chartMap.entries()).map(([id, data]) => {
            const chartItems = months.map((month, idx) => ({
                label: month,
                value: data.monthlyData[idx]
            }));

            const maxVal = Math.max(...data.monthlyData);
            const maxY = Math.max(50, Math.ceil(maxVal * 1.2));

            // Use name as ID for simplicity in this context
            return {
                id: id,
                name: data.name,
                unit: data.unit,
                data: chartItems,
                maxY: maxY
            };
        });

        setChartWasteData(chartDataArray);

    }, [filteredDepositHistory, filteredWastePrices]);

    // Load penyetoran and pencairan history from database (with localStorage fallback)
    useEffect(() => {
        const loadData = async () => {
            if (!userId || userId === '-') return;

            try {
                // Try to load penyetoran history from database
                const penyetoranData = await fetchPenyetoranByNasabah(userId);
                if (penyetoranData && penyetoranData.length > 0) {
                    const mappedPenyetoran = penyetoranData.map((item: any) => ({
                        idPenyetoran: item.id_penyetoran || '-',
                        name: item.nasabah_name || '-',
                        type: item.waste_type_name || '-',
                        date: new Date(item.tanggal).toLocaleDateString('id-ID'),
                        rawDate: item.tanggal, // Keep ISO string for easy parsing
                        weight: item.berat,
                        unit: item.waste_type?.satuan || 'kg', // Get unit from relation
                        price: item.total_harga / (item.berat || 1),
                        bankSampah: item.bank_sampah_name || '-',
                    }));
                    setDepositHistoryData(mappedPenyetoran);
                    setTotalPenyetoran(mappedPenyetoran.length);
                } else {
                    // Fallback to localStorage if no database data
                    const storedData = localStorage.getItem('penyetoran_data');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        // Filter by user name if possible
                        const userPenyetoran = parsedData.filter((item: any) =>
                            item.name?.toLowerCase() === displayName?.toLowerCase()
                        );
                        // Add rawDate for consistency if needed, or rely on date string parsing
                        setDepositHistoryData(userPenyetoran.length > 0 ? userPenyetoran : []);
                        setTotalPenyetoran(userPenyetoran.length);
                    }
                }

                // Try to load pencairan history from database
                const pencairanData = await fetchPencairanByNasabah(userId);
                if (pencairanData && pencairanData.length > 0) {
                    const mappedPencairan = pencairanData.map((item: any, idx: number) => ({
                        no: idx + 1,
                        idPengajuan: item.id_pengajuan || '-',
                        jumlah: item.jumlah,
                        tglPengajuan: new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID'),
                        status: item.status === 'pending' ? 'Diproses' :
                            item.status === 'approved' ? 'Disetujui' :
                                item.status === 'rejected' ? 'Ditolak' :
                                    item.status === 'completed' ? 'Selesai' :
                                        item.status === 'cancelled' ? 'Dibatalkan' : item.status,
                        reason: item.alasan || '',
                        tglSelesai: item.tanggal_selesai ? new Date(item.tanggal_selesai).toLocaleDateString('id-ID') : '-',
                    }));
                    setWithdrawalHistory(mappedPencairan);
                    setTotalPencairan(mappedPencairan.filter(p => p.status === 'Selesai').length);
                } else {
                    // Fallback to localStorage if no database data
                    const storedRequests = localStorage.getItem('pencairan_requests');
                    if (storedRequests) {
                        const parsedRequests = JSON.parse(storedRequests);
                        const userRequests = parsedRequests.filter((item: any) => item.id_nasabah === userId);
                        const mappedRequests = userRequests.map((item: any, idx: number) => ({
                            no: idx + 1,
                            idPengajuan: item.id || '-',
                            jumlah: item.amount,
                            tglPengajuan: item.date || '-',
                            status: item.status,
                            reason: item.reason || '',
                            tglSelesai: item.completed_at || '-',
                        }));
                        setWithdrawalHistory(mappedRequests);
                        setTotalPencairan(mappedRequests.filter((p: any) => p.status === 'Selesai').length);
                    }
                }

                // Try to get saldo from database, fallback to localStorage calculation
                try {
                    const saldo = await getSaldoByNasabah(userId);
                    if (saldo > 0) {
                        setSaldoAmount(saldo);
                    } else {
                        // Fallback: calculate from localStorage penyetoran data
                        const storedData = localStorage.getItem('penyetoran_data');
                        if (storedData) {
                            const parsedData = JSON.parse(storedData);
                            const userPenyetoran = parsedData.filter((item: any) =>
                                item.name?.toLowerCase() === displayName?.toLowerCase()
                            );
                            const calculatedSaldo = userPenyetoran.reduce((sum: number, item: any) =>
                                sum + ((item.weight || 0) * (item.price || 0)), 0
                            );
                            setSaldoAmount(calculatedSaldo);
                        }
                    }
                } catch {
                    // Silent fail for saldo, use localStorage fallback
                    const storedData = localStorage.getItem('penyetoran_data');
                    if (storedData) {
                        const parsedData = JSON.parse(storedData);
                        const userPenyetoran = parsedData.filter((item: any) =>
                            item.name?.toLowerCase() === displayName?.toLowerCase()
                        );
                        const calculatedSaldo = userPenyetoran.reduce((sum: number, item: any) =>
                            sum + ((item.weight || 0) * (item.price || 0)), 0
                        );
                        setSaldoAmount(calculatedSaldo);
                    }
                }
            } catch (error) {
                // Full fallback to localStorage
                const storedData = localStorage.getItem('penyetoran_data');
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    const userPenyetoran = parsedData.filter((item: any) =>
                        item.name?.toLowerCase() === displayName?.toLowerCase()
                    );
                    setDepositHistoryData(userPenyetoran);
                    setTotalPenyetoran(userPenyetoran.length);
                }
            }
        };

        loadData();
    }, [userId, displayName, fetchPenyetoranByNasabah, fetchPencairanByNasabah, getSaldoByNasabah]);

    // Map depositHistoryData to table format
    const depositHistory = filteredDepositHistory.map((item, idx) => ({
        no: idx + 1,
        idSetoran: item.idPenyetoran || '-',
        idNasabah: userId || '-',
        nama: item.name || '-',
        jenis: item.type || '-',
        berat: `${item.weight || 0} ${item.unit || 'kg'}`,
        saldo: `Rp ${((item.weight || 0) * (item.price || 0)).toLocaleString('id-ID')}`,
        tanggal: item.date || '-',
        lokasi: item.bankSampah ? item.bankSampah.replace('Bank Sampah ', '').replace('Kelurahan ', '') : '-'
    }));

    // Histori pencairan untuk nasabah yang sedang login (akan diambil dari Supabase)
    const [withdrawalHistory, setWithdrawalHistory] = useState<{ no: number, idPengajuan: string, jumlah: number, tglPengajuan: string, status: string, reason: string, tglSelesai: string }[]>([]);

    // Export Histori Penyetoran to CSV
    const exportDepositToCSV = () => {
        if (depositHistory.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Tidak ada data penyetoran untuk diekspor.');
            return;
        }

        const headers = ['No', 'ID Penyetoran', 'ID Nasabah', 'Nama Nasabah', 'Jenis Sampah', 'Berat/Jumlah', 'Saldo Didapat', 'Tanggal', 'Lokasi'];
        const csvRows = [
            `Histori Penyetoran - ${displayName}`,
            `Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`,
            '',
            headers.join(','),
            ...depositHistory.map(item => [
                item.no,
                item.idSetoran,
                item.idNasabah,
                `"${item.nama}"`,
                `"${item.jenis}"`,
                `"${item.berat}"`,
                `"${item.saldo}"`,
                item.tanggal,
                `"${item.lokasi}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `histori_penyetoran_${userId}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Export Histori Pencairan to CSV
    const exportWithdrawalToCSV = () => {
        if (withdrawalHistory.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Tidak ada data pencairan untuk diekspor.');
            return;
        }

        const headers = ['No', 'ID Pengajuan', 'ID Nasabah', 'Jumlah', 'Tgl Pengajuan', 'Status', 'Alasan', 'Tgl Selesai'];
        const csvRows = [
            `Histori Pencairan Saldo - ${displayName}`,
            `Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`,
            '',
            headers.join(','),
            ...withdrawalHistory.map((item, idx) => [
                idx + 1,
                item.idPengajuan,
                userId || '-',
                `Rp ${item.jumlah.toLocaleString('id-ID')}`,
                item.tglPengajuan,
                item.status,
                item.reason ? `"${item.reason}"` : '-',
                item.tglSelesai
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `histori_pencairan_${userId}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Export Histori Penyetoran to PDF
    const exportDepositToPDF = () => {
        if (depositHistory.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Tidak ada data penyetoran untuk diekspor.');
            return;
        }

        const doc = new jsPDF('landscape');

        // Title
        doc.setFontSize(16);
        doc.setTextColor(59, 138, 81); // Primary green color
        doc.text(`Histori Penyetoran - ${displayName}`, 14, 20);

        // Subtitle with date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
        doc.text(`ID Nasabah: ${userId}`, 14, 34);

        // Table data
        const tableHeaders = [['No', 'ID Penyetoran', 'ID Nasabah', 'Nama', 'Jenis Sampah', 'Berat/Jumlah', 'Saldo Didapat', 'Tanggal', 'Lokasi']];
        const tableData = depositHistory.map(item => [
            item.no.toString(),
            item.idSetoran,
            item.idNasabah,
            item.nama,
            item.jenis,
            item.berat,
            item.saldo,
            item.tanggal,
            item.lokasi
        ]);

        autoTable(doc, {
            head: tableHeaders,
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 138, 81],
                textColor: 255,
                fontSize: 8,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 250, 245]
            }
        });

        doc.save(`histori_penyetoran_${userId}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export Histori Pencairan to PDF
    const exportWithdrawalToPDF = () => {
        if (withdrawalHistory.length === 0) {
            showStandaloneToast('warning', 'Data Kosong', 'Tidak ada data pencairan untuk diekspor.');
            return;
        }

        const doc = new jsPDF();

        // Title
        doc.setFontSize(16);
        doc.setTextColor(59, 138, 81); // Primary green color
        doc.text(`Histori Pencairan Saldo - ${displayName}`, 14, 20);

        // Subtitle with date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Diekspor pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
        doc.text(`ID Nasabah: ${userId}`, 14, 34);

        // Table data
        const tableHeaders = [['No', 'ID Pengajuan', 'Jumlah', 'Tgl Pengajuan', 'Status', 'Alasan', 'Tgl Selesai']];
        const tableData = withdrawalHistory.map((item, idx) => [
            (idx + 1).toString(),
            item.idPengajuan,
            `Rp ${item.jumlah.toLocaleString('id-ID')}`,
            item.tglPengajuan,
            item.status,
            item.reason || '-',
            item.tglSelesai
        ]);

        autoTable(doc, {
            head: tableHeaders,
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 138, 81],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [245, 250, 245]
            }
        });

        doc.save(`histori_pencairan_${userId}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <NavbarNasabah
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userName={displayName}
                setShowLogoutModal={setShowLogoutModal}
            />

            <main className="container mx-auto px-4 pt-4 pb-24 md:pb-8 max-w-5xl">



                {/* Content Area */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Section */}
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            {/* Saldo Card */}
                            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <h3 className="text-primary text-xl sm:text-2xl font-bold mb-2">{t('nasabah.dashboard.balance_card')}</h3>
                                <div className="text-2xl xs:text-3xl sm:text-4xl font-bold text-primary mb-4 break-all px-2">
                                    <span className="text-lg sm:text-xl align-top mr-1">Rp</span>
                                    {saldoAmount.toLocaleString('id-ID')}
                                </div>
                                <p className="text-[10px] sm:text-xs text-primary-light mb-6 max-w-[200px] sm:max-w-xs mx-auto">
                                    Cairkan saldo anda tiap 12 bulan sekali, dan pastikan anda sudah mengajukan permohonan pencairan
                                </p>
                                <button onClick={() => setActiveTab('pencairan')} className="bg-primary hover:bg-primary-dark text-white py-3 px-8 rounded-full w-full max-w-xs cursor-pointer transition shadow-md text-sm sm:text-base">
                                    {t('common.withdrawal')}
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="flex flex-col space-y-4">
                                {/* Total Penyetoran */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden group">
                                    <h3 className="text-primary font-bold mb-1 sm:mb-2 text-sm sm:text-base">{t('nasabah.dashboard.deposit_card')}</h3>
                                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">{totalPenyetoran}</div>
                                </div>
                                {/* Total Penarikan */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden group">
                                    <h3 className="text-primary font-bold mb-1 sm:mb-2 text-sm sm:text-base">{t('nasabah.dashboard.withdraw_card')}</h3>
                                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">{totalPencairan}</div>
                                </div>
                            </div>
                        </div>
                        {/* Help Banner */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 mb-4 flex flex-col md:flex-row justify-between items-center shadow-sm">
                            <div className="mb-3 sm:mb-4 md:mb-0 text-center md:text-left">
                                <h3 className="text-primary font-bold text-lg sm:text-2xl mb-1">Bingung mulai dari mana?</h3>
                                <p className="text-[10px] sm:text-xs text-primary-light">Pahami alurnya dan mulai setorkan sampah anda</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 sm:space-x-3 sm:gap-0">
                                <button onClick={() => setActiveTab('penyetoran')} className="bg-primary hover:bg-primary-dark text-white text-[9px] sm:text-xs font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-full transition shadow-sm cursor-pointer whitespace-nowrap">
                                    Alur penyetoran
                                </button>
                                <button onClick={() => setActiveTab('pencairan')} className="bg-primary hover:bg-primary-dark text-white text-[9px] sm:text-xs font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-full transition shadow-sm cursor-pointer whitespace-nowrap">
                                    Alur pencairan
                                </button>
                            </div>
                        </div>

                        {/* News Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                    <Image src="/icon/Newspaper.svg" alt="Berita" width={20} height={18} className="brightness-0 invert" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-primary">{t('common.news')}</h2>
                                    <p className="text-[10px] sm:text-xs text-primary-light">Jangan sampai melewati informasi penting dari kami</p>
                                </div>
                            </div>

                            {berita.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-primary-light">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Image src="/icon/Newspaper.svg" alt="Berita" width={32} height={28} className="opacity-30" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-gray-400 mb-2">{t('common.no_data')}</h3>
                                    <p className="text-gray-400 text-xs sm:text-sm text-center max-w-md px-4">
                                        Berita akan muncul di sini ketika admin menambahkan berita baru
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {berita
                                            .slice((currentPageBerita - 1) * beritaPerPage, currentPageBerita * beritaPerPage)
                                            .map((news) => (
                                                <div key={news.id} className="bg-tertiary/30 rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 transition-colors">
                                                    <div className="bg-primary/10 px-4 sm:px-6 py-3 flex items-center gap-3">
                                                        <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <i className="fas fa-bullhorn text-xs"></i>
                                                        </div>
                                                        <h3 className="font-bold text-primary text-sm line-clamp-1">{news.judul}</h3>
                                                    </div>
                                                    <div className="p-4 sm:p-6">
                                                        <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed mb-4 line-clamp-2">
                                                            {news.ringkasan}
                                                        </p>
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                            <span className="text-[10px] text-primary/70 font-medium">
                                                                <i className="fas fa-calendar-alt mr-1"></i>
                                                                {news.tanggal} | {news.author}
                                                            </span>
                                                            <Link
                                                                href={`/dashboard/berita/${news.id}`}
                                                                className="bg-primary hover:bg-primary-dark text-white text-[10px] sm:text-xs font-medium py-2 px-6 rounded-xl transition shadow-sm w-full sm:w-auto text-center"
                                                            >
                                                                {t('common.read_more')}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Pagination */}
                                    {berita.length > beritaPerPage && (
                                        <div className="flex justify-center items-center gap-2">
                                            {currentPageBerita > 1 && (
                                                <button
                                                    onClick={() => setCurrentPageBerita(prev => prev - 1)}
                                                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-sm cursor-pointer"
                                                >
                                                    <i className="fas fa-chevron-left text-[10px]"></i>
                                                </button>
                                            )}

                                            {Array.from({ length: Math.ceil(berita.length / beritaPerPage) }, (_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPageBerita(i + 1)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer ${currentPageBerita === i + 1
                                                        ? 'bg-primary text-white'
                                                        : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            {currentPageBerita < Math.ceil(berita.length / beritaPerPage) && (
                                                <button
                                                    onClick={() => setCurrentPageBerita(prev => prev + 1)}
                                                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition shadow-sm cursor-pointer"
                                                >
                                                    <i className="fas fa-chevron-right text-[10px]"></i>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Waste Summary Card */}
                        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <p className="text-[#3B8A51] opacity-60 text-xs sm:text-sm font-medium mb-1">{t('common.summary')}</p>
                                <h3 className="text-[#3B8A51] font-bold text-lg sm:text-3xl">{t('petugas.dashboard.total_deposit_waste')}</h3>
                            </div>
                            <YearPicker
                                selectedYear={selectedYear}
                                onYearChange={setSelectedYear}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            {wasteSummary.length > 0 ? wasteSummary.map((item) => (
                                <div key={item.label} className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col items-start min-h-[140px] justify-between">
                                    <p className="text-sm font-medium text-[#3B8A51] opacity-70">{item.label}</p>
                                    <div className="flex items-baseline mt-2">
                                        <span className="text-4xl sm:text-5xl font-bold text-[#3B8A51]">{item.value}</span>
                                        <span className="text-sm sm:text-base font-bold text-[#3B8A51] ml-1">{item.unit}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full bg-white rounded-[24px] border border-gray-50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[140px]">
                                    <p className="text-sm text-gray-400">Belum ada data penyetoran sampah</p>
                                </div>
                            )}
                        </div>

                        {/* Charts Section */}
                        <div className="space-y-6 mb-10">
                            <NasabahWasteChart
                                wasteTypes={chartWasteData}
                                selectedYear={selectedYear}
                                onYearChange={setSelectedYear}
                            />
                        </div>

                        {/* Histori Penyetoran */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-8">
                            <div className="sm:ml-6 mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-bold text-primary mb-1">{t('nasabah.dashboard.history_deposit')}</h2>
                                <p className="text-[10px] sm:text-xs text-primary-light font-medium">Semua penyetoran sampah yang anda disetorkan akan tercatat disini dan di emai anda</p>
                            </div>

                            <div className="flex justify-end mb-4 space-x-2">

                                <button onClick={exportDepositToPDF} className="bg-[#3B8A51] text-white text-[10px] sm:text-xs px-4 sm:px-6 py-2 rounded-[32px] hover:bg-primary-dark transition font-medium cursor-pointer flex items-center gap-2">
                                    <i className="fas fa-file-pdf"></i>
                                    {t('common.export_pdf')}
                                </button>
                            </div>

                            {depositHistory.length === 0 ? (
                                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-primary-light">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <i className="fas fa-recycle text-3xl sm:text-4xl text-gray-300"></i>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-400 mb-2">{t('common.no_data')}</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm text-center max-w-md px-4">
                                            Riwayat penyetoran sampah Anda akan muncul di sini setelah Anda melakukan penyetoran
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto custom-scrollbar rounded-[16px] -mx-2 px-2 sm:mx-0 sm:px-0">
                                        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-[#3B8A51] text-white text-[10px] sm:text-[11px] uppercase tracking-wider font-bold">
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">No</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">ID Penyetoran</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">ID Nasabah</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">Nama Nasabah</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">{t('common.waste_type')}</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">{t('common.weight')}/jumlah</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">Saldo didapat</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4">{t('common.date')}</th>
                                                    <th className="px-3 sm:px-4 py-3 sm:py-4 last:rounded-tr-lg">Lokasi Penyetoran</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-tertiary">
                                                {depositHistory.slice((currentPageSetoran - 1) * itemsPerPage, currentPageSetoran * itemsPerPage).map((item) => (
                                                    <tr key={item.no} className="hover:bg-green-50/30 border-b border-green-100/50 bg-white">
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">{item.no}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 font-medium">{item.idSetoran}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4">{item.idNasabah}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 capitalize">{item.nama}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4">{item.jenis}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4">{item.berat}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 font-medium text-primary">{item.saldo}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4">{item.tanggal}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4">{item.lokasi}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Scroll hint for mobile */}
                                    <div className="sm:hidden text-center mt-2">
                                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                            <i className="fas fa-arrows-alt-h"></i>
                                            Geser untuk melihat lebih banyak kolom
                                        </p>
                                    </div>
                                    {/* Pagination - only show if more than 1 page */}
                                    {depositHistory.length > itemsPerPage && (
                                        <div className="flex justify-center items-center mt-10 space-x-2">
                                            {currentPageSetoran > 1 && (
                                                <button
                                                    onClick={() => setCurrentPageSetoran(prev => prev - 1)}
                                                    className="w-8 h-8 rounded-full bg-[#3B8A51] text-white flex items-center justify-center hover:bg-primary-dark transition shadow-sm"
                                                >
                                                    <i className="fas fa-chevron-left text-[10px]"></i>
                                                </button>
                                            )}

                                            {Array.from({ length: Math.ceil(depositHistory.length / itemsPerPage) }, (_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPageSetoran(i + 1)}
                                                    className={`w-8 h-8 rounded-md text-xs font-bold shadow-sm transition ${currentPageSetoran === i + 1
                                                        ? 'bg-[#3B8A51] text-white'
                                                        : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            {currentPageSetoran < Math.ceil(depositHistory.length / itemsPerPage) && (
                                                <button
                                                    onClick={() => setCurrentPageSetoran(prev => prev + 1)}
                                                    className="w-8 h-8 rounded-full bg-[#3B8A51] text-white flex items-center justify-center hover:bg-primary-dark transition shadow-sm"
                                                >
                                                    <i className="fas fa-chevron-right text-[10px]"></i>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Histori Pencairan saldo */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-8">
                            <div className="sm:ml-6 mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-bold text-primary mb-1">{t('nasabah.dashboard.history_withdrawal')}</h2>
                                <p className="text-[10px] sm:text-xs text-primary-light font-medium">Semua pencairan saldo yang anda lakukan akan tercatat disini</p>
                            </div>

                            <div className="flex justify-end mb-4 space-x-2">

                                <button onClick={exportWithdrawalToPDF} className="bg-[#3B8A51] text-white text-[10px] sm:text-xs px-4 sm:px-6 py-2 rounded-[32px] hover:bg-primary-dark transition font-medium cursor-pointer flex items-center gap-2">
                                    <i className="fas fa-file-pdf"></i>
                                    {t('common.export_pdf')}
                                </button>
                            </div>

                            {withdrawalHistory.length === 0 ? (
                                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-primary-light">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <i className="fas fa-inbox text-3xl sm:text-4xl text-gray-300"></i>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-400 mb-2">{t('common.no_data')}</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm text-center max-w-md px-4">
                                            Riwayat pencairan saldo Anda akan muncul di sini setelah Anda melakukan pencairan
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white rounded-[16px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                                        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                                            <table className="w-full text-xs sm:text-sm text-left min-w-[600px]">
                                                <thead className="bg-primary text-white font-bold text-[10px] sm:text-xs">
                                                    <tr>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">ID Pengajuan</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">ID Nasabah</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">Jumlah</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">Tgl Pengajuan</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4 text-center">Status</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">Alasan</th>
                                                        <th className="px-3 sm:px-5 py-3 sm:py-4">Tgl Selesai</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {withdrawalHistory.slice((currentPagePenarikan - 1) * itemsPerPage, currentPagePenarikan * itemsPerPage).map((item) => (
                                                        <tr key={item.no} className="hover:bg-tertiary/30 transition-colors">
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 font-bold text-gray-700">{item.idPengajuan}</td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600">{userId || '-'}</td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 font-bold text-primary whitespace-nowrap">Rp {item.jumlah.toLocaleString('id-ID')}</td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 whitespace-nowrap">{item.tglPengajuan}</td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                                                                <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${item.status === 'Selesai'
                                                                    ? 'bg-tertiary text-primary'
                                                                    : item.status === 'Dibatalkan' || item.status === 'Ditolak'
                                                                        ? 'bg-warning-light text-warning'
                                                                        : 'bg-yellow-100 text-yellow-600'
                                                                    }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 max-w-[100px] sm:max-w-[150px] truncate" title={item.reason || '-'}>
                                                                {item.reason || '-'}
                                                            </td>
                                                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-500 whitespace-nowrap">{item.tglSelesai}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    {/* Scroll hint for mobile */}
                                    <div className="sm:hidden text-center mt-2">
                                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                            <i className="fas fa-arrows-alt-h"></i>
                                            Geser untuk melihat lebih banyak kolom
                                        </p>
                                    </div>

                                    {/* Pagination */}
                                    {withdrawalHistory.length > itemsPerPage && (
                                        <div className="flex justify-center items-center mt-6 space-x-2">
                                            {currentPagePenarikan > 1 && (
                                                <button
                                                    onClick={() => setCurrentPagePenarikan(prev => prev - 1)}
                                                    className="w-10 h-10 rounded-full bg-[#3B8A51] text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                                >
                                                    <i className="fas fa-chevron-left text-[12px]"></i>
                                                </button>
                                            )}

                                            {Array.from({ length: Math.ceil(withdrawalHistory.length / itemsPerPage) }, (_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPagePenarikan(i + 1)}
                                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer ${currentPagePenarikan === i + 1
                                                        ? 'bg-[#3B8A51] text-white'
                                                        : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            {currentPagePenarikan < Math.ceil(withdrawalHistory.length / itemsPerPage) && (
                                                <button
                                                    onClick={() => setCurrentPagePenarikan(prev => prev + 1)}
                                                    className="w-10 h-10 rounded-full bg-[#3B8A51] text-white flex items-center justify-center hover:bg-primary-dark transition shadow-md active:scale-90 cursor-pointer"
                                                >
                                                    <i className="fas fa-chevron-right text-[12px]"></i>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'profile' && (
                    <>
                        {/* Lengkapi Data Diri Banner */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-8 relative overflow-hidden h-[160px] sm:h-[180px] md:h-[200px] flex flex-col justify-start">
                            <div className="relative z-10 text-pretty">
                                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1">Lengkapi Data Diri Anda!</h3>
                                <p className="text-[12px] sm:text-xl text-primary-light">Pastikan data anda lengkap dan sesuai</p>
                            </div>
                            <div className="absolute bottom-2 sm:bottom-4 w-full flex justify-center pointer-events-none">
                                <Image
                                    src="/images/DataPribadiImage.svg"
                                    alt="Lengkapi Data Diri"
                                    width={400}
                                    height={200}
                                    className="w-[320px] xs:w-[400px] sm:w-[350px] lg:w-[400px] object-contain object-bottom translate-y-2 md:translate-y-4"
                                />
                            </div>
                        </div>

                        {/* Biodata Nasabah */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
                            <h2 className="text-lg sm:text-xl font-bold text-primary mb-6 text-center">Biodata Nasabah</h2>
                            <div className="space-y-4 text-xs sm:text-sm">
                                {[
                                    { label: 'Id nasabah', value: userId },
                                    { label: 'Nama nasabah', value: displayName },
                                    { label: 'Username', value: username },
                                    { label: 'Email', value: userEmail },
                                    { label: 'Nomor HP', value: userPhone },
                                    { label: 'NIK', value: userNIK },
                                    { label: 'Alamat', value: userAddress },
                                    { label: 'RT', value: userRT },
                                    { label: 'RW', value: userRW },
                                    { label: 'Kelurahan', value: 'Ciracas' },
                                    { label: 'Kecamatan', value: 'Ciracas' },
                                    { label: 'Kota', value: 'Jakarta Timur' },
                                    { label: 'Provinsi', value: 'DKI Jakarta' },
                                    { label: 'Kode Pos', value: '13740' },
                                    { label: 'Bank Sampah Terdekat', value: nasabah?.bankSampah || selectedBankSampah }
                                ].map((item, idx) => (
                                    <div key={item.label} className={`flex flex-col sm:flex-row ${idx !== 13 ? 'border-b border-gray-100 pb-2' : 'pb-2'}`}>
                                        <span className="font-bold text-primary w-full sm:w-48 mb-1 sm:mb-0">{item.label}</span>
                                        <span className="text-gray-600 truncate">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pengaturan Profil */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                            <h2 className="text-xl font-bold text-primary mb-6">Pengaturan Profil</h2>

                            {/* Informasi Personal Form */}
                            <div className="mb-8 border rounded-3xl p-6 border-gray-200">
                                <h3 className="text-lg font-bold text-primary mb-4">Informasi Personal</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-primary mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={userEmail}
                                            className="w-full px-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
                                            readOnly
                                            disabled
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1 ml-4">Email tidak dapat diubah karena digunakan sebagai identitas akun</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-primary mb-1">Nama Lengkap</label>
                                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-primary mb-1">Username</label>
                                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-primary mb-1">Nomor HP</label>
                                        <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-sm" />
                                    </div>

                                    <div className="flex justify-center mt-6">
                                        <button onClick={handleSaveProfile} className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-12 rounded-full transition shadow-md cursor-pointer">
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Alamat Domisili Form */}
                            <div className="border rounded-3xl p-6 border-gray-200">
                                <h3 className="text-lg font-bold text-primary mb-4">Alamat Domisili</h3>
                                <div className="space-y-4">
                                    {/* Alamat Lengkap - Textarea */}
                                    <div>
                                        <label className="block text-xs font-bold text-primary mb-1">Alamat Lengkap</label>

                                        <textarea
                                            placeholder="Contoh: Jl. Raya Bogor No. 123, dekat masjid Al-Ikhlas"
                                            rows={3}
                                            value={userAddress}
                                            onChange={(e) => setUserAddress(e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-primary text-sm resize-none"
                                        />
                                    </div>

                                    {/* RT and RW */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-primary mb-1">RT</label>
                                            <input
                                                type="text"
                                                placeholder="01"
                                                maxLength={3}
                                                value={userRT}
                                                onChange={(e) => setUserRT(e.target.value)}
                                                className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-primary mb-1">RW</label>
                                            <input
                                                type="text"
                                                placeholder="01"
                                                maxLength={3}
                                                value={userRW}
                                                onChange={(e) => setUserRW(e.target.value)}
                                                className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Hardcoded Location Info */}
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <p className="text-xs text-primary font-bold mb-2">
                                            <i className="fas fa-info-circle mr-2"></i>
                                            Lokasi Terdaftar
                                        </p>
                                        <div className="text-xs text-primary space-y-1">
                                            <p><span className="font-semibold">Kelurahan:</span> Ciracas</p>
                                            <p><span className="font-semibold">Kecamatan:</span> Ciracas</p>
                                            <p><span className="font-semibold">Kota:</span> Jakarta Timur</p>
                                            <p><span className="font-semibold">Provinsi:</span> DKI Jakarta</p>
                                            <p><span className="font-semibold">Kode Pos:</span> 13740</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center mt-6">
                                        <button onClick={handleSaveProfile} className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-12 rounded-full transition shadow-md cursor-pointer">
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'penyetoran' && (
                    <>
                        {/* Setorkan Sampah Anda Section */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 mb-8 relative overflow-hidden min-h-[140px] sm:min-h-[180px] flex items-center shadow-sm">
                            <div className="relative z-10 max-w-[70%] sm:max-w-[60%]">
                                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Setorkan Sampah Anda</h2>
                                <p className="text-primary-light text-[12px] sm:text-xl leading-relaxed">
                                    Ubah sampah anda menjadi saldo dengan menyetorkannya melalui bank sampah terdekat
                                </p>
                            </div>
                            <div className="absolute bottom-0 right-4 sm:right-10 md:right-20 pointer-events-none translate-y-4">
                                <Image
                                    src="/images/Tong Sampah 3.svg"
                                    alt="Tong Sampah"
                                    width={128}
                                    height={64}
                                    className="w-24 sm:w-32 h-auto"
                                />
                            </div>
                        </div>

                        {/* Perkiraan Saldo Didapat */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-6 text-center">{t('nasabah.dashboard.estimated_balance')}</h2>
                            <div className="max-w-2xl mx-auto space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-primary mb-2 pl-4">{t('common.waste_type')}</label>
                                    <div className="relative">
                                        <select
                                            value={calcJenisSampah}
                                            onChange={(e) => {
                                                setCalcJenisSampah(e.target.value);
                                                // Reset berat dan saldo saat ganti jenis
                                                if (calcBerat) {
                                                    const newSaldo = calculateFilteredSaldo(e.target.value, parseFloat(calcBerat));
                                                    setCalcSaldo(newSaldo);
                                                }
                                            }}
                                            className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-xs sm:text-sm appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="">{t('common.select_waste_type')}</option>
                                            {filteredWastePrices.map((wp) => (
                                                <option key={wp.id} value={wp.jenis}>
                                                    {wp.jenis} (Rp {wp.harga.toLocaleString('id-ID')} / {wp.per === 'Kilogram' ? 'kg' : wp.per === 'Liter' ? 'ltr' : 'pcs'})
                                                </option>
                                            ))}
                                        </select>
                                        <i className="fas fa-chevron-down absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-primary mb-2 pl-4">{t('common.weight')}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder={t('common.enter_weight')}
                                            value={calcBerat}
                                            onChange={(e) => {
                                                const berat = e.target.value;
                                                setCalcBerat(berat);
                                                if (calcJenisSampah && berat) {
                                                    const newSaldo = calculateFilteredSaldo(calcJenisSampah, parseFloat(berat));
                                                    setCalcSaldo(newSaldo);
                                                } else {
                                                    setCalcSaldo(0);
                                                }
                                            }}
                                            disabled={!calcJenisSampah}
                                            className="w-full px-5 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-primary text-xs sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                                        />
                                        <span className="absolute mr-6 right-5 xs:right-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-[10px] sm:text-xs">
                                            {calcJenisSampah ? (getFilteredUnitByJenis(calcJenisSampah) === 'Kilogram' ? 'kg' : getFilteredUnitByJenis(calcJenisSampah) === 'Liter' ? 'ltr' : 'pcs') : t('common.unit').toLowerCase()}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-primary mb-2 pl-4">{t('common.price')}</label>
                                    <input
                                        type="text"
                                        value={calcSaldo > 0 ? `Rp. ${calcSaldo.toLocaleString('id-ID')}` : 'Rp. 0'}
                                        className={`w-full px-5 py-3 rounded-full border text-xs sm:text-sm bg-gray-50 ${calcSaldo > 0 ? 'border-primary/30 bg-tertiary/30 font-bold text-primary' : 'border-gray-300'}`}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Alur Penyetoran Sampah */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                            <h2 className="text-xl font-bold text-primary mb-3 text-center">Alur Penyetoran Sampah</h2>
                            <p className="text-gray-600 text-sm text-center mb-8">Ikut alur yang sudah kami tentukan untuk pengumpulan dan penyetoran sampah anda dengan mudah</p>

                            <div className="max-w-4xl mx-auto">
                                {/* Desktop Timeline */}
                                <div className="hidden md:flex items-start justify-between relative">
                                    {/* Connecting Line */}
                                    <div className="absolute top-10 left-0 right-0 h-1 bg-primary" style={{ left: '10%', right: '10%' }}></div>

                                    {/* Step 1 */}
                                    <div className="flex flex-col items-center text-center flex-1 relative z-10">
                                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                                            1
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 max-w-[140px]">Kumpulkan sampah anda</p>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="flex flex-col items-center text-center flex-1 relative z-10">
                                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                                            2
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 max-w-[140px]">Datang ke bank sampah</p>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="flex flex-col items-center text-center flex-1 relative z-10">
                                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                                            3
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 max-w-[140px]">Setorkan sampah anda pada petugas yang berjaga</p>
                                    </div>

                                    {/* Step 4 */}
                                    <div className="flex flex-col items-center text-center flex-1 relative z-10">
                                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                                            4
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 max-w-[140px]">Sampah dicatat dan saldo masuk ke akun OSKU anda</p>
                                    </div>
                                </div>

                                {/* Mobile Timeline */}
                                <div className="md:hidden space-y-6">
                                    {[
                                        { num: 1, text: "Kumpulkan sampah anda" },
                                        { num: 2, text: "Datang ke bank sampah" },
                                        { num: 3, text: "Setorkan sampah anda pada petugas yang berjaga" },
                                        { num: 4, text: "Sampah dicatat dan saldo masuk ke akun OSKU anda" }
                                    ].map((step, idx) => (
                                        <div key={step.num} className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                                                {step.num}
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 pt-4">{step.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bank Sampah Pilihan Anda & Daftar Harga */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Bank Sampah Pilihan Anda</h2>
                            <p className="text-primary-light text-xs sm:text-sm mb-6 sm:mb-8">Informasi bank sampah pilihan Anda dan daftar harga sampah</p>

                            {(() => {
                                // Find the selected bank from context with case-insensitive matching
                                const userBank = banks.find(b => {
                                    const bankName = b.nama.toLowerCase().trim();
                                    const selected = selectedBankSampah.toLowerCase().trim();
                                    return bankName === selected ||
                                        bankName.includes(selected.replace('bank sampah ', '')) ||
                                        selected.includes(bankName.replace('bank sampah ', ''));
                                });

                                if (userBank) {
                                    return (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Bank Card */}
                                            <div className="bg-tertiary/30 rounded-2xl p-4 sm:p-6 border border-primary/10">
                                                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                                    {/* Bank Image */}
                                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                                                        <Image
                                                            src={userBank.image || "/images/location1.svg"}
                                                            alt={userBank.nama}
                                                            width={100}
                                                            height={100}
                                                            className="object-contain w-16 h-16 sm:w-auto sm:h-auto"
                                                        />
                                                    </div>

                                                    {/* Bank Info */}
                                                    <div className="flex-1 text-center sm:text-left">
                                                        {/* Status Label above name */}
                                                        <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                                                            {(() => {
                                                                // Check if currently open based on day and time
                                                                const now = new Date();
                                                                const currentHour = now.getHours();
                                                                const currentMinute = now.getMinutes();
                                                                const currentTime = currentHour * 60 + currentMinute;

                                                                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                                                const currentDay = days[now.getDay()];

                                                                // Parse open/close time
                                                                const openTimeParts = (userBank.openTime || '08:00').split(':');
                                                                const closeTimeParts = (userBank.closeTime || '16:30').split(':');
                                                                const openMinutes = parseInt(openTimeParts[0]) * 60 + parseInt(openTimeParts[1] || '0');
                                                                const closeMinutes = parseInt(closeTimeParts[0]) * 60 + parseInt(closeTimeParts[1] || '0');

                                                                // Check if current day is within operating days
                                                                const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                                                                const openDayIdx = dayOrder.indexOf(userBank.openDay || 'Senin');
                                                                const closeDayIdx = dayOrder.indexOf(userBank.closeDay || 'Sabtu');
                                                                const currentDayIdx = dayOrder.indexOf(currentDay);

                                                                const isDayOpen = currentDayIdx >= openDayIdx && currentDayIdx <= closeDayIdx;
                                                                const isTimeOpen = currentTime >= openMinutes && currentTime <= closeMinutes;
                                                                const isOpen = isDayOpen && isTimeOpen;

                                                                return (
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${isOpen
                                                                        ? 'bg-tertiary text-primary border border-primary/20'
                                                                        : 'bg-red-100 text-red-600 border border-red-200'
                                                                        }`}>
                                                                        {isOpen ? 'Buka' : 'Tutup'}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <h3 className="font-bold text-primary text-lg sm:text-xl mb-2 sm:mb-3">{userBank.nama}</h3>
                                                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                                            <p className="flex items-center gap-2 justify-center sm:justify-start">
                                                                <i className="fas fa-map-marker-alt text-primary/70 w-4 flex-shrink-0"></i>
                                                                <span>{userBank.alamat}</span>
                                                            </p>
                                                            <p className="flex items-center gap-2 justify-center sm:justify-start">
                                                                <i className="fas fa-clock text-primary/70 w-4 flex-shrink-0"></i>
                                                                <span>
                                                                    {userBank.openDay && userBank.closeDay
                                                                        ? `${userBank.openDay} - ${userBank.closeDay} : `
                                                                        : ''
                                                                    }
                                                                    {userBank.openTime || '08:00'} - {userBank.closeTime || '16:30'}
                                                                </span>
                                                            </p>
                                                        </div>

                                                        {/* Kontak Layanan Button */}
                                                        <button
                                                            onClick={() => {
                                                                if (userBank.kontakLayanan) {
                                                                    // Extract number if composite "Name (Number)"
                                                                    let phoneNumber = userBank.kontakLayanan.replace(/\D/g, '');

                                                                    // If empty (just name), try to find by name in petugas list
                                                                    if (!phoneNumber && petugasList && petugasList.length > 0) {
                                                                        const officerName = userBank.kontakLayanan.trim();
                                                                        const foundOfficer = petugasList.find(p => p.nama.toLowerCase() === officerName.toLowerCase());
                                                                        if (foundOfficer && foundOfficer.noHp) {
                                                                            phoneNumber = foundOfficer.noHp.replace(/\D/g, '');
                                                                        }
                                                                    }

                                                                    if (phoneNumber) {
                                                                        const waNumber = phoneNumber.startsWith('0') ? '62' + phoneNumber.slice(1) : phoneNumber;
                                                                        window.open(`https://wa.me/${waNumber}?text=Halo, saya ingin menanyakan tentang layanan Bank Sampah ${userBank.nama}`, '_blank');
                                                                    } else {
                                                                        showStandaloneToast('error', 'Gagal', 'Nomor telepon petugas tidak ditemukan.');
                                                                    }
                                                                }
                                                            }}
                                                            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 sm:py-2.5 px-5 sm:px-6 rounded-full transition shadow-sm text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 mx-auto sm:mx-0"
                                                        >
                                                            <i className="fab fa-whatsapp text-base sm:text-lg"></i>
                                                            Kontak Layanan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price List */}
                                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                                <div className="bg-primary px-4 py-3">
                                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                        <i className="fas fa-tags"></i>
                                                        Daftar Harga Sampah
                                                    </h4>
                                                </div>
                                                <div className="max-h-[200px] sm:max-h-[220px] overflow-y-auto">
                                                    {userBank.wasteTypes && userBank.wasteTypes.length > 0 ? (
                                                        <table className="w-full text-xs sm:text-sm">
                                                            <thead className="bg-tertiary sticky top-0">
                                                                <tr>
                                                                    <th className="px-3 sm:px-4 py-2 text-left font-bold text-primary">Jenis Sampah</th>
                                                                    <th className="px-3 sm:px-4 py-2 text-center font-bold text-primary">Satuan</th>
                                                                    <th className="px-3 sm:px-4 py-2 text-right font-bold text-primary">Harga</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {userBank.wasteTypes.map((waste, idx) => (
                                                                    <tr key={waste.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                        <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700">{waste.nama}</td>
                                                                        <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-center text-gray-500">{waste.satuan}</td>
                                                                        <td className="px-3 sm:px-4 py-2 sm:py-2.5 text-right font-medium text-primary whitespace-nowrap">
                                                                            Rp {waste.hargaPerSatuan.toLocaleString('id-ID')}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <div className="p-6 text-center text-gray-400">
                                                            <i className="fas fa-inbox text-2xl mb-2 block"></i>
                                                            <p className="text-sm">Belum ada data harga</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="bg-tertiary/30 rounded-2xl p-8 text-center max-w-xl">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                <i className="fas fa-building text-3xl text-gray-300"></i>
                                            </div>
                                            <p className="text-gray-500 font-medium mb-2">Belum memilih Bank Sampah</p>
                                            <p className="text-sm text-gray-400">Silakan pilih Bank Sampah saat registrasi</p>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </>
                )}

                {activeTab === 'pencairan' && (
                    <>
                        {/* Cairkan Saldo Anda Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Cairkan saldo Anda!</h2>
                                    <p className="text-primary-light text-[12px] sm:text-xl">Tarik saldo Anda dengan mudah melalui rekening bank pilihan Anda</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <Image
                                        src="/images/ilusUang.svg"
                                        alt="Ilustrasi Uang"
                                        width={160}
                                        height={160}
                                        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Alur Pencairan Saldo (Offline) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                            <h2 className="text-xl font-bold text-primary mb-3 text-center">Alur Pencairan Saldo (Offline)</h2>
                            <p className="text-primary-light text-[12px] sm:text-xl text-center mb-8">Pahami alurnya dan cairkan saldo anda dengan mudah</p>

                            <div className="max-w-4xl mx-auto">
                                {/* Desktop Timeline */}
                                <div className="hidden md:flex items-start justify-between relative">
                                    <div className="absolute top-10 left-0 right-0 h-1 bg-primary" style={{ left: '10%', right: '10%' }}></div>

                                    {[
                                        { num: 1, text: "Kirim pengajuan pencairan saldo" },
                                        { num: 2, text: "Menunggu pengajuan disetujui" },
                                        { num: 3, text: "Simpan bukti Pengajuan Pencairan Saldo" },
                                        { num: 4, text: "Datang ke bank sampah pilihan anda" },
                                        { num: 5, text: "Berikan bukti dan cairkan saldo anda melalui petugas OSKU" }
                                    ].map((step) => (
                                        <div key={step.num} className="flex flex-col items-center text-center flex-1 relative z-10">
                                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                                                {step.num}
                                            </div>
                                            <p className="text-sm font-medium text-primary-light max-w-[140px]">{step.text}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Timeline */}
                                <div className="md:hidden space-y-6">
                                    {[
                                        { num: 1, text: "Kirim pengajuan pencairan saldo" },
                                        { num: 2, text: "Menunggu pengajuan disetujui" },
                                        { num: 3, text: "Simpan bukti Pengajuan Pencairan Saldo" },
                                        { num: 4, text: "Datang ke bank sampah pilihan anda" },
                                        { num: 5, text: "Berikan bukti dan cairkan saldo anda melalui petugas OSKU" }
                                    ].map((step) => (
                                        <div key={step.num} className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                                                {step.num}
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 pt-4">{step.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>



                        {/* Pengajuan Tarik Saldo */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
                            <h2 className="text-xl sm:text-2xl font-bold text-[#3B8A51] mb-1 text-center font-metropolis">Pengajuan Tarik Saldo</h2>
                            <p className="text-[#3B8A51] text-xs sm:text-sm text-center mb-8 font-medium">Pastikan Nominal saldo yang anda tarik mencukupi</p>

                            <div className="max-w-4xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div>
                                        <label className="block text-sm font-medium text-[#3B8A51] mb-3">Nominal Penarikan Saldo</label>
                                        <input
                                            type="text"
                                            value={withdrawalAmount}
                                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                                            placeholder="Nominal Penarikan Saldo"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3B8A51] focus:ring-1 focus:ring-[#3B8A51] text-sm placeholder-gray-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#3B8A51] mb-3">Tanggal Pengajuan</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={withdrawalDate}
                                                onChange={(e) => setWithdrawalDate(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3B8A51] focus:ring-1 focus:ring-[#3B8A51] text-sm text-gray-600 placeholder-gray-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#3B8A51] mb-3">Lokasi Bank Sampah</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={selectedBankSampah}
                                                readOnly
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600 cursor-not-allowed"
                                            />
                                            <i className="fas fa-map-marker-alt absolute right-4 top-1/2 transform -translate-y-1/2 text-primary text-sm pointer-events-none"></i>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-2 ml-1">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            Lokasi bank sampah sesuai dengan data registrasi Anda
                                        </p>
                                    </div>
                                </div>

                                {/* Commission Breakdown */}
                                {withdrawalAmount && parseInt(withdrawalAmount.replace(/\D/g, '')) > 0 && (() => {
                                    const nominal = parseInt(withdrawalAmount.replace(/\D/g, ''));
                                    const selectedBankData = banks.find(b => b.nama === selectedBankSampah);
                                    const komisiPersen = selectedBankData?.komisiPersen ?? 30;
                                    const biayaLayanan = Math.round(nominal * komisiPersen / 100);
                                    const yangDiterima = nominal - biayaLayanan;
                                    return (
                                        <div className="bg-tertiary/50 rounded-2xl p-5 mb-6 border border-primary/10">
                                            <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                                                <i className="fas fa-receipt"></i>
                                                Rincian Pencairan
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Jumlah Pencairan</span>
                                                    <span className="font-medium text-gray-800">Rp {nominal.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-warning">
                                                    <span>Biaya Layanan ({komisiPersen}%)</span>
                                                    <span className="font-medium">- Rp {biayaLayanan.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="border-t border-primary/20 pt-2 mt-2"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-primary">Yang Anda Terima</span>
                                                    <span className="font-bold text-primary text-lg">Rp {yangDiterima.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                                                <i className="fas fa-info-circle mt-0.5"></i>
                                                Biaya layanan digunakan untuk operasional Bank Sampah.
                                            </p>
                                        </div>
                                    );
                                })()}

                                <div className="flex justify-center">
                                    <button
                                        onClick={async () => {

                                            // Validate inputs
                                            if (!withdrawalAmount || !withdrawalDate) {
                                                return;
                                            }

                                            // Find bankSampahId from selected bank name
                                            const userBank = banks.find(b => {
                                                const bankName = b.nama.toLowerCase().trim();
                                                const selected = selectedBankSampah.toLowerCase().trim();
                                                return bankName === selected ||
                                                    bankName.includes(selected.replace('bank sampah ', '')) ||
                                                    selected.includes(bankName.replace('bank sampah ', ''));
                                            });

                                            // VALIDATION: Bank Must Be Found
                                            if (!userBank) {
                                                showStandaloneToast('error', 'Gagal', 'Bank Sampah tidak ditemukan. Silakan periksa profil Anda atau hubungi admin.');
                                                return;
                                            }

                                            // Set the bank sampah location from selected bank
                                            setWithdrawalBank(selectedBankSampah);

                                            const amount = parseInt(withdrawalAmount.replace(/\D/g, ''));

                                            // Try to save to Supabase database first
                                            const result = await addPencairan({
                                                nasabah_id: userId,
                                                petugas_id: null,
                                                bank_sampah_id: userBank.id, // Now guaranteed to exist
                                                jumlah: amount,
                                                status: 'pending',
                                                alasan: null,
                                                tanggal_pengajuan: new Date().toISOString(),
                                                tanggal_selesai: null,
                                                catatan: null,
                                            });

                                            if (result) {
                                                // Successfully saved to database - status is 'Diproses'
                                                setWithdrawalId(result.id || '-');
                                                setWithdrawalStatus('processing');
                                                setSubmittedData({
                                                    amount: amount,
                                                    date: new Date().toISOString(),
                                                    bank: selectedBankSampah,
                                                    id: result.id
                                                });

                                                // Clear form inputs
                                                setWithdrawalAmount('');
                                                setWithdrawalDate('');

                                                showStandaloneToast('success', 'Berhasil', 'Pengajuan pencairan berhasil dikirim. Saldo akan berkurang setelah disetujui petugas.');
                                            } else {
                                                // Error handling without localStorage fallback
                                                // We can infer it failed likely due to insufficient balance or network
                                                showStandaloneToast('error', 'Gagal Mengirim Pengajuan', 'Pastikan saldo mencukupi.');
                                            }
                                        }}
                                        disabled={!withdrawalAmount || !withdrawalDate}
                                        className="bg-[#3D7A4D] hover:bg-[#2F5E3B] text-white font-medium py-3 px-16 rounded-full transition shadow-lg w-full sm:w-auto text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Kirim
                                    </button>

                                    <button
                                        onClick={() => {
                                            setWithdrawalAmount('');
                                            setWithdrawalDate('');
                                        }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-8 rounded-full transition shadow-sm w-full sm:w-auto text-sm cursor-pointer ml-3"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Pengajuan */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                            <h2 className="text-xl font-bold text-primary mb-6 text-center">Status Pengajuan</h2>

                            <div className="max-w-3xl mx-auto">
                                {/* Status Info */}
                                <div className="text-center mb-8">
                                    {withdrawalStatus === 'empty' ? (
                                        <p className="text-gray-500 text-sm">Tidak ada pengajuan aktif</p>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            {withdrawalId && (
                                                <p className="text-gray-500 text-sm mb-2">ID Pengajuan : {withdrawalId}</p>
                                            )}

                                            {withdrawalStatus === 'processing' && (
                                                <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    <span className="font-medium text-sm">Pengajuan Diproses</span>
                                                </div>
                                            )}
                                            {withdrawalStatus === 'approved' && (
                                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                                                    <i className="fas fa-check"></i>
                                                    <span className="font-medium text-sm">Pengajuan Disetujui</span>
                                                </div>
                                            )}
                                            {withdrawalStatus === 'completed' && (
                                                <div className="inline-flex items-center gap-2 bg-green-200 text-green-900 px-4 py-2 rounded-full">
                                                    <i className="fas fa-check-circle"></i>
                                                    <span className="font-medium text-sm">Transaksi Selesai</span>
                                                </div>
                                            )}
                                            {withdrawalStatus === 'failed' && (
                                                <>
                                                    <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                                                        <i className="fas fa-times-circle"></i>
                                                        <span className="font-medium text-sm">Pengajuan Ditolak</span>
                                                    </div>
                                                    {withdrawalRejectReason && (
                                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 max-w-md">
                                                            <div className="flex items-start gap-3">
                                                                <i className="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
                                                                <div>
                                                                    <p className="text-sm font-bold text-red-700 mb-1">Alasan Penolakan:</p>
                                                                    <p className="text-sm text-red-600">{withdrawalRejectReason}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {withdrawalStatus === 'cancelled' && (
                                                <>
                                                    <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
                                                        <i className="fas fa-ban"></i>
                                                        <span className="font-medium text-sm">Pengajuan Dibatalkan</span>
                                                    </div>
                                                    {withdrawalRejectReason && (
                                                        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 max-w-md">
                                                            <div className="flex items-start gap-3">
                                                                <i className="fas fa-info-circle text-orange-500 mt-0.5"></i>
                                                                <div>
                                                                    <p className="text-sm font-bold text-orange-700 mb-1">Alasan Pembatalan:</p>
                                                                    <p className="text-sm text-orange-600">{withdrawalRejectReason}</p>
                                                                    <p className="text-xs text-orange-500 mt-2">Saldo Anda telah dikembalikan.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                        </div>
                                    )}
                                </div>

                                {/* Progress Timeline */}
                                <div className="relative">
                                    {/* Desktop Timeline */}
                                    <div className="hidden md:flex items-center justify-between relative">
                                        {/* Connecting Lines */}
                                        <div className="absolute top-10 left-0 right-0 h-1 bg-gray-300" style={{ left: '12.5%', right: '12.5%' }}></div>

                                        {/* Steps - Dynamic based on status */}
                                        {(() => {
                                            // Define steps based on current status
                                            let steps = [];
                                            if (withdrawalStatus === 'failed') {
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: true, error: false },
                                                    { id: 2, label: "Pengajuan Ditolak", status: 'failed', active: true, error: true }
                                                ];
                                            } else if (withdrawalStatus === 'cancelled') {
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: true, error: false },
                                                    { id: 2, label: "Pengajuan Disetujui", status: 'approved', active: true, error: false },
                                                    { id: 3, label: "Dibatalkan", status: 'cancelled', active: true, error: true }
                                                ];
                                            } else {
                                                // Normal flow: processing -> approved -> completed
                                                const statusOrder = ['empty', 'processing', 'approved', 'completed'];
                                                const currentIndex = statusOrder.indexOf(withdrawalStatus);
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: currentIndex >= 1, error: false },
                                                    { id: 2, label: "Pengajuan Disetujui", status: 'approved', active: currentIndex >= 2, error: false },
                                                    { id: 3, label: "Transaksi Selesai", status: 'completed', active: currentIndex >= 3, error: false }
                                                ];
                                            }

                                            return steps.map((step) => (
                                                <div key={step.id} className="flex flex-col items-center text-center flex-1 relative z-10">
                                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg ${step.error ? 'bg-red-500' :
                                                        step.status === 'cancelled' ? 'bg-orange-500' :
                                                            step.active ? 'bg-primary' : 'bg-gray-300'
                                                        }`}>
                                                        {step.id}
                                                    </div>
                                                    <p className={`text-xs font-medium max-w-[100px] ${step.active ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Mobile Timeline - Dynamic based on status */}
                                    <div className="md:hidden space-y-6">
                                        {(() => {
                                            // Define steps based on current status
                                            let steps = [];
                                            if (withdrawalStatus === 'failed') {
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: true, error: false },
                                                    { id: 2, label: "Pengajuan Ditolak", status: 'failed', active: true, error: true }
                                                ];
                                            } else if (withdrawalStatus === 'cancelled') {
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: true, error: false },
                                                    { id: 2, label: "Pengajuan Disetujui", status: 'approved', active: true, error: false },
                                                    { id: 3, label: "Dibatalkan", status: 'cancelled', active: true, error: true }
                                                ];
                                            } else {
                                                // Normal flow: processing -> approved -> completed
                                                const statusOrder = ['empty', 'processing', 'approved', 'completed'];
                                                const currentIndex = statusOrder.indexOf(withdrawalStatus);
                                                steps = [
                                                    { id: 1, label: "Pengajuan Diproses", status: 'processing', active: currentIndex >= 1, error: false },
                                                    { id: 2, label: "Pengajuan Disetujui", status: 'approved', active: currentIndex >= 2, error: false },
                                                    { id: 3, label: "Transaksi Selesai", status: 'completed', active: currentIndex >= 3, error: false }
                                                ];
                                            }

                                            return steps.map((step) => (
                                                <div key={step.id} className="flex items-start gap-4">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg ${step.error ? 'bg-red-500' :
                                                        step.status === 'cancelled' ? 'bg-orange-500' :
                                                            step.active ? 'bg-primary' : 'bg-gray-300'
                                                        }`}>
                                                        {step.id}
                                                    </div>
                                                    <p className={`text-sm font-medium pt-4 ${step.active ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                {/* Withdrawal Receipt Section - show when approved or completed */}
                                {(withdrawalStatus === 'approved' || withdrawalStatus === 'completed') && (
                                    <div className="mt-8 flex flex-col items-center animate-fadeIn w-full">
                                        {/* Title outside card */}
                                        <p className="text-gray-500 text-sm font-medium mb-6">Bukti Pengajuan</p>

                                        {/* The Receipt Card - Standalone & Shadowed */}
                                        <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-8 w-full max-w-[550px] mb-8 relative flex flex-col items-center border border-gray-50">

                                            {/* Logo */}
                                            <div className="mb-6">
                                                <Image src="/icon/logoOsku2.svg" alt="OSKU" width={80} height={80} className="h-14 w-auto" />
                                            </div>

                                            {/* ID Banner */}
                                            <div className="bg-tertiary w-full py-4 rounded-2xl flex justify-between items-center px-6 mb-6">
                                                <span className="text-primary font-bold text-sm flex-shrink-0">ID Pengajuan</span>
                                                <span className="text-primary font-bold text-xs sm:text-sm tracking-wide break-all text-right ml-4">{withdrawalId}</span>
                                            </div>

                                            {/* Details Grid */}
                                            {(() => {
                                                // FIX: Use submittedData if available (for receipt after new submission), otherwise fallback to history or current state
                                                // This prevents 0 issue when form is cleared
                                                const displayAmount = submittedData ? submittedData.amount : (parseInt(withdrawalAmount.replace(/\D/g, '')) || 0);
                                                const displayDate = submittedData ? submittedData.date : withdrawalDate;
                                                const displayBank = submittedData ? submittedData.bank : (withdrawalBank || selectedBankSampah);

                                                const nominal = displayAmount;
                                                const selectedBankData = banks.find(b => b.nama === displayBank);
                                                const komisiPersen = selectedBankData?.komisiPersen ?? 30;
                                                const biayaLayanan = Math.round(nominal * komisiPersen / 100);
                                                const yangDiterima = nominal - biayaLayanan;

                                                return (
                                                    <>
                                                        {/* Main Info Row */}
                                                        <div className="grid grid-cols-2 w-full text-center relative mb-4">
                                                            <div className="absolute top-2 bottom-2 left-1/2 w-[1px] bg-gray-200"></div>

                                                            <div className="flex flex-col px-2 items-center justify-start">
                                                                <span className="text-gray-400 text-[10px] uppercase font-medium mb-2 tracking-wider">Tanggal</span>
                                                                <span className="text-primary font-bold text-lg">{formatDate(displayDate)}</span>
                                                            </div>
                                                            <div className="flex flex-col px-2 items-center justify-start">
                                                                <span className="text-gray-400 text-[10px] uppercase font-medium mb-2 tracking-wider">Lokasi</span>
                                                                <span className="text-primary font-bold text-sm leading-tight">{displayBank || '-'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Commission Breakdown Box */}
                                                        <div className="w-full bg-tertiary/50 rounded-xl p-4 mb-6 border border-primary/10">
                                                            <h5 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                                                                <i className="fas fa-receipt"></i>
                                                                Rincian Pencairan
                                                            </h5>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-600">Jumlah Pencairan</span>
                                                                    <span className="font-medium text-gray-800">Rp {nominal.toLocaleString('id-ID')}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-orange-500">
                                                                    <span>Biaya Layanan ({komisiPersen}%)</span>
                                                                    <span className="font-medium">- Rp {biayaLayanan.toLocaleString('id-ID')}</span>
                                                                </div>
                                                                <div className="border-t border-primary/20 pt-2 mt-2"></div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold text-primary">Yang Anda Terima</span>
                                                                    <span className="font-bold text-primary text-lg">Rp {yangDiterima.toLocaleString('id-ID')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}

                                            {/* Instructions - Inside Card */}
                                            <div className="w-full">
                                                <h4 className="text-primary font-bold mb-4 text-base">Cara Tarik saldo melalui petugas</h4>
                                                <ol className="list-decimal pl-5 space-y-2 text-sm text-primary/80 font-normal">
                                                    <li>Simpan bukti pengajuan anda</li>
                                                    <li>Mendatangi lokasi bank sampah pilihan anda</li>
                                                    <li>Serahkan bukti pengajuan anda kepada petugas yang berjaga</li>
                                                    <li>Menerima uang cash yang di berikan oleh petugas</li>
                                                    <li>Mengecek histori pencairan saldo pada dashboard anda (Opsional)</li>
                                                    <li>Pastikan membawa bukti ini saat mengambil pencairan</li>
                                                </ol>
                                            </div>
                                        </div>

                                        {/* Download Button - Only visible when receipt is ready */}
                                        <button
                                            onClick={async () => {
                                                // Create PDF using jsPDF
                                                const doc = new jsPDF({
                                                    orientation: 'portrait',
                                                    unit: 'mm',
                                                    format: 'a5'
                                                });

                                                const pageWidth = doc.internal.pageSize.getWidth();
                                                const primaryColor: [number, number, number] = [59, 138, 81]; // #3B8A51
                                                const grayColor: [number, number, number] = [107, 114, 128];

                                                // Function to load image as base64 with high resolution
                                                const loadImage = (url: string, scale: number = 4): Promise<string> => {
                                                    return new Promise((resolve, reject) => {
                                                        const img = new window.Image();
                                                        img.crossOrigin = 'anonymous';
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            // Scale up for higher quality
                                                            canvas.width = img.width * scale;
                                                            canvas.height = img.height * scale;
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx) {
                                                                // Enable high quality image rendering
                                                                ctx.imageSmoothingEnabled = true;
                                                                ctx.imageSmoothingQuality = 'high';
                                                                ctx.scale(scale, scale);
                                                                ctx.drawImage(img, 0, 0);
                                                                resolve(canvas.toDataURL('image/png'));
                                                            } else {
                                                                reject(new Error('Canvas context not available'));
                                                            }
                                                        };
                                                        img.onerror = reject;
                                                        img.src = url;
                                                    });
                                                };

                                                try {
                                                    // Load logo
                                                    const logoDataUrl = await loadImage('/icon/logoOsku2.svg');

                                                    let yPos = 15;

                                                    // Add Logo - maintaining original aspect ratio (45:56)
                                                    const logoHeight = 28; // mm
                                                    const logoWidth = (45 / 56) * logoHeight; // ~22.5mm
                                                    doc.addImage(logoDataUrl, 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
                                                    yPos += logoHeight + 6;

                                                    // Subtitle
                                                    doc.setFontSize(11);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'normal');
                                                    doc.text('Bukti Pengajuan Pencairan Saldo', pageWidth / 2, yPos, { align: 'center' });
                                                    yPos += 12;

                                                    // ID Pengajuan Box
                                                    doc.setFillColor(212, 237, 218); // #D4EDDA
                                                    doc.roundedRect(15, yPos, pageWidth - 30, 15, 3, 3, 'F');

                                                    doc.setFontSize(10);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('ID Pengajuan', 20, yPos + 9);
                                                    doc.setFontSize(10);
                                                    doc.text(withdrawalId || '-', pageWidth - 20, yPos + 9, { align: 'right' });
                                                    yPos += 25;

                                                    // Calculate commission
                                                    const displayAmount = submittedData ? submittedData.amount : (parseInt(withdrawalAmount.replace(/\D/g, '')) || 0);
                                                    const displayBank = submittedData ? submittedData.bank : (withdrawalBank || selectedBankSampah);

                                                    const nominal = displayAmount;
                                                    const selectedBankData = banks.find(b => b.nama === displayBank);
                                                    const komisiPersen = selectedBankData?.komisiPersen ?? 30;
                                                    const biayaLayanan = Math.round(nominal * komisiPersen / 100);
                                                    const yangDiterima = nominal - biayaLayanan;

                                                    // Date and Location Row
                                                    const colWidth = (pageWidth - 30) / 2;

                                                    // Tanggal
                                                    doc.setFontSize(8);
                                                    doc.setTextColor(...grayColor);
                                                    doc.setFont('helvetica', 'normal');
                                                    doc.text('TANGGAL', 15 + colWidth / 2, yPos, { align: 'center' });
                                                    doc.setFontSize(12);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text(formatDate(withdrawalDate), 15 + colWidth / 2, yPos + 7, { align: 'center' });

                                                    // Lokasi
                                                    doc.setFontSize(8);
                                                    doc.setTextColor(...grayColor);
                                                    doc.setFont('helvetica', 'normal');
                                                    doc.text('LOKASI', 15 + colWidth * 1.5, yPos, { align: 'center' });
                                                    doc.setFontSize(10);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    const lokasi = withdrawalBank || selectedBankSampah || '-';
                                                    doc.text(lokasi, 15 + colWidth * 1.5, yPos + 7, { align: 'center' });
                                                    yPos += 18;

                                                    // Commission Breakdown Box
                                                    doc.setFillColor(240, 253, 244); // Light green bg
                                                    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

                                                    // Box title
                                                    doc.setFontSize(9);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('Rincian Pencairan', 20, yPos + 7);

                                                    // Jumlah Pencairan
                                                    doc.setFontSize(9);
                                                    doc.setTextColor(...grayColor);
                                                    doc.setFont('helvetica', 'normal');
                                                    doc.text('Jumlah Pencairan', 20, yPos + 15);
                                                    doc.text(`Rp ${nominal.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 15, { align: 'right' });

                                                    // Biaya Layanan
                                                    const orangeColor: [number, number, number] = [249, 115, 22];
                                                    doc.setTextColor(...orangeColor);
                                                    doc.text(`Biaya Layanan (${komisiPersen}%)`, 20, yPos + 22);
                                                    doc.text(`- Rp ${biayaLayanan.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 22, { align: 'right' });

                                                    // Divider line inside box
                                                    doc.setDrawColor(200, 230, 200);
                                                    doc.line(20, yPos + 25, pageWidth - 20, yPos + 25);

                                                    // Yang Anda Terima
                                                    doc.setFontSize(10);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('Yang Anda Terima', 20, yPos + 32);
                                                    doc.text(`Rp ${yangDiterima.toLocaleString('id-ID')}`, pageWidth - 20, yPos + 32, { align: 'right' });

                                                    yPos += 42;

                                                    // Divider
                                                    doc.setDrawColor(229, 231, 235);
                                                    doc.line(15, yPos, pageWidth - 15, yPos);
                                                    yPos += 10;

                                                    // Instructions
                                                    doc.setFontSize(11);
                                                    doc.setTextColor(...primaryColor);
                                                    doc.setFont('helvetica', 'bold');
                                                    doc.text('Cara Tarik saldo melalui petugas', 15, yPos);
                                                    yPos += 8;

                                                    doc.setFontSize(9);
                                                    doc.setFont('helvetica', 'normal');
                                                    const instructions = [
                                                        'Simpan bukti pengajuan anda',
                                                        'Mendatangi lokasi bank sampah pilihan anda',
                                                        'Serahkan bukti pengajuan anda kepada petugas yang berjaga',
                                                        'Menerima uang cash yang di berikan oleh petugas',
                                                        'Mengecek histori pencairan saldo pada dashboard anda (Opsional)',
                                                        'Pastikan membawa bukti ini saat mengambil pencairan'
                                                    ];

                                                    instructions.forEach((instruction, index) => {
                                                        doc.text(`${index + 1}. ${instruction}`, 15, yPos);
                                                        yPos += 6;
                                                    });

                                                    // Save PDF
                                                    doc.save(`bukti-pengajuan-${withdrawalId || 'receipt'}.pdf`);
                                                } catch (error) {
                                                    console.error('Error generating PDF:', error);
                                                }
                                            }}
                                            className="w-full max-w-[550px] bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full transition shadow-md flex items-center justify-center gap-2 mb-6 cursor-pointer"
                                        >
                                            Unduh Bukti Pengajuan (PDF)
                                        </button>
                                    </div>
                                )}


                            </div>
                        </div>
                    </>
                )}

            </main>



            {/* Logout Confirmation Full Screen View */}
            {
                showLogoutModal && (
                    <KonfirmasiLogout
                        onCancel={() => setShowLogoutModal(false)}
                        onConfirm={handleLogout}
                    />
                )
            }

            {/* Dark Support Footer */}
            <footer className="bg-[#0B141F] pt-12 pb-6 mt-12 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col items-center gap-8 mb-12">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Image src="/icon/logoOsku3.svg" alt="OSKU Logo" width={140} height={50} className="h-12 w-auto brightness-0 invert" />
                        </div>

                        {/* Support Card */}
                        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-lg border border-gray-100 flex flex-col items-center text-center max-w-sm mx-auto relative z-10">
                            <h4 className="font-bold text-[#3B8A51] mb-2 text-xl">Kontak Admin</h4>
                            <p className="text-gray-500 text-xs mb-6 max-w-[220px] leading-relaxed">
                                Jika terjadi kendala hubungi kontak berikut :
                            </p>
                            <a href={`tel:${adminContact}`} className="inline-flex items-center bg-[#3B8A51] hover:bg-[#2F6E41] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 group">
                                <i className="fas fa-phone-alt mr-3 text-xs group-hover:rotate-12 transition-transform"></i>
                                {adminContact}
                            </a>
                        </div>
                    </div>

                    <div className="flex justify-center pt-6 border-t border-gray-800">
                        <p className="text-gray-500 text-[10px]">┬⌐2025 OSKU All right reserved.</p>
                    </div>
                </div>
            </footer>
            <BackToTop />

            {/* Profile Update Success Notification */}
            {showProfileSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-tertiary border-2 border-primary rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <i className="fas fa-check text-white text-lg"></i>
                        </div>
                        <div>
                            <p className="text-primary font-bold text-sm">Profil Berhasil Diperbarui!</p>
                            <p className="text-primary text-xs">Perubahan telah disimpan</p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}


import { Suspense } from 'react';

export default function DashboardPage() {
    return (
        <Suspense fallback={null}>
            <Dashboard />
        </Suspense>
    );
}
