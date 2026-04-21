import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Scissors, Shirt, Package, MessageSquare, PaintBucket, PenTool, CheckCircle, Clock, HeartHandshake, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="grain-overlay"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              variants={fadeIn}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Pabrik Garmen Terpercaya di Indonesia
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.1] mb-6">
                Jahitan Rapi. <span className="text-primary italic font-serif">Harga Jujur.</span> Selesai Tepat Waktu.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-xl">
                Kami adalah konveksi keluarga yang mendedikasikan diri untuk memproduksi kaos, seragam, dan jaket berkualitas tinggi. Dari pesanan lusinan hingga ribuan pcs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto rounded-full text-base h-14 px-8 shadow-lg shadow-primary/20">
                    Konsultasi Pesanan <MessageSquare className="ml-2 w-5 h-5" />
                  </Button>
                </a>
                <a href="#portofolio">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-base h-14 px-8 border-2">
                    Lihat Hasil Jahitan
                  </Button>
                </a>
              </div>
              
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Bahan Premium
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Tepat Waktu
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Garansi Kualitas
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-2xl">
                <img 
                  src="/images/hero-workshop.png" 
                  alt="Suasana workshop Vanny Konveksi" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <div className="bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 inline-block">
                    <p className="font-bold text-foreground text-lg">500+ Komunitas</p>
                    <p className="text-sm text-muted-foreground">Telah mempercayakan seragam mereka pada kami.</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-muted/50 border-y border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Mengapa Vanny Konveksi?</h2>
            <p className="text-muted-foreground text-lg">Bukan sekadar pabrik, kami adalah partner produksi yang peduli pada detail dan ketepatan waktu proyek Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Scissors className="w-8 h-8 text-primary" />,
                title: "Jahitan Presisi",
                desc: "Dikerjakan oleh penjahit berpengalaman. Kuat, rapi, dan awet bertahun-tahun."
              },
              {
                icon: <Clock className="w-8 h-8 text-primary" />,
                title: "Selesai Tepat Waktu",
                desc: "Kami memahami pentingnya deadline Anda. Kami berkomitmen mengirimkan pesanan sesuai jadwal."
              },
              {
                icon: <HeartHandshake className="w-8 h-8 text-primary" />,
                title: "Harga Jujur",
                desc: "Transparan sejak awal. Tanpa biaya tersembunyi, sesuai dengan kualitas bahan yang dipilih."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-primary" />,
                title: "Garansi Produk",
                desc: "Jika ada cacat produksi, kami perbaiki atau ganti baru. Kepuasan Anda prioritas kami."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeIn}
                className="bg-card p-8 rounded-2xl shadow-sm border border-card-border hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="layanan" className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              variants={fadeIn}
            >
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6 leading-tight">
                Layanan Produksi <span className="text-primary italic">End-to-End</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-balance">
                Dari lembaran kain hingga menjadi pakaian jadi. Kami menangani seluruh proses produksi di workshop kami sendiri untuk menjaga kualitas tetap konsisten.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Jahit & Pola (CMT)",
                    desc: "Pembuatan pola presisi dan proses jahit oleh tenaga ahli.",
                    icon: <Shirt className="w-6 h-6 text-primary" />
                  },
                  {
                    title: "Sablon Kualitas Tinggi",
                    desc: "Tersedia sablon Plastisol, Rubber, DTF, dan Sublimasi dengan tinta premium yang tahan lama.",
                    icon: <PaintBucket className="w-6 h-6 text-primary" />
                  },
                  {
                    title: "Bordir Komputer",
                    desc: "Hasil bordir detail, rapat, dan rapi menggunakan mesin bordir komputer modern.",
                    icon: <PenTool className="w-6 h-6 text-primary" />
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="shrink-0 mt-1">{item.icon}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 pt-12">
                <img src="/images/screen-printing.png" alt="Proses Sablon" className="rounded-2xl shadow-lg w-full aspect-[4/5] object-cover" />
              </div>
              <div className="space-y-4">
                <img src="/images/embroidered-jacket.png" alt="Hasil Bordir Komputer" className="rounded-2xl shadow-lg w-full aspect-[4/5] object-cover" />
                <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg">
                  <h4 className="font-bold text-2xl mb-2">Kapasitas Besar</h4>
                  <p className="opacity-90">Mampu memproduksi hingga 5.000+ pcs per bulan.</p>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="produk" className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold font-serif mb-6">Apa yang Kami Buat?</h2>
              <p className="text-secondary-foreground/70 text-lg">
                Melayani pembuatan berbagai jenis pakaian custom untuk kebutuhan promosi, identitas komunitas, hingga seragam operasional perusahaan.
              </p>
            </div>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-none">
                Minta Katalog Harga
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Kaos & Polo Shirt",
                desc: "Cotton Combed 24s/30s, Lacoste CVC. Cocok untuk event, promosi, dan seragam kasual.",
                img: "/images/folded-shirts.png"
              },
              {
                title: "Kemeja PDH/PDL",
                desc: "American Drill, Nagata Drill, Taipan. Standar seragam kantor, kampus, dan instansi.",
                img: "/images/tailor-tools.png" // using tailor tools as placeholder for workshop feel
              },
              {
                title: "Jaket & Hoodie",
                desc: "Fleece, Baby Terry, Taslan, Parasut. Jaket komunitas, bomber, varsity, dan hoodie custom.",
                img: "/images/hero-workshop.png" // workshop feel
              }
            ].map((prod, i) => (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeIn}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-secondary-foreground/5"
              >
                <img src={prod.img} alt={prod.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-3">{prod.title}</h3>
                  <p className="text-secondary-foreground/80 leading-relaxed mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {prod.desc}
                  </p>
                  <Button variant="outline" className="rounded-full border-secondary-foreground/20 hover:bg-white hover:text-secondary border text-white bg-transparent backdrop-blur-sm">
                    Lihat Detail
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO ORDER */}
      <section id="cara-pesan" className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">Cara Pemesanan</h2>
            <p className="text-muted-foreground text-lg">Proses pemesanan yang mudah, transparan, dan tanpa ribet.</p>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-12 left-20 right-20 h-0.5 bg-border z-0"></div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
              {[
                {
                  step: "01",
                  title: "Konsultasi",
                  desc: "Hubungi admin kami via WA. Diskusikan desain, bahan, jumlah, dan deadline."
                },
                {
                  step: "02",
                  title: "Estimasi & DP",
                  desc: "Kami berikan rincian harga. Jika sepakat, lakukan pembayaran DP (Down Payment)."
                },
                {
                  step: "03",
                  title: "Produksi",
                  desc: "Proses jahit, sablon/bordir dikerjakan. Kami akan update progress secara berkala."
                },
                {
                  step: "04",
                  title: "Pelunasan & Kirim",
                  desc: "Setelah pesanan selesai dan kualitas dicek (QC), lakukan pelunasan. Barang siap dikirim!"
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  variants={fadeIn}
                  className="relative flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-muted flex items-center justify-center text-2xl font-bold font-serif mb-6 group-hover:border-primary group-hover:text-primary transition-colors shadow-sm">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="rounded-full text-base h-14 px-8 shadow-lg shadow-primary/20">
                Mulai Konsultasi Sekarang <MessageSquare className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* PORTFOLIO CALLOUT */}
      <section id="portofolio" className="py-24 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-card rounded-3xl p-8 md:p-16 border border-card-border shadow-xl relative overflow-hidden">
            <div className="grain-overlay opacity-10"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold font-serif mb-6">Siap Membuat Seragam Kebanggaan Anda?</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Jangan ragu untuk bertanya. Kami melayani pesanan dari seluruh wilayah Indonesia menggunakan ekspedisi terpercaya.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-primary w-6 h-6" />
                    <span className="font-medium">Minimum order bersahabat (mulai dari 24 pcs)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-primary w-6 h-6" />
                    <span className="font-medium">Gratis ongkir untuk area tertentu*</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-primary w-6 h-6" />
                    <span className="font-medium">Sampel produksi tersedia untuk partai besar</span>
                  </div>
                </div>
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="w-full sm:w-auto rounded-full text-base h-14 px-10 shadow-lg">
                    Hubungi Admin Vanny
                  </Button>
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img src="/images/embroidered-jacket.png" alt="Bordir" className="rounded-2xl object-cover aspect-square shadow-md" />
                <img src="/images/screen-printing.png" alt="Sablon" className="rounded-2xl object-cover aspect-square shadow-md translate-y-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
