import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import BackToTop from "@/components/shared/BackToTop";

export default function TataCara() {
    const steps = [
        {
            id: 1,
            title: "Pilih Menu",
            description: "Buka halaman website OSKU, masuk ke halaman lokasi dan lihat lokasi bank sampah terdekat anda",
            image: "/images/lokasiBSLand.png",
            alt: "Pilih Menu",
        },
        {
            id: 2,
            title: "Pendaftaran Nasabah",
            description: "Jika ingin memndaftar sebagai nasabah OSKU, anda dapat memilih pendaftaran nasabah atau daftar maka anda akan diarahkan kehalaman pendaftaran nasabah.",
            image: "/images/Hero1.png",
            alt: "Pendaftaran Nasabah",
        },
        {
            id: 3,
            title: "Mengisi Data Pada Form Registrasi",
            description: "Isi formulir registrasi dengan Nama Lengkap, Email, Nomor Handphone, NIK, dan Password. Pastikan data yang anda masukkan valid dan sesuai dengan data diri anda.",
            image: "/images/Halaman_registrasi1.png",
            alt: "Form Registrasi",
        },
        {
            id: 4,
            title: "Melengkapi Data Diri Anda",
            description: "Lengkapi data domisili anda dengan alamat domisili yang valid.",
            image: "/images/Domisili.png",
            alt: "Lengkapi Data",
        },
        {
            id: 5,
            title: "Pilih Bank Sampah",
            description: "Setelah mengisi data diri anda, anda diminta memilih bank sampah terdekat anda.",
            image: "/images/lokasiPilihanterdekat.png",
            alt: "Pilih Bank Sampah",
        },
        {
            id: 6,
            title: "Masukkan OTP",
            description: "Masukkan OTP yang telah dikirim ke email anda.",
            image: "/images/OTP.png",
            alt: "OTP",
        },
        {
            id: 7,
            title: "Mengatur Profil",
            description: "Anda dapat mengatur profil anda dihalaman dashboard jika terdapat kesalahan pada data diri anda.",
            image: "/images/profile1.png",
            alt: "Mengatur Profil",
        },
        {
            id: 8,
            title: "Mencairkan Saldo",
            description: "Setelah berhasil menyetor sampah anda, anda akan mendapatkan saldo yang sesuai dengan sampah yang anda setorkan. nah dari saldo tersebut anda dapat menarik saldo tersebut setiap 12 bulan sekali.namun dengan mengajukan pengajuan pencairan saldo terlebih dahulu dan ikuti alurnya.",
            image: "/images/PengajuanPencairan.png", // Contextual guess
            alt: "Mencairkan Saldo",
        },
        {
            id: 9,
            title: "Melakukan Penyetoran Sampah",
            description: "Setelah berhasil mendaftar, anda akan diarahkan kehalaman dashboard dan untuk memulai penyetoran sampah, anda dapat mengklik menu penyetoran sampah dan pahami alur nya.",
            image: "/images/penyetoran.png",
            alt: "Penyetoran",
        },
        {
            id: 10,
            title: "Melihat Berita",
            description: "Untuk mendapatkan informasi terbaru, Anda dapat melihat berita melalui halaman dashboard atau tombol notifikasi.",
            image: "/images/Berita.png",
            alt: "Melihat Berita",
        },
    ];

    return (
        <div className="font-sans antialiased text-gray-900 bg-white">
            <Navbar />

            <main className="pt-32 pb-16 bg-white min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    {/* Page Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-[40px] font-extrabold text-primary mb-4">Tata Cara</h1>
                        <p className="text-[16px] text-primary">Panduan lengkap menggunakan layanan Bank Sampah OSKU</p>
                    </div>

                    <div className="space-y-24">
                        {steps.map((step) => (
                            <div key={step.id} className="flex flex-col items-center">
                                {/* Number Indicator */}
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                                    {step.id}
                                </div>

                                {/* Text Content */}
                                <div className="text-center mb-8 max-w-2xl">
                                    <h2 className="text-[24px] font-bold text-primary mb-3">{step.title}</h2>
                                    <p className="text-[16px] text-primary leading-relaxed">{step.description}</p>
                                </div>

                                {/* Image */}
                                <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 transform hover:scale-[1.01] transition-transform duration-300">
                                    <div className="relative aspect-video w-full">
                                        {/* Use object-contain to show the full screenshot without cropping, or cover for cleaner look. Screenshots usually need contain or formatting padding. Using generic width/height for now. */}
                                        <Image
                                            src={step.image}
                                            alt={step.alt}
                                            width={800}
                                            height={450}
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Connector Line (except for last item) */}
                                {step.id !== steps.length && (
                                    <div className="w-1 h-16 bg-gray-200 mt-12 rounded-full"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
            <BackToTop />
        </div>
    );
}
