'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useBankSampah } from '@/contexts/BankSampahContext';
import { usePenyetoran } from '@/contexts/PenyetoranContext';
import ImageViewerModal from '@/components/shared/ImageViewerModal';
import YearPicker from '@/components/shared/YearPicker';
import { showStandaloneToast } from '@/components/shared/Toast';
import { getAllNasabah, getNasabahByName, getNasabahByBankSampah, addSaldoToNasabah, NasabahData } from '@/data/nasabahData';

export default function PenyetoranPetugas() {
    const { banks, getBankById } = useBankSampah();
    const { penyetoranList, fetchPenyetoranByBank, addPenyetoran, updatePenyetoran, deletePenyetoran, loading: penyetoranLoading } = usePenyetoran();
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [petugasBankId, setPetugasBankId] = useState<string | null>(null);

    // Ref for form container
    const formRef = useRef<HTMLDivElement>(null);

    // Search & Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Nasabah search autocomplete states
    const [nasabahSearchQuery, setNasabahSearchQuery] = useState('');
    const [showNasabahDropdown, setShowNasabahDropdown] = useState(false);
    const nasabahInputRef = useRef<HTMLInputElement>(null);

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; images: string[]; title: string }>({ isOpen: false, images: [], title: '' });

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: number | null; itemName: string }>({ isOpen: false, itemId: null, itemName: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state - refactored
    const [formData, setFormData] = useState({
        namaNasabah: '',
        noWhatsapp: '',  // WhatsApp number for sending proof
        petugasName: '-',  // Auto from logged-in user
        bankSampah: '-',  // Auto from petugas
        jenisSampah: '',
        satuan: '',
        hargaPerSatuan: 0,
        beratSampah: '',
        totalSaldo: 0,
        tanggalSetor: new Date().toISOString().split('T')[0],
        buktiFotos: [] as File[],
        buktiPreviews: [] as string[]
    });

    // State for last saved transaction (for WhatsApp sending)
    const [lastSavedData, setLastSavedData] = useState<{
        show: boolean;
        name: string;
        phone: string;
        type: string;
        weight: number;
        unit: string;
        total: number;
        date: string;
        bankSampah: string;
        idPenyetoran: string;
    } | null>(null);

    // Available waste types based on selected bank
    const [availableWasteTypes, setAvailableWasteTypes] = useState<any[]>([]);

    // Nasabah list from localStorage (dynamic data)
    const [nasabahList, setNasabahList] = useState<NasabahData[]>([]);

    // Load petugas bank ID from localStorage and fetch penyetoran from database
    useEffect(() => {
        const savedData = localStorage.getItem('petugasData');
        if (savedData) {
            try {
                const petugasData = JSON.parse(savedData);
                setPetugasBankId(petugasData.bankSampahId);

                // Auto-fill petugas name and bank sampah
                const petugasName = petugasData.name || petugasData.nama || '-';
                const bankSampahName = petugasData.bankSampahNama || petugasData.bankSampahName || petugasData.bank_sampah_name || '-';

                setFormData(prev => ({
                    ...prev,
                    petugasName: petugasName,
                    bankSampah: bankSampahName
                }));

                console.log('✅ Auto-filled petugas:', petugasName, 'Bank:', bankSampahName);

                if (petugasData.bankSampahId) {
                    fetchPenyetoranByBank(petugasData.bankSampahId);
                }
            } catch (error) {
                console.error('Error loading petugas data:', error);
            }
        }
    }, [fetchPenyetoranByBank]);

    // Map database data to component format
    useEffect(() => {
        const mappedData = penyetoranList.map((item, idx) => ({
            id: item.id,
            idPenyetoran: item.id || '-',
            no: idx + 1,
            name: item.nasabah_name || '-',
            type: item.waste_type_name || '-',
            date: new Date(item.tanggal).toLocaleDateString('id-ID'),
            weight: item.berat,
            unit: (item.waste_type_satuan ?
                (item.waste_type_satuan === 'kg' ? 'Kg' :
                    item.waste_type_satuan === 'ltr' ? 'Ltr' :
                        item.waste_type_satuan === 'pcs' ? 'Pcs' :
                            item.waste_type_satuan.charAt(0).toUpperCase() + item.waste_type_satuan.slice(1))
                : 'Kg'), // Default fallback
            price: item.total_harga / (item.berat || 1),
            bankSampah: item.bank_sampah_name || '-',
            buktiPreviews: item.bukti_foto || [],
            nasabah_id: item.nasabah_id,
            waste_type_id: item.jenis_sampah_id, // Map for internal usage if needed, though we rely on waste_type relation
            bank_sampah_id: item.bank_sampah_id,
        }));
        setHistoryData(mappedData);
    }, [penyetoranList]);

    // Load nasabah data filtered by bank sampah
    useEffect(() => {
        const loadData = async () => {
            if (formData.bankSampah && formData.bankSampah !== '-') {
                // Fetch only nasabah for this bank
                const data = await getNasabahByBankSampah(formData.bankSampah);
                setNasabahList(data);
            } else {
                setNasabahList([]);
            }
        };
        loadData();
    }, [formData.bankSampah]);

    // Load waste types when bank sampah changes
    useEffect(() => {
        const bank = banks.find(b => b.nama === formData.bankSampah);
        if (bank && bank.wasteTypes) {
            setAvailableWasteTypes(bank.wasteTypes);
        } else {
            setAvailableWasteTypes([]);
        }
    }, [formData.bankSampah, banks]);

    // Handle jenis sampah change - auto populate satuan & harga
    const handleWasteTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log('🔄 Dropdown changed, value:', e.target.value);
        console.log('📦 Available waste types:', availableWasteTypes);

        const selected = availableWasteTypes.find(wt => wt.nama === e.target.value);
        console.log('✅ Found waste type:', selected);

        if (selected) {
            console.log('💰 Setting form data with:', selected);
            setFormData(prev => ({
                ...prev,
                jenisSampah: selected.nama,
                satuan: selected.satuan,
                hargaPerSatuan: selected.hargaPerSatuan,
                totalSaldo: prev.beratSampah ? parseFloat(prev.beratSampah) * selected.hargaPerSatuan : 0
            }));
        } else {
            console.log('⚠️ No waste type found for:', e.target.value);
        }
    };

    // Handle berat change - auto calculate total
    const handleBeratChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const berat = e.target.value;
        setFormData(prev => ({
            ...prev,
            beratSampah: berat,
            totalSaldo: berat ? parseFloat(berat) * prev.hargaPerSatuan : 0
        }));
    };

    // Handle photo upload (multiple files)
    const handlePhotoUpload = (files: FileList | null) => {
        if (!files) return;

        const maxPhotos = 4;
        const currentCount = formData.buktiPreviews.length;
        const availableSlots = maxPhotos - currentCount;

        if (availableSlots <= 0) {
            showStandaloneToast('warning', 'Batas Foto Tercapai', `Maksimal ${maxPhotos} foto!`);
            return;
        }

        const filesToAdd = Array.from(files).slice(0, availableSlots);
        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        let processed = 0;
        filesToAdd.forEach((file) => {
            // Validate file size (max 5MB per file)
            if (file.size > 5 * 1024 * 1024) {
                showStandaloneToast('warning', 'File Terlalu Besar', `File ${file.name} terlalu besar! Maksimal 5MB per file.`);
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                newFiles.push(file);
                newPreviews.push(reader.result as string);
                processed++;

                if (processed === filesToAdd.length) {
                    setFormData(prev => ({
                        ...prev,
                        buktiFotos: [...prev.buktiFotos, ...newFiles],
                        buktiPreviews: [...prev.buktiPreviews, ...newPreviews]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    // Remove photo
    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            buktiFotos: prev.buktiFotos.filter((_, i) => i !== index),
            buktiPreviews: prev.buktiPreviews.filter((_, i) => i !== index)
        }));
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handlePhotoUpload(e.dataTransfer.files);
    };

    // Clear form
    const clearForm = () => {
        // Preserve petugas name and bank sampah
        setFormData(prev => ({
            namaNasabah: '',
            noWhatsapp: '',
            petugasName: prev.petugasName, // Keep petugas name
            bankSampah: prev.bankSampah, // Keep bank sampah
            jenisSampah: '',
            satuan: '',
            hargaPerSatuan: 0,
            beratSampah: '',
            totalSaldo: 0,
            tanggalSetor: new Date().toISOString().split('T')[0],
            buktiFotos: [],
            buktiPreviews: []
        }));
        setNasabahSearchQuery(''); // Reset autocomplete search
        setIsEditMode(false);
        setEditingId(null);
        setLastSavedData(null);
    };

    // Send deposit proof to WhatsApp
    const sendToWhatsApp = (data: typeof lastSavedData) => {
        if (!data || !data.phone) {
            showStandaloneToast('warning', 'Nomor WhatsApp Kosong', 'Mohon isi nomor WhatsApp nasabah!');
            return;
        }

        // Clean phone number (remove spaces, dashes, etc)
        let phone = data.phone.replace(/[\s\-()]/g, '');

        // Convert to international format if starts with 0
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        }
        // Add 62 if doesn't start with +62 or 62
        if (!phone.startsWith('62') && !phone.startsWith('+62')) {
            phone = '62' + phone;
        }
        // Remove + if present
        phone = phone.replace('+', '');

        // Format the message with bullet points
        const message = `*BUKTI PENYETORAN OSKU*

• ID Penyetoran: ${data.idPenyetoran}
• Nama: ${data.name}
• Jenis Sampah: ${data.type}
• Berat: ${data.weight} ${data.unit}
• Total Saldo: Rp ${data.total.toLocaleString('id-ID')}
• Tanggal: ${data.date}
• Bank Sampah: ${data.bankSampah}

Penyetoran berhasil tercatat!
Terima kasih telah menyetor sampah.

_Pesan ini dikirim otomatis dari sistem OSKU_`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp
        const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        window.open(waUrl, '_blank');

        showStandaloneToast('success', 'WhatsApp Dibuka', 'Silakan kirim pesan ke nasabah.');
    };

    // Handle submit (create or update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.namaNasabah || !formData.jenisSampah || !formData.beratSampah) {
            showStandaloneToast('warning', 'Form Belum Lengkap', 'Mohon lengkapi semua field yang diperlukan!');
            return;
        }

        // Find selected nasabah to get ID
        const selectedNasabah = nasabahList.find(n => n.name === formData.namaNasabah);
        // Find selected waste type to get ID
        const selectedWasteType = availableWasteTypes.find(wt => wt.nama === formData.jenisSampah);

        if (isEditMode && editingId !== null) {
            // Update existing transaction in database
            const editedItem = historyData.find(item => item.no === editingId);

            if (editedItem?.id) {
                const success = await updatePenyetoran(editedItem.id, {
                    berat: parseFloat(formData.beratSampah),
                    total_harga: formData.totalSaldo,
                    tanggal: new Date(formData.tanggalSetor).toISOString(),
                    catatan: null,
                });

                if (success) {
                    // Store WhatsApp data
                    const waData = formData.noWhatsapp ? {
                        show: true,
                        name: formData.namaNasabah,
                        phone: formData.noWhatsapp,
                        type: formData.jenisSampah,
                        weight: parseFloat(formData.beratSampah),
                        unit: formData.satuan.charAt(0).toUpperCase() + formData.satuan.slice(1),
                        total: formData.totalSaldo,
                        date: new Date(formData.tanggalSetor).toLocaleDateString('id-ID'),
                        bankSampah: formData.bankSampah,
                        idPenyetoran: editedItem?.idPenyetoran || ''
                    } : null;

                    showStandaloneToast('success', 'Berhasil Diupdate!', 'Data penyetoran berhasil diupdate.');
                    clearForm();

                    if (waData) {
                        setLastSavedData(waData);
                    }
                } else {
                    showStandaloneToast('error', 'Gagal Update', 'Terjadi kesalahan saat mengupdate data.');
                }
            }
        } else {
            if (!selectedNasabah) {
                showStandaloneToast('error', 'Nasabah Tidak Ditemukan', 'Mohon pilih nasabah dari daftar yang tersedia.');
                return;
            }

            if (!selectedWasteType) {
                showStandaloneToast('error', 'Jenis Sampah Invalid', 'Mohon pilih jenis sampah yang valid.');
                return;
            }

            console.log('🚀 Saving penyetoran:', {
                nasabah: selectedNasabah.name,
                wasteType: selectedWasteType.nama,
                data: formData
            });

            // Create new transaction in database
            const result = await addPenyetoran({
                nasabah_id: selectedNasabah.id,
                petugas_id: localStorage.getItem('petugasData') ? JSON.parse(localStorage.getItem('petugasData')!).id : null,
                bank_sampah_id: petugasBankId || null,
                jenis_sampah_id: selectedWasteType.id,
                berat: parseFloat(formData.beratSampah),
                total_harga: formData.totalSaldo,
                tanggal: new Date(formData.tanggalSetor).toISOString(),
                catatan: null,
                bukti_foto: formData.buktiPreviews.length > 0 ? formData.buktiPreviews : null,
            });

            if (result) {
                // Store WhatsApp data BEFORE clearForm
                const waData = formData.noWhatsapp ? {
                    show: true,
                    name: formData.namaNasabah,
                    phone: formData.noWhatsapp,
                    type: formData.jenisSampah,
                    weight: parseFloat(formData.beratSampah),
                    unit: formData.satuan.charAt(0).toUpperCase() + formData.satuan.slice(1),
                    total: formData.totalSaldo,
                    date: new Date(formData.tanggalSetor).toLocaleDateString('id-ID'),
                    bankSampah: formData.bankSampah,
                    idPenyetoran: result.id || ''
                } : null;

                showStandaloneToast('success', 'Berhasil Disimpan!', 'Data penyetoran berhasil disimpan ke database.');
                clearForm();

                // Refresh nasabah list to reflect updated saldo
                const updatedList = await getAllNasabah();
                setNasabahList(updatedList);

                if (waData) {
                    setLastSavedData(waData);
                }
            } else {
                showStandaloneToast('error', 'Gagal Simpan', 'Terjadi kesalahan saat menyimpan data.');
            }
        }
    };

    // Handle edit
    const handleEdit = (transaction: any) => {
        // Parse Indonesian date format "1/16/2026" to YYYY-MM-DD
        let isoDate = new Date().toISOString().split('T')[0]; // default to today

        const dateParts = transaction.date.split('/');
        if (dateParts.length === 3) {
            // Format is M/D/YYYY
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            isoDate = `${year}-${month}-${day}`;
        }

        // Find nasabah phone number for auto-fill
        const nasabah = nasabahList.find(n => n.name === transaction.name);

        setFormData({
            namaNasabah: transaction.name,
            noWhatsapp: nasabah?.phone || '',  // Auto-fill from nasabah data
            petugasName: '-',
            bankSampah: transaction.bankSampah,
            jenisSampah: transaction.type,
            satuan: transaction.unit.toLowerCase(),
            hargaPerSatuan: transaction.price,
            beratSampah: transaction.weight.toString(),
            totalSaldo: transaction.weight * transaction.price,
            tanggalSetor: isoDate,
            buktiFotos: [],
            buktiPreviews: transaction.buktiPreviews || [] // Load existing photos
        });
        setIsEditMode(true);
        setEditingId(transaction.no);
        // Scroll to form smoothly after state update
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Handle delete - opens confirmation modal
    const handleDelete = (item: any) => {
        setDeleteModal({ isOpen: true, itemId: item.no, itemName: item.name });
    };

    // Confirm delete - actually deletes the item from database
    // Confirm delete - actually deletes the item from database
    const confirmDelete = async () => {
        if (isDeleting) return; // Prevent double click

        if (deleteModal.itemId !== null) {
            setIsDeleting(true);
            try {
                const itemToDelete = historyData.find(item => item.no === deleteModal.itemId);
                if (itemToDelete?.id) {
                    const success = await deletePenyetoran(itemToDelete.id);
                    if (success) {
                        showStandaloneToast('success', 'Berhasil Dihapus', 'Data penyetoran berhasil dihapus.');
                    } else {
                        showStandaloneToast('error', 'Gagal Hapus', 'Terjadi kesalahan saat menghapus data.');
                    }
                }
            } catch (error) {
                showStandaloneToast('error', 'Error', 'Terjadi kesalahan sistem.');
            } finally {
                setIsDeleting(false);
                setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
            }
        } else {
            setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
        }
    };

    // Filter and search logic
    const filteredData = historyData.filter(item => {
        // Parse Indonesian date format (e.g., "1/16/2026")
        const dateParts = item.date.split('/');
        let itemYear = selectedYear;

        if (dateParts.length === 3) {
            // Format is M/D/YYYY
            itemYear = parseInt(dateParts[2]);
        }

        // Filter by year
        if (itemYear !== selectedYear) {
            console.log('🔍 Filtered out by year:', item.name, 'Year:', itemYear, 'Selected:', selectedYear);
            return false;
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query) ||
                item.bankSampah.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Calculate summary for display (no localStorage saving needed)
    const summary = {
        totalPemasukan: historyData.reduce((sum, item) => sum + (item.weight * item.price), 0),
        totalPenyetoran: historyData.length,
    };

    // Hitung highlights untuk carousel
    // Hitung highlights untuk carousel (Dynamic based on bank waste types)
    const wasteHighlights = availableWasteTypes.length > 0
        ? availableWasteTypes.map(wt => {
            // Normalize unit display to match HargaSampahPetugas
            const rawUnit = wt.satuan;
            const displayUnit = rawUnit === 'kg' ? 'Kg' : rawUnit === 'ltr' ? 'Ltr' : rawUnit === 'pcs' ? 'Pcs' : rawUnit.charAt(0).toUpperCase() + rawUnit.slice(1);

            const totalWeight = historyData
                .filter(h => h.type === wt.nama)
                .reduce((sum, h) => sum + (typeof h.weight === 'number' ? h.weight : parseFloat(h.weight)), 0);

            return {
                type: wt.nama,
                value: totalWeight,
                unit: displayUnit
            };
        })
        : [
            // Fallback only if no waste types loaded (shouldn't happen typically)
            { type: 'Belum ada jenis sampah', value: 0, unit: '-' }
        ];

    const totalPemasukan = historyData.reduce((sum, item) => sum + (item.weight * item.price), 0);

    const nextHighlight = () => setHighlightIndex((prev) => (prev + 1) % wasteHighlights.length);
    const prevHighlight = () => setHighlightIndex((prev) => (prev - 1 + wasteHighlights.length) % wasteHighlights.length);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image src="/icon/LogoPenyetoran.svg" alt="Penyetoran" width={24} height={24} className="filter-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Penyetoran</h1>
                </div>
            </div>

            {/* Summary Stats Cards - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Pemasukan */}
                <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-tertiary flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <Image src="/icon/miniMoney.svg" alt="Income" width={20} height={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pemasukan</p>
                        <p className="text-xl font-bold text-primary">Rp. {totalPemasukan.toLocaleString('id-ID')}</p>
                    </div>
                </div>

                {/* Total Penyetoran */}
                <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <Image src="/icon/LogoPenyetoran.svg" alt="Total" width={20} height={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total penyetoran</p>
                        <p className="text-xl font-bold text-primary">{historyData.length}</p>
                    </div>
                </div>

                {/* Waste Highlight Carousel */}
                <div className="lg:col-span-2 bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex items-center justify-between group">
                    <button onClick={prevHighlight} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-5xl font-bold text-primary">{wasteHighlights[highlightIndex].value}</span>
                            <span className="text-xl font-bold text-primary opacity-60">{wasteHighlights[highlightIndex].unit}</span>
                        </div>
                        <p className="text-xl font-bold text-primary mt-2">{wasteHighlights[highlightIndex].type}</p>
                    </div>
                    <button onClick={nextHighlight} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer">
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            {/* Histori Penyetoran section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-primary-light">Histori Penyetoran Nasabah</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari nasabah, jenis sampah..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl bg-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        </div>

                        {/* Export CSV */}
                        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer">
                            Export CSV
                        </button>

                        {/* Year Picker */}
                        <YearPicker
                            selectedYear={selectedYear}
                            onYearChange={setSelectedYear}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[1200px]">
                            <thead className="bg-primary text-white font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-12">No</th>
                                    <th className="px-4 py-3">ID Penyetoran</th>
                                    <th className="px-4 py-3">Nama Nasabah</th>
                                    <th className="px-4 py-3">Lokasi Bank Sampah</th>
                                    <th className="px-4 py-3">Jenis</th>
                                    <th className="px-4 py-3 text-center">Tanggal</th>
                                    <th className="px-4 py-3 text-center">Berat</th>
                                    <th className="px-4 py-3 text-center">Saldo</th>
                                    <th className="px-4 py-3 text-center">Bukti</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredData.length > 0 ? (
                                    filteredData.map((item, index) => (
                                        <tr key={item.no} className="hover:bg-tertiary/30 transition-colors group text-xs">
                                            <td className="px-4 py-3 text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-4 py-3 text-gray-600 font-medium">{item.idPenyetoran}</td>
                                            <td className="px-4 py-3 font-bold text-primary">{item.name}</td>
                                            <td className="px-4 py-3 text-gray-600 font-medium">{item.bankSampah}</td>
                                            <td className="px-4 py-3 text-gray-400 font-medium">{item.type}</td>
                                            <td className="px-4 py-3 text-center text-gray-400 font-medium">{item.date}</td>
                                            <td className="px-4 py-3 text-center font-bold text-primary">{item.weight} {item.unit}</td>
                                            <td className="px-4 py-3 text-center font-bold text-green-600">Rp {(item.weight * item.price).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (item.buktiPreviews && item.buktiPreviews.length > 0) {
                                                            setImageViewer({ isOpen: true, images: item.buktiPreviews, title: `Bukti Penyetoran - ${item.name}` });
                                                        } else {
                                                            showStandaloneToast('info', 'Belum Ada Foto', 'Belum ada foto bukti untuk penyetoran ini.');
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all group-hover:shadow-md ${item.buktiPreviews && item.buktiPreviews.length > 0 ? 'bg-tertiary hover:bg-primary hover:text-white text-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    title={item.buktiPreviews && item.buktiPreviews.length > 1 ? `${item.buktiPreviews.length} foto tersedia` : ''}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                    Lihat
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-4">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                                    >

                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                                    >

                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-8 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <i className="fas fa-search text-4xl opacity-20"></i>
                                                <p className="font-medium">Tidak ada data ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination - Only show if data >= 10 */}
                {filteredData.length >= 10 && (
                    <div className="flex justify-center items-center gap-3 pt-2">
                        <button className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm active:scale-90 cursor-pointer">
                            <i className="fas fa-chevron-left text-[10px]"></i>
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center">1</button>
                            <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-400 text-xs font-bold flex items-center justify-center hover:bg-gray-50 cursor-pointer">2</button>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm active:scale-90 cursor-pointer">
                            <i className="fas fa-chevron-right text-[10px]"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Form Penyetoran Sampah section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-primary-light">Form Penyetoran Sampah</h2>
                {/* Sticky Edit Mode Alert */}
                {isEditMode && (
                    <div className="sticky top-24 z-40 mb-4 animate-in slide-in-from-top duration-300">
                        <div className="px-6 py-4 bg-white border-2 border-primary rounded-2xl shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                    <i className="fas fa-edit text-primary"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary">Mode Edit Aktif</p>
                                    <p className="text-xs text-primary">Sedang mengedit data penyetoran. Scroll ke bawah untuk melihat form.</p>
                                </div>
                            </div>
                            <button
                                onClick={clearForm}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                            >
                                <i className="fas fa-times mr-1"></i>
                                Batal Edit
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-300">

                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                        {/* Nama Nasabah - Searchable Autocomplete */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Nama Nasabah</label>
                            <div className="md:col-span-2 relative">
                                <div className="relative">
                                    <input
                                        ref={nasabahInputRef}
                                        type="text"
                                        placeholder="Ketik nama nasabah..."
                                        value={nasabahSearchQuery || formData.namaNasabah}
                                        onChange={(e) => {
                                            setNasabahSearchQuery(e.target.value);
                                            setShowNasabahDropdown(true);
                                            // Clear selection if user is typing
                                            if (formData.namaNasabah && e.target.value !== formData.namaNasabah) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    namaNasabah: '',
                                                    noWhatsapp: ''
                                                }));
                                            }
                                        }}
                                        onFocus={() => setShowNasabahDropdown(true)}
                                        onBlur={() => {
                                            // Delay to allow click on dropdown item
                                            setTimeout(() => setShowNasabahDropdown(false), 200);
                                        }}
                                        className="w-full px-6 py-3 pr-10 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {formData.namaNasabah ? (
                                            <i className="fas fa-check-circle text-primary"></i>
                                        ) : (
                                            <i className="fas fa-search text-gray-400"></i>
                                        )}
                                    </div>
                                </div>

                                {/* Dropdown Results */}
                                {showNasabahDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                                        {nasabahList
                                            .filter(n =>
                                                n.name.toLowerCase().includes((nasabahSearchQuery || '').toLowerCase())
                                            )
                                            .slice(0, 10) // Limit to 10 results for performance
                                            .map((nasabah) => (
                                                <div
                                                    key={nasabah.id}
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            namaNasabah: nasabah.name,
                                                            noWhatsapp: nasabah.phone || ''
                                                        }));
                                                        setNasabahSearchQuery('');
                                                        setShowNasabahDropdown(false);
                                                    }}
                                                    className={`px-4 py-3 cursor-pointer hover:bg-tertiary/50 transition-colors flex items-center justify-between ${formData.namaNasabah === nasabah.name ? 'bg-tertiary' : ''
                                                        }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">{nasabah.name}</p>
                                                        {nasabah.phone && (
                                                            <p className="text-xs text-gray-400">{nasabah.phone}</p>
                                                        )}
                                                    </div>
                                                    {formData.namaNasabah === nasabah.name && (
                                                        <i className="fas fa-check text-primary"></i>
                                                    )}
                                                </div>
                                            ))
                                        }
                                        {nasabahList.filter(n =>
                                            n.name.toLowerCase().includes((nasabahSearchQuery || '').toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                                    <i className="fas fa-search mb-2 text-lg opacity-50"></i>
                                                    <p>Tidak ditemukan nasabah dengan nama "{nasabahSearchQuery}"</p>
                                                </div>
                                            )}
                                        {nasabahList.filter(n =>
                                            n.name.toLowerCase().includes((nasabahSearchQuery || '').toLowerCase())
                                        ).length > 10 && (
                                                <div className="px-4 py-2 text-center text-xs text-gray-400 border-t">
                                                    Menampilkan 10 dari {nasabahList.filter(n =>
                                                        n.name.toLowerCase().includes((nasabahSearchQuery || '').toLowerCase())
                                                    ).length} hasil. Ketik lebih spesifik untuk mempersempit pencarian.
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nomor WhatsApp - Auto-filled */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">
                                No. WhatsApp
                                <span className="text-xs text-gray-300 font-normal block">Untuk kirim bukti</span>
                            </label>
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <i className="fab fa-whatsapp text-green-500"></i>
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="08xxxxxxxxxx"
                                        value={formData.noWhatsapp}
                                        onChange={(e) => setFormData({ ...formData, noWhatsapp: e.target.value })}
                                        className="w-full pl-10 pr-6 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white"
                                    />
                                </div>
                                {formData.namaNasabah && formData.noWhatsapp && (
                                    <p className="text-xs text-green-600 mt-1">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        Nomor otomatis terisi dari data nasabah
                                    </p>
                                )}
                                {!formData.namaNasabah && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Pilih nasabah untuk auto-fill nomor WhatsApp
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Petugas (Auto) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Petugas</label>
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    value={formData.petugasName}
                                    disabled
                                    className="w-full px-6 py-3 rounded-2xl border border-gray-300 text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Bank Sampah (Auto from petugas) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Bank Sampah</label>
                            <div className="md:col-span-2">
                                <input
                                    type="text"
                                    value={formData.bankSampah}
                                    disabled
                                    className="w-full px-6 py-3 rounded-2xl border border-gray-300 text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Otomatis terdeteksi dari akun petugas
                                </p>
                            </div>
                        </div>

                        {/* Jenis Sampah - Dropdown */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Jenis Sampah</label>
                            <div className="md:col-span-2">
                                <select
                                    value={formData.jenisSampah}
                                    onChange={handleWasteTypeChange}
                                    className="w-full px-6 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white appearance-none cursor-pointer"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                >
                                    <option value="">Pilih jenis sampah</option>
                                    {availableWasteTypes.map((wt) => (
                                        <option key={wt.id} value={wt.nama}>
                                            {wt.nama} (Rp {wt.hargaPerSatuan.toLocaleString('id-ID')} / {wt.satuan})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Satuan & Harga (Auto-fill) */}
                        {formData.jenisSampah && (
                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                <label className="text-sm font-bold text-gray-400">Info Harga</label>
                                <div className="md:col-span-2 flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 block mb-1">Satuan</label>
                                        <input
                                            type="text"
                                            value={formData.satuan}
                                            disabled
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 block mb-1">Harga/Satuan</label>
                                        <input
                                            type="text"
                                            value={`Rp ${formData.hargaPerSatuan.toLocaleString('id-ID')}`}
                                            disabled
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-500 bg-gray-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Berat/Jumlah Sampah */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Berat/Jumlah</label>
                            <div className="md:col-span-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder={`Masukkan berat dalam ${formData.satuan === 'ltr' ? 'Ltr' : formData.satuan.charAt(0).toUpperCase() + formData.satuan.slice(1) || 'satuan'}`}
                                    value={formData.beratSampah}
                                    onChange={handleBeratChange}
                                    disabled={!formData.jenisSampah}
                                    className="w-full px-6 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Total Saldo (Auto-calculate) */}
                        {formData.beratSampah && formData.totalSaldo > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                <label className="text-sm font-bold text-gray-400">Total Saldo</label>
                                <div className="md:col-span-2">
                                    <div className="px-6 py-3 rounded-2xl border-2 border-primary/30 bg-tertiary/30 text-lg font-bold text-primary">
                                        Rp {formData.totalSaldo.toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tanggal Setor */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <label className="text-sm font-bold text-gray-400">Tanggal Setor</label>
                            <div className="md:col-span-2 relative max-w-sm">
                                <input
                                    type="date"
                                    value={formData.tanggalSetor}
                                    onChange={(e) => setFormData({ ...formData, tanggalSetor: e.target.value })}
                                    className="w-full px-6 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-medium text-gray-600 bg-white"
                                />
                            </div>
                        </div>

                        {/* Upload Bukti */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
                            <label className="text-sm font-bold text-gray-400 mt-3">Upload Bukti</label>
                            <div className="md:col-span-2 space-y-4">
                                {/* Drag & Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-tertiary/10 transition-all relative"
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handlePhotoUpload(e.target.files)}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-16 h-16 bg-tertiary/50 rounded-2xl flex items-center justify-center pointer-events-none">
                                        <Image src="/icon/upload.svg" alt="Upload" width={32} height={32} />
                                    </div>
                                    <div className="text-center pointer-events-none">
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            Seret & lepaskan gambar Anda di sini atau <span className="text-primary font-bold">Pilih file</span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Max 4 photos • 5MB per file
                                        </p>
                                    </div>
                                </div>

                                {/* Uploaded Files List */}
                                {formData.buktiPreviews.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-600">Uploaded Files</h4>
                                            <span className="text-xs text-primary font-medium">{formData.buktiPreviews.length}/4 photos</span>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.buktiPreviews.map((preview, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 group hover:border-primary/30 transition-all"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="w-12 h-12 bg-tertiary/30 rounded-lg flex-shrink-0 overflow-hidden">
                                                        <img
                                                            src={preview}
                                                            alt={`Bukti ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    {/* File Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-700 truncate">
                                                            {formData.buktiFotos[index]?.name || `bukti-${index + 1}.jpg`}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {(formData.buktiFotos[index]?.size / 1024).toFixed(0)} KB
                                                        </p>
                                                    </div>

                                                    {/* Success Icon */}
                                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                        <i className="fas fa-check text-white text-xs"></i>
                                                    </div>

                                                    {/* Delete Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                    >
                                                        <i className="fas fa-trash-alt text-warning text-sm"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-6">
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                                >
                                    Batal
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-12 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
                            >
                                {isEditMode ? 'Update Data' : 'Kirim'}
                            </button>
                        </div>
                    </form>

                    {/* WhatsApp Send Panel - Shows after successful save */}
                    {lastSavedData && lastSavedData.show && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <i className="fab fa-whatsapp text-2xl text-green-600"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-1">Data Berhasil Disimpan!</h4>
                                        <p className="text-sm text-green-700 mb-2">
                                            Kirim bukti penyetoran ke WhatsApp <span className="font-bold">{lastSavedData.name}</span>?
                                        </p>
                                        <div className="text-xs text-green-600 space-y-1">
                                            <p><i className="fas fa-hashtag mr-1"></i>ID: {lastSavedData.idPenyetoran}</p>
                                            <p><i className="fas fa-phone mr-1"></i>{lastSavedData.phone}</p>
                                            <p><i className="fas fa-money-bill mr-1"></i>Rp {lastSavedData.total.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => sendToWhatsApp(lastSavedData)}
                                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <i className="fab fa-whatsapp"></i>
                                        Kirim ke WhatsApp
                                    </button>
                                    <button
                                        onClick={() => setLastSavedData(null)}
                                        className="px-6 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-all"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Viewer Modal */}
            {imageViewer.isOpen && (
                <ImageViewerModal
                    images={imageViewer.images}
                    title={imageViewer.title}
                    onClose={() => setImageViewer({ isOpen: false, images: [], title: '' })}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                        <div className="text-center space-y-2 mb-8">
                            <p className="text-gray-600 font-medium">Apakah Anda yakin ingin menghapus</p>
                            <p className="text-primary font-bold text-lg">"Penyetoran {deleteModal.itemName}"?</p>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-10 py-3 border-2 border-primary text-primary font-bold rounded-full hover:bg-tertiary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : 'Hapus'}
                            </button>
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, itemId: null, itemName: '' })}
                                disabled={isDeleting}
                                className="px-10 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tidak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
