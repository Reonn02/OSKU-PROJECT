import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * API Route for sending reports with attachments
 * POST /api/send-report
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const emailPengirim = formData.get('emailPengirim') as string;
        const emailPenerima = formData.get('emailPenerima') as string;
        const pesan = formData.get('pesan') as string;
        const attachments = formData.getAll('lampiran') as File[];

        if (!emailPengirim || !emailPenerima || !pesan) {
            return NextResponse.json(
                { success: false, message: 'Form tidak lengkap' },
                { status: 400 }
            );
        }

        // Configure Mail Transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Convert Blob/File to Buffer for attachments
        const formattedAttachments = await Promise.all(
            attachments.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                return {
                    filename: file.name,
                    content: buffer,
                    contentType: file.type,
                };
            })
        );

        // Mail Options
        const mailOptions = {
            from: {
                name: 'OSKU - Laporan System',
                address: process.env.SMTP_USER || 'noreply@osku.id',
            },
            to: emailPenerima,
            replyTo: emailPengirim,
            subject: `Laporan Baru dari ${emailPengirim}`,
            text: `
Pesang dari: ${emailPengirim}

${pesan}

Disclaimer: Email ini dikirim melalui sistem pelaporan OSKU.
            `.trim(),
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #378142;">Laporan Baru</h2>
                    <p><strong>Dari:</strong> ${emailPengirim}</p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0;" />
                    <p style="white-space: pre-wrap;">${pesan}</p>
                    <br/>
                    <p style="color: #888; font-size: 12px;">Email ini dikirim melalui sistem pelaporan OSKU.</p>
                </div>
            `,
            attachments: formattedAttachments,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { success: true, message: 'Laporan berhasil dikirim' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error sending report:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengirim laporan', error: String(error) },
            { status: 500 }
        );
    }
}
