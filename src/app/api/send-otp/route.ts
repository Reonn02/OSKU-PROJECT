import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * API Route for sending OTP emails
 * POST /api/send-otp
 */
export async function POST(request: NextRequest) {
    try {
        const { email, otp, type } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: 'Email dan OTP harus diisi' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Format email tidak valid' },
                { status: 400 }
            );
        }

        // Determine email content based on type
        const isForgotPassword = type === 'forgot-password';

        const emailSubject = isForgotPassword
            ? 'Reset Password OTP - OSKU'
            : 'Kode Verifikasi OTP - OSKU';

        const emailHeading = isForgotPassword
            ? 'Reset Password Anda'
            : 'Verifikasi Email Anda';

        const emailBodyText = isForgotPassword
            ? 'Kami menerima permintaan untuk mereset password akun OSKU Anda. Gunakan kode OTP berikut untuk melanjutkan proses reset password:'
            : 'Terima kasih telah mendaftar di OSKU. Gunakan kode OTP berikut untuk memverifikasi email Anda:';

        // Check if SMTP credentials are configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not configured in .env.local');
            console.warn('📧 Email will not be sent. Using development mode instead.');

            return NextResponse.json(
                {
                    success: false,
                    message: 'Email belum dikonfigurasi. Gunakan development mode (lihat console).',
                    developmentMode: true
                },
                { status: 503 } // Service Unavailable
            );
        }

        // Create transporter
        // IMPORTANT: Set up environment variables for email configuration
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // Your email address
                pass: process.env.SMTP_PASS?.replace(/\s+/g, ''), // Remove spaces from app password
            },
        });

        // Email options
        const mailOptions = {
            from: {
                name: 'OSKU - Olah Sampah Ku',
                address: process.env.SMTP_USER || 'noreply@osku.id',
            },
            to: email,
            subject: emailSubject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${emailSubject}</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .container {
                            background-color: #ffffff;
                            border-radius: 10px;
                            padding: 30px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #378142;
                        }
                        .logo {
                            color: #378142;
                            font-size: 28px;
                            font-weight: bold;
                            margin: 0;
                        }
                        .content {
                            padding: 30px 0;
                        }
                        .otp-box {
                            background: linear-gradient(135deg, #378142 0%, #38A169 100%);
                            color: white;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            text-align: center;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .info {
                            background-color: #F0FFF4;
                            border-left: 4px solid #378142;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            text-align: center;
                            padding-top: 20px;
                            border-top: 1px solid #e0e0e0;
                            color: #666;
                            font-size: 12px;
                        }
                        .warning {
                            color: #d32f2f;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 class="logo">OSKU</h1>
                            <p style="color: #666; margin: 5px 0;">Olah Sampah Ku</p>
                        </div>
                        
                        <div class="content">
                            <h2 style="color: #378142;">${emailHeading}</h2>
                            <p>${emailBodyText}</p>
                            
                            <div class="otp-box">${otp}</div>
                            
                            <div class="info">
                                <p style="margin: 0;"><strong>⏱️ Kode ini berlaku selama 5 menit</strong></p>
                                <p style="margin: 5px 0 0 0;">Jangan bagikan kode ini kepada siapa pun.</p>
                            </div>
                            
                            <p>Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
                            
                            <p class="warning">
                                <strong>Peringatan:</strong> OSKU tidak akan pernah meminta kode OTP Anda melalui telepon atau pesan.
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2025 OSKU - Olah Sampah Ku. All rights reserved.</p>
                            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
${emailSubject}

${emailBodyText}

Kode OTP: ${otp}

Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapa pun.

Jika Anda tidak melakukan permintaan ini, abaikan email ini.

PERINGATAN: OSKU tidak akan pernah meminta kode OTP Anda melalui telepon atau pesan.

© 2025 OSKU - Olah Sampah Ku
            `.trim(),
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            {
                success: true,
                message: 'OTP berhasil dikirim ke email',
                email: email // Return email for confirmation
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error sending OTP email:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Gagal mengirim OTP. Silakan coba lagi.',
                error: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: 500 }
        );
    }
}
