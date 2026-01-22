import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <div className="font-sans antialiased text-gray-900 bg-white">
            <Navbar />

            {/* Hero Section */}
            <header className="pt-24 pb-16 md:pt-32 md:pb-24 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl grid md:grid-cols-2 gap-12 items-center">
                    <div className="pl-4 md:pl-12">
                        <h1 className="text-[48px] font-extrabold leading-tight mb-4 text-primary">Layanan Transaksi Bank Sampah Online Kelurahan Ciracas</h1>
                        <p className="text-[16px] mb-8 text-primary">Kelola sampah Anda dengan mudah dan dapatkan manfaatnya bersama OSKU. Mari bersama-sama menciptakan lingkungan yang lebih bersih</p>
                        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                            <Link href="/register" className="bg-primary hover:bg-primary-dark text-white font-medium text-sm md:text-[16px] rounded-full transition duration-300 px-6 md:px-10 h-11 md:h-14 inline-flex items-center justify-center min-w-[140px] cursor-pointer">Pendaftaran nasabah</Link>
                            <Link href="/login" className="bg-primary hover:bg-primary-dark text-white font-medium text-sm md:text-[16px] rounded-full transition duration-300 px-6 md:px-10 h-11 md:h-14 inline-flex items-center justify-center min-w-[140px] cursor-pointer">Login</Link>
                            <Link href="/#about" className="bg-tertiary text-primary hover:bg-primary hover:text-white font-medium text-sm md:text-[16px] rounded-full transition duration-300 px-6 md:px-10 h-11 md:h-14 inline-flex items-center justify-center border border-tertiary hover:border-primary min-w-[140px] cursor-pointer">Kenali Kami</Link>
                            <Link href="/tata-cara" className="bg-tertiary text-primary hover:bg-primary hover:text-white font-medium text-sm md:text-[16px] rounded-full transition duration-300 px-6 md:px-10 h-11 md:h-14 inline-flex items-center justify-center border border-tertiary hover:border-primary min-w-[140px] cursor-pointer">Cara daftar</Link>
                        </div>
                    </div>
                    <div className="relative overflow-hidden px-4 md:px-0">
                        <div className="relative z-10 flex justify-center md:block">
                            <Image
                                src="/images/OskuHeroImage.svg"
                                alt="OSKU Mobile App"
                                width={600}
                                height={600}
                                className="rounded-lg w-full h-auto max-w-[400px] md:max-w-none md:w-full"
                                priority
                            />
                        </div>
                        <div className="absolute -top-8 -right-8 w-64 h-64 bg-white bg-opacity-20 rounded-full -z-10"></div>
                        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white bg-opacity-20 rounded-full -z-10"></div>
                    </div>
                </div>
            </header>

            {/* Siapa Pengguna OSKU? Section */}
            <section id="users" className="py-16 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-[40px] font-extrabold text-primary">Siapa Pengguna Osku ?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Card 1 */}
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-6">
                            <div>
                                <h3 className="text-[24px] font-bold text-primary mb-2">Ibu - Ibu</h3>
                                <p className="text-primary text-[16px] leading-relaxed">Membantu mengelola sampah rumah tangga</p>
                            </div>
                            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">

                                <img src="/images/IbuIbu.svg" alt="Ilustrasi Ibu - Ibu" className="relative w-28 h-28 object-contain" />
                            </div>
                        </div>
                        {/* Card 2 */}
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-6">
                            <div>
                                <h3 className="text-[24px] font-bold text-primary mb-2">Pedagang</h3>
                                <p className="text-primary text-[16px] leading-relaxed">Membantu mengelola sampah usaha UMKM sekitar</p>
                            </div>
                            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                                <img src="/images/Pedagang.svg" alt="Ilustrasi Pedagang" className="relative w-28 h-28 object-contain" />
                            </div>
                        </div>
                        {/* Card 3 */}
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-6">
                            <div>
                                <h3 className="text-[24px] font-bold text-primary mb-2">Warga</h3>
                                <p className="text-primary text-[16px] leading-relaxed">Membantu mengelola sampah Warga kelurahan Ciracas</p>
                            </div>
                            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                                <img src="/images/Warga.svg" alt="Ilustrasi Warga" className="relative w-28 h-28 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Kenali OSKU Section */}
            <section id="about" className="bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl grid md:grid-cols-2 gap-12 items-center py-16">
                    <div className="bg-primary-light p-12 rounded-xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-[40px] font-bold text-white mb-6">Osku.</div>
                            <p className="text-white text-opacity-90 mb-8">Platform digital inovatif untuk mengelola transaksi bank sampah secara online, memberikan kemudahan akses dan pengelolaan yang lebih baik bagi semua pengguna.</p>
                            <Link href="/pusat-informasi" className="border-2 border-white text-white hover:bg-white hover:text-primary hover:bg-opacity-10 font-medium py-4 px-6  rounded-full transition duration-300 cursor-pointer">Informasi Lebih Lanjut</Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <h2 className="text-[40px] font-extrabold text-primary mb-6">Kenali OSKU</h2>
                        <p className="text-primary-light mb-6">OSKU hadir sebagai solusi digital untuk memudahkan pengelolaan bank sampah di Kelurahan Ciracas. Dengan teknologi terkini, kami membantu mengubah cara pengelolaan sampah menjadi lebih efisien dan memberikan manfaat nyata bagi masyarakat.</p>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Menukar sampah menjadi saldo</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Mengelola tabungan bank sampah</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Ikut berperan aktif dalam menjaga lingkungan sekitar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tujuan Kami Section */}
            <section className="bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl grid md:grid-cols-2 gap-12 items-center py-16">
                    <div className="p-6">
                        <h2 className="text-[40px] font-extrabold text-primary mb-6">Tujuan Kami</h2>
                        <p className="text-primary-light mb-6">Kami berkomitmen untuk menciptakan lingkungan yang lebih bersih dan berkelanjutan melalui pengelolaan sampah yang bertanggung jawab. Dengan OSKU, kami ingin:</p>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Mengurangi jumlah sampah yang berakhir di TPA</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Meningkatkan kesadaran masyarakat akan pentingnya daur ulang</p>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <i className="fas fa-check text-white text-xs"></i>
                                    </div>
                                </div>
                                <p className="ml-3 text-primary-light">Memberikan manfaat ekonomi bagi masyarakat melalui pengelolaan sampah</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-primary-light p-12 rounded-xl text-white relative overflow-hidden h-full">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold mb-6">Visi</h3>
                            <p className="mb-6 text-white text-opacity-90">Menjadi platform digital terdepan dalam pengelolaan bank sampah yang memberikan manfaat berkelanjutan bagi masyarakat dan lingkungan.</p>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-3xl font-bold mb-2">200+</div>
                                    <p className="text-sm text-white text-opacity-80">Pengguna Aktif</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold mb-2">4+</div>
                                    <p className="text-sm text-white text-opacity-80">Bank Sampah</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold mb-2">10+</div>
                                    <p className="text-sm text-white text-opacity-80">RW</p>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold mb-2">10+</div>
                                    <p className="text-sm text-white text-opacity-80">RT</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mengapa Harus OSKU? Section */}
            <section id="why-us" className="bg-gray-50 py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-[40px] font-extrabold text-primary mb-4">Mengapa Harus OSKU?</h2>
                        <p className="text-primary max-w-2xl mx-auto">Kami memberikan solusi terbaik untuk pengelolaan bank sampah dengan berbagai keunggulan</p>

                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center h-[232px] w-full max-w-[308px] flex flex-col items-center justify-center border border-gray-100 mx-auto">
                            <div className="mb-6">
                                <img src="/icon/lightning.svg" alt="Cepat & Mudah" className="w-14 h-14" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-primary">Cepat & Mudah</h3>
                            <p className="text-primary text-sm leading-relaxed">Prosesnya simpel, cepat, dan nggak ribet digunakan</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center h-[232px] w-full max-w-[308px] flex flex-col items-center justify-center border border-gray-100 mx-auto">
                            <div className="mb-6">
                                <img src="/icon/Shield.svg" alt="Aman & Terpercaya" className="w-14 h-14" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-primary">Aman & Terpercaya</h3>
                            <p className="text-primary text-sm leading-relaxed">Data dan transaksi kamu dijaga dengan aman</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center h-[232px] w-full max-w-[308px] flex flex-col items-center justify-center border border-gray-100 mx-auto">
                            <div className="mb-6">
                                <img src="/icon/Money.svg" alt="Cuan Tambahan" className="w-14 h-14" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-primary">Cuan Tambahan</h3>
                            <p className="text-primary text-sm leading-relaxed">Penghasilan dari sampah yang kamu kumpulkan</p>
                        </div>
                        {/* Feature 4 */}
                        <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center h-[232px] w-full max-w-[308px] flex flex-col items-center justify-center border border-gray-100 mx-auto">
                            <div className="mb-6">
                                <img src="/icon/mdi_leaf.svg" alt="Ramah Lingkungan" className="w-14 h-14" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 text-primary">Ramah Lingkungan</h3>
                            <p className="text-primary text-sm leading-relaxed">Berkontribusi dalam menjaga kelestarian lingkungan</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Kolaborasi Section */}
            <section className="bg-primary-light py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <h2 className="text-4xl font-bold text-white text-center mb-4">Kolaborasi</h2>
                    <p className="text-white text-center mb-12 text-opacity-90">Website ini merupakan kolaborasi antara</p>
                    <div className="flex flex-wrap justify-center items-center gap-8">
                        {/* Card 1: Kelurahan Ciracas */}
                        <div className="bg-white rounded-2xl w-[212px] h-[212px] flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
                            <img src="/images/KelurahanCiracas.svg" alt="Kelurahan Ciracas" className="w-full h-full object-contain" />
                        </div>
                        {/* Card 2: Jakarta */}
                        <div className="bg-white rounded-2xl w-[212px] h-[212px] flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
                            <img src="/images/Logo Jakarta HP.svg" alt="Jakarta" className="w-full h-full object-contain" />
                        </div>
                        {/* Card 3: Aptikom */}
                        <div className="bg-white rounded-2xl w-[212px] h-[212px] flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
                            <img src="/images/LogoAptikomHP.svg" alt="Aptikom" className="w-full h-full object-contain" />
                        </div>
                        {/* Card 4: Gundar */}
                        <div className="bg-white rounded-2xl w-[212px] h-[212px] flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
                            <img src="/images/LogoGundarHP.svg" alt="Universitas Gunadarma" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="bg-white py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <div className="text-center mb-16">
                        <h2 className="text-[40px] font-extrabold text-primary mb-4">Sampah Yang Kami Kelola</h2>
                        <p className="text-primary max-w-2xl mx-auto">Ini merupakan daftar sampah yang kami terima pada bank sampah kami</p>

                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Waste Type 1 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full max-w-[296px] h-[328px] mx-auto flex flex-col">
                            <div className="h-[200px] bg-gray-100 flex items-center justify-center">
                                <img src="/images/smpBotol.svg" alt="Botol Plastik" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Botol Plastik</h3>
                                <p className="text-primary text-sm">Botol plastik bekas minuman dengan various sizes</p>
                            </div>
                        </div>
                        {/* Waste Type 2 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full max-w-[296px] h-[328px] mx-auto flex flex-col">
                            <div className="h-[200px] bg-gray-100 flex items-center justify-center">
                                <img src="/images/smpKardus.svg" alt="Kardus" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Kardus</h3>
                                <p className="text-primary text-sm">Kardus bekas pakai dalam kondisi kering dan bersih</p>
                            </div>
                        </div>
                        {/* Waste Type 3 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full max-w-[296px] h-[328px] mx-auto flex flex-col">
                            <div className="h-[200px] bg-gray-100 flex items-center justify-center">
                                <img src="/images/Jerigen.svg" alt="Jerigen" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Jerigen</h3>
                                <p className="text-primary text-sm">Jerigen yang sudah tidak dipakai bisa disetor satuan</p>
                            </div>
                        </div>
                        {/* Waste Type 4 */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full max-w-[296px] h-[328px] mx-auto flex flex-col">
                            <div className="h-[200px] bg-gray-100 flex items-center justify-center">
                                <img src="/images/smpMijel.svg" alt="Minyak Jelantah" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Minyak Jelantah</h3>
                                <p className="text-primary text-sm">Minyak goreng bekas setelah digunakan menggoreng</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-light py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
                    <h2 className="text-[40px] font-extrabold text-white mb-4">Tunggu Apalagi? Ayo Bergabung Dengan OSKU Sekarang!</h2>
                    <p className="text-white text-opacity-90 max-w-2xl mx-auto mb-8">Daftarkan diri Anda sekarang dan mulai kelola sampah dengan lebih baik sambil mendapatkan manfaatnya</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="bg-tertiary text-primary hover:bg-white font-medium py-2 px-6 rounded-full transition duration-300 cursor-pointer">Daftar Sekarang</Link>
                        <Link href="/tata-cara" className="border-2 border-tertiary text-tertiary hover:bg-white hover:text-primary font-medium py-2 px-6 rounded-full transition duration-300 cursor-pointer">Cara daftar</Link>
                    </div>
                </div>
            </section>

            <Footer />
            <BackToTop />
        </div>
    );
}
