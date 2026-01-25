'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Toast types
type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// Single Toast Item Component
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    const getStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-white',
                    iconBg: 'bg-tertiary',
                    iconColor: 'text-primary',
                    icon: 'fa-check',
                    titleColor: 'text-primary'
                };
            case 'warning':
                return {
                    bg: 'bg-white',
                    iconBg: 'bg-yellow-light',
                    iconColor: 'text-dark-yellow',
                    icon: 'fa-exclamation-triangle',
                    titleColor: 'text-dark-yellow',
                    messageColor: 'text-dark-yellow/80'
                };
            case 'error':
                return {
                    bg: 'bg-white',
                    iconBg: 'bg-warning-light',
                    iconColor: 'text-warning',
                    icon: 'fa-times-circle',
                    titleColor: 'text-warning'
                };
            case 'info':
                return {
                    bg: 'bg-white',
                    iconBg: 'bg-tertiary',
                    iconColor: 'text-primary',
                    icon: 'fa-info-circle',
                    titleColor: 'text-primary'
                };
            default:
                return {
                    bg: 'bg-white',
                    iconBg: 'bg-tertiary',
                    iconColor: 'text-primary',
                    icon: 'fa-check',
                    titleColor: 'text-primary'
                };
        }
    };

    const styles = getStyles();

    return (
        <div className={`${styles.bg} rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-top fade-in duration-300 max-w-md w-full`}>
            <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mb-4`}>
                    <i className={`fas ${styles.icon} ${styles.iconColor} text-2xl`}></i>
                </div>
                <h3 className={`text-lg font-bold ${styles.titleColor} mb-1`}>{toast.title}</h3>
                {toast.message && (
                    <p className={`text-sm ${styles.messageColor || 'text-gray-500'}`}>{toast.message}</p>
                )}
            </div>
        </div>
    );
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        {toasts.map(toast => (
                            <ToastItem
                                key={toast.id}
                                toast={toast}
                                onClose={() => hideToast(toast.id)}
                            />
                        ))}
                    </div>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 pointer-events-auto -z-10"
                        onClick={() => toasts.forEach(t => hideToast(t.id))}
                    />
                </div>
            )}
        </ToastContext.Provider>
    );
}

// Standalone toast function for components that can't use context
// This creates a temporary DOM element for the toast
export function showStandaloneToast(type: ToastType, title: string, message?: string, duration: number = 3000) {
    // Create container if it doesn't exist
    let container = document.getElementById('standalone-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'standalone-toast-container';
        container.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none';
        document.body.appendChild(container);
    }

    // Get styles based on type
    const getStyles = () => {
        switch (type) {
            case 'success':
                return { bg: 'bg-white', iconBg: 'bg-tertiary', iconColor: 'text-primary', icon: 'fa-check', titleColor: 'text-primary', messageColor: 'text-gray-500' };
            case 'warning':
                return { bg: 'bg-white', iconBg: 'bg-yellow-light', iconColor: 'text-dark-yellow', icon: 'fa-exclamation-triangle', titleColor: 'text-dark-yellow', messageColor: 'text-dark-yellow/80' };
            case 'error':
                return { bg: 'bg-white', iconBg: 'bg-warning-light', iconColor: 'text-warning', icon: 'fa-times-circle', titleColor: 'text-warning', messageColor: 'text-gray-500' };
            case 'info':
            default:
                return { bg: 'bg-white', iconBg: 'bg-tertiary', iconColor: 'text-primary', icon: 'fa-info-circle', titleColor: 'text-primary', messageColor: 'text-gray-500' };
        }
    };

    const styles = getStyles();

    // Create toast element
    const toastWrapper = document.createElement('div');
    toastWrapper.className = 'pointer-events-auto';
    toastWrapper.innerHTML = `
        <div class="absolute inset-0 bg-black/20 pointer-events-auto" id="toast-backdrop"></div>
        <div class="${styles.bg} rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-top fade-in duration-300 max-w-md w-full relative z-10 pointer-events-auto">
            <div class="flex flex-col items-center text-center">
                <div class="w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mb-4">
                    <i class="fas ${styles.icon} ${styles.iconColor} text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold ${styles.titleColor} mb-1">${title}</h3>
                ${message ? `<p class="text-sm ${styles.messageColor}">${message}</p>` : ''}
            </div>
        </div>
    `;

    container.appendChild(toastWrapper);
    container.style.pointerEvents = 'auto';

    // Remove after duration
    const removeToast = () => {
        toastWrapper.remove();
        if (container && container.children.length === 0) {
            container.style.pointerEvents = 'none';
        }
    };

    // Click backdrop to close
    const backdrop = toastWrapper.querySelector('#toast-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', removeToast);
    }

    setTimeout(removeToast, duration);
}
