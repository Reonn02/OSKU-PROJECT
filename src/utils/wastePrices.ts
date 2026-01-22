/**
 * Waste Price Calculator Configuration
 * Used for auto-calculating estimated balance in penyetoran section
 */

export const WASTE_PRICES = {
    'Botol Plastik': 2000,  // per kg
    'Kardus': 4000,          // per kg
    'Minyak Jelantah': 5000, // per liter
    'Jerigen': 5000          // per pieces
} as const;

export type WasteType = keyof typeof WASTE_PRICES;

export function calculateWastePrice(type: WasteType | string, weight: number): number {
    const price = WASTE_PRICES[type as WasteType] || 0;
    return price * weight;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
}
