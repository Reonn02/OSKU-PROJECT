import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BankSampahProvider } from "@/contexts/BankSampahContext";
import { BeritaProvider } from "@/contexts/BeritaContext";
import { BeritaKegiatanProvider } from "@/contexts/BeritaKegiatanContext";
import { WastePriceProvider } from "@/contexts/WastePriceContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { PetugasProvider } from "@/contexts/PetugasContext";
import { PenyetoranProvider } from "@/contexts/PenyetoranContext";
import { PencairanProvider } from "@/contexts/PencairanContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

const metropolis = localFont({
  src: [
    {
      path: "../../public/Font/Metropolis/Metropolis-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Font/Metropolis/Metropolis-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Font/Metropolis/Metropolis-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/Font/Metropolis/Metropolis-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-metropolis",
});

export const metadata: Metadata = {
  title: "OSKU - Layanan Bank Sampah Online",
  description: "Layanan Bank Sampah Online Kelurahan Ciracas",
  icons: {
    icon: "/icon/OskuFavIcon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet" />
      </head>
      <body
        className={`${metropolis.variable} font-sans antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            <BankSampahProvider>
              <BeritaProvider>
                <BeritaKegiatanProvider>
                  <WastePriceProvider>
                    <AdminProvider>
                      <PetugasProvider>
                        <PenyetoranProvider>
                          <PencairanProvider>
                            {children}
                          </PencairanProvider>
                        </PenyetoranProvider>
                      </PetugasProvider>
                    </AdminProvider>
                  </WastePriceProvider>
                </BeritaKegiatanProvider>
              </BeritaProvider>
            </BankSampahProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
