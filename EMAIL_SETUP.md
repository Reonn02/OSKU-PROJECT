# Email Configuration for OTP Sending
# Copy these variables to your .env.local file

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

# ====================================================================
# PANDUAN SETUP EMAIL:
# ====================================================================
# 
# 1. Buat file .env.local di root project (jika belum ada)
# 2. Copy variabel di atas ke .env.local
# 3. Isi dengan kredensial email Anda
#
# OPTION 1: Menggunakan Gmail (Recommended)
# ------------------------------------------
# 1. Login ke akun Gmail Anda
# 2. Aktifkan 2-Step Verification di:
#    https://myaccount.google.com/security
# 3. Generate App Password di:
#    https://myaccount.google.com/apppasswords
# 4. Pilih "Mail" dan "Windows Computer" (atau Other)
# 5. Copy password yang diberikan (16 karakter)
# 6. Paste ke SMTP_PASS di file .env.local
# 
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=xxxx-xxxx-xxxx-xxxx (App Password dari Gmail)
#
#
# OPTION 2: Menggunakan Outlook/Hotmail
# --------------------------------------
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password
#
#
# OPTION 3: Menggunakan Email Service Provider (Recommended untuk Production)
# ---------------------------------------------
# - SendGrid (https://sendgrid.com)
# - AWS SES (https://aws.amazon.com/ses)
# - Mailgun (https://mailgun.com)
# - Resend (https://resend.com)
