'use client';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    bankName: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, bankName }: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
                {/* Title */}
                <p className="text-primary text-base font-medium text-center mb-8 leading-relaxed">
                    Apakah Anda yakin ingin menghapus <strong className="text-primary">"{bankName}"</strong>?
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    {/* Hapus Button */}
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-6 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer "
                    >
                        Hapus
                    </button>

                    {/* Tidak Button */}
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-6 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-all duration-200 cursor-pointer "
                    >
                        Tidak
                    </button>
                </div>
            </div>
        </div>
    );
}
