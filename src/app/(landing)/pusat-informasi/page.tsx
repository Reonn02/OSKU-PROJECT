import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Calculator from "@/components/Calculator";
import BeritaSection from "@/components/BeritaSection";
import Image from "next/image";

export default function PusatInformasi() {
    return (
        <div className="font-sans antialiased text-gray-900 bg-white">
            <Navbar />

            <main>
                {/* Hero Section with Contact Info */}
                <section className="pt-32 pb-60">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Left Side - Content */}
                            <div className="space-y-6">
                                {/* Small Label */}


                                {/* Headline */}
                                <h1 className="text-4xl md:text-5xl font-extrabold text-primary leading-tight">
                                    Pusat Informasi Mengenai Bank Sampah OSKU
                                </h1>
                                <p className="text-sm text-primary font-medium">Ada kendala terkait Bank Sampah?</p>

                                {/* WhatsApp Contact */}
                                <div className="flex items-center gap-3 text-primary">
                                    <i className="fas fa-phone text-primary text-xl"></i>
                                    <p className="text-base">
                                        No HP Helpdesk (Whatsapp): <span className="font-bold">085212436339</span>
                                    </p>
                                </div>

                                {/* Operational Hours */}
                                <div className="flex items-center gap-3 text-primary">
                                    <i className="far fa-clock text-primary text-xl"></i>
                                    <p className="text-base">
                                        Senin s.d Jumat Pkl. 08.00 - 16: 30 WIB
                                    </p>
                                </div>
                            </div>

                            {/* Right Side - Illustration */}
                            <div className="flex justify-center ">
                                <Image
                                    src="/images/OskuAdminImage.svg"
                                    alt="Customer Support Illustration"
                                    width={500}
                                    height={500}
                                    className="object-contain w-full max-w-sm md:max-w-lg"
                                />
                            </div>
                        </div>
                    </div>
                </section>



                {/* Calculator Section */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Berapa Potensi Penghasilan saya?</h2>
                                <p className="text-gray-600 mb-8">Lihat potensi penghasilan anda selama sebulan</p>

                                <div className="relative flex justify-center md:justify-start">
                                    <Image
                                        src="/images/imageBingung.svg"
                                        alt="Ilustrasi menghitung potensi penghasilan"
                                        width={400}
                                        height={400}
                                        className="w-full max-w-xs md:max-w-md object-contain"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center md:justify-end">
                                <Calculator />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Withdrawal Section */}
                <section className="py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1">
                                <div className="bg-white border-2 border-gray-100 rounded-3xl p-12 text-center shadow-sm max-w-sm mx-auto">
                                    <i className="far fa-calendar-alt text-5xl text-primary mb-6"></i>
                                    <h3 className="text-2xl font-bold text-primary mb-2">12 bulan sekali</h3>
                                    <p className="text-gray-500 text-sm">anda dapat menarik saldo setiap 12 bulan sekali</p>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-4 ">Penarikan Saldo</h2>


                                <div className="bg-primary rounded-3xl p-10 text-white relative overflow-hidden">
                                    <p className="relative z-10 leading-relaxed text-lg">
                                        Penarikan saldo dapat dilakukan sesuai periode yang telah ditentukan oleh bank sampah untuk memastikan pengelolaan dana yang lebih teratur dan transparan. Setiap nasabah dapat mengajukan penarikan setelah memenuhi batas waktu penarikan, yaitu setiap 12 bulan sekali, sesuai dengan akumulasi saldo yang telah terkumpul dari setoran sampah. Dengan sistem ini, proses pencairan menjadi lebih terjadwal, aman, dan mudah dipantau oleh pengguna.
                                    </p>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* News Section - Dynamic from BeritaContext */}
                <BeritaSection />
            </main>

            <Footer />
        </div>
    );
}
