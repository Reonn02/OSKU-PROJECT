'use client';

import { useEffect, useState } from 'react';

interface ImageViewerModalProps {
    images: string[];  // Changed to support multiple images
    onClose: () => void;
    title?: string;
    initialIndex?: number;  // Optional: start at specific image
}

export default function ImageViewerModal({ images, onClose, title, initialIndex = 0 }: ImageViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Navigate to previous image
    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Navigate to next image
    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    // Close on ESC key, navigate with arrow keys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'ArrowRight') goToNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, images.length]);

    const hasMultipleImages = images.length > 1;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl max-h-[90vh] w-full animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {title && (
                    <div className="bg-white rounded-t-2xl px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-primary">{title}</h3>
                            {hasMultipleImages && (
                                <span className="px-3 py-1 bg-tertiary text-primary text-sm font-bold rounded-full">
                                    {currentIndex + 1} / {images.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            aria-label="Close"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>
                )}

                {/* Image Container with Navigation */}
                <div className={`relative bg-white ${title ? '' : 'rounded-2xl'} ${title ? 'rounded-b-2xl' : ''} p-4 flex items-center justify-center`}>
                    {/* Previous Button */}
                    {hasMultipleImages && (
                        <button
                            onClick={goToPrev}
                            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-all active:scale-95 z-10"
                            aria-label="Previous image"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                    )}

                    {/* Image */}
                    <img
                        src={images[currentIndex]}
                        alt={`Bukti Penyetoran ${currentIndex + 1}`}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    />

                    {/* Next Button */}
                    {hasMultipleImages && (
                        <button
                            onClick={goToNext}
                            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-all active:scale-95 z-10"
                            aria-label="Next image"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}
                </div>

                {/* Dot Indicators */}
                {hasMultipleImages && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-white scale-125'
                                        : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                aria-label={`Go to image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Close button (if no title) */}
                {!title && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                        aria-label="Close"
                    >
                        <i className="fas fa-times text-gray-800"></i>
                    </button>
                )}

                {/* Instructions */}
                <p className="text-center text-white/80 text-sm mt-4">
                    <i className="fas fa-info-circle mr-2"></i>
                    {hasMultipleImages
                        ? 'Gunakan tombol ◀ ▶ atau panah keyboard untuk navigasi. ESC untuk menutup.'
                        : 'Klik di luar gambar atau tekan ESC untuk menutup'
                    }
                </p>
            </div>
        </div>
    );
}
