/**
 * OTP utility functions for OTP generation and verification
 */

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email via backend API
 * Falls back to development mode (console log) if email is not configured
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (response.ok) {
            // Email sent successfully via API
            console.log('✅ OTP berhasil dikirim ke email:', email);

            // Store OTP in sessionStorage for verification
            sessionStorage.setItem('otp', otp);
            sessionStorage.setItem('otpEmail', email);
            sessionStorage.setItem('otpTimestamp', Date.now().toString());

            return true;
        } else {
            // API failed - use development fallback mode
            console.warn('⚠️ Email API gagal, menggunakan development mode');
            console.warn('Error:', data.message);
            if (data.error) console.error('Detailed Error:', data.error); // Show real error details

            // Fall back to development mode
            return sendOTPDevelopmentMode(email, otp);
        }
    } catch (error) {
        console.warn('⚠️ Koneksi ke email API gagal, menggunakan development mode');
        console.error('Error:', error);

        // Fall back to development mode
        return sendOTPDevelopmentMode(email, otp);
    }
};

/**
 * Development mode - OTP displayed in console instead of sending email
 * This allows testing the OTP flow without email configuration
 */
const sendOTPDevelopmentMode = async (email: string, otp: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #378142; font-weight: bold');
    console.log('%c🔐 DEVELOPMENT MODE - OTP CODE', 'color: #378142; font-size: 16px; font-weight: bold');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #378142; font-weight: bold');
    console.log('%cEmail:', 'color: #666; font-weight: bold', email);
    console.log('%cKode OTP:', 'color: #d32f2f; font-size: 20px; font-weight: bold', otp);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #378142; font-weight: bold');
    console.log('%c⚠️ Email belum dikonfigurasi!', 'color: #ff9800; font-weight: bold');
    console.log('%cUntuk mengirim email yang sebenarnya:', 'color: #666');
    console.log('%c1. Buat file .env.local di root project', 'color: #666');
    console.log('%c2. Tambahkan SMTP credentials (lihat EMAIL_SETUP.md)', 'color: #666');
    console.log('%c3. Restart development server', 'color: #666');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #378142; font-weight: bold');

    // Store OTP in sessionStorage for verification
    sessionStorage.setItem('otp', otp);
    sessionStorage.setItem('otpEmail', email);
    sessionStorage.setItem('otpTimestamp', Date.now().toString());
    sessionStorage.setItem('otpMode', 'development');

    return true;
};

/**
 * Verify if the entered OTP matches the stored OTP
 */
export const verifyOTP = (userOTP: string): boolean => {
    const storedOTP = sessionStorage.getItem('otp');
    const timestamp = sessionStorage.getItem('otpTimestamp');

    if (!storedOTP || !timestamp) {
        return false;
    }

    // Check if OTP is expired (5 minutes)
    const otpAge = Date.now() - parseInt(timestamp);
    const fiveMinutes = 5 * 60 * 1000;

    if (otpAge > fiveMinutes) {
        sessionStorage.removeItem('otp');
        sessionStorage.removeItem('otpTimestamp');
        return false;
    }

    return userOTP === storedOTP;
};

/**
 * Clear OTP from storage
 */
export const clearOTP = (): void => {
    sessionStorage.removeItem('otp');
    sessionStorage.removeItem('otpEmail');
    sessionStorage.removeItem('otpTimestamp');
};

/**
 * Mask email address for display (e.g., "j***@example.com")
 */
export const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');

    if (!domain) return email;

    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }

    return `${localPart[0]}${'*'.repeat(localPart.length - 1)}@${domain}`;
};

/**
 * Resend OTP to the stored email
 */
export const resendOTP = async (): Promise<boolean> => {
    const email = sessionStorage.getItem('otpEmail');

    if (!email) {
        return false;
    }

    const newOTP = generateOTP();
    return await sendOTPEmail(email, newOTP);
};
