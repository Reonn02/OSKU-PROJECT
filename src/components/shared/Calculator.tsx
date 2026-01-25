'use client';

import { useState, useEffect } from 'react';

export default function Calculator() {
    const [botol, setBotol] = useState(0);
    const [kardus, setKardus] = useState(0);
    const [minyak, setMinyak] = useState(0);
    const [jerigen, setJerigen] = useState(0);
    const [total, setTotal] = useState(0);

    // Estimates (Rp)
    const PRICE_BOTOL = 3000; // per kg
    const PRICE_KARDUS = 4000; // per kg
    const PRICE_MINYAK = 5000; // per liter 
    const PRICE_JERIGEN = 5000; // per pcs

    useEffect(() => {
        const totalBotol = botol * PRICE_BOTOL;
        const totalKardus = kardus * PRICE_KARDUS;
        const totalMinyak = minyak * PRICE_MINYAK;
        const totalJerigen = jerigen * PRICE_JERIGEN;

        setTotal(totalBotol + totalKardus + totalMinyak + totalJerigen);
    }, [botol, kardus, minyak, jerigen]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount).replace('Rp', 'Rp. ');
    };

    return (
        <div className="bg-primary rounded-3xl p-8 text-white w-full max-w-lg shadow-xl relative overflow-hidden">
            <h3 className="text-2xl font-bold mb-8">Hitung Potensi Penghasilan Yang Anda Dapatkan</h3>

            <div className="space-y-6 relative z-10">
                {/* Botol Plastik */}
                <div>
                    <div className="flex justify-between mb-2 text-sm">
                        <span>Botol plastik</span>
                        <span>{botol} kg</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={botol}
                        onChange={(e) => setBotol(parseInt(e.target.value))}
                        className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-shiny-green"
                    />
                </div>

                {/* Kardus */}
                <div>
                    <div className="flex justify-between mb-2 text-sm">
                        <span>Kardus</span>
                        <span>{kardus} kg</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={kardus}
                        onChange={(e) => setKardus(parseInt(e.target.value))}
                        className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer accent-shiny-green"
                    />
                </div>

                {/* Minyak Jelantah */}
                <div>
                    <div className="flex justify-between mb-2 text-sm">
                        <span>Minyak Jelantah</span>
                        <span>{minyak} liter</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={minyak}
                        onChange={(e) => setMinyak(parseInt(e.target.value))}
                        className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer accent-shiny-green"
                    />
                </div>

                {/* Jerigen */}
                <div>
                    <div className="flex justify-between mb-2 text-sm">
                        <span>Jerigen</span>
                        <span>{jerigen} pcs</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={jerigen}
                        onChange={(e) => setJerigen(parseInt(e.target.value))}
                        className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer accent-shiny-green"
                    />
                </div>

                {/* Result Box */}
                {/* Result Box */}
                <div className="bg-[#5EB67C] rounded-xl p-6 mt-8 text-center backdrop-blur-sm">
                    <p className="text-sm mb-1 opacity-90 text-white">Potensi penghasilan bulanan</p>
                    <div className="text-4xl font-bold text-white">{formatCurrency(total)}</div>
                </div>
            </div>
        </div>
    );
}
