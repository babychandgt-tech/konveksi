import { Link } from "wouter";
import { ArrowRight, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl leading-none">
                V
              </div>
              <span className="font-bold text-2xl tracking-tight">
                Vanny Konveksi
              </span>
            </div>
            <p className="text-secondary-foreground/70 leading-relaxed text-balance">
              Pabrik garmen keluarga terpercaya di Indonesia. Melayani pembuatan seragam, kaos, dan jaket custom dengan kualitas jahitan premium dan harga jujur.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg font-serif">Layanan Kami</h4>
            <ul className="space-y-3">
              <li>
                <a href="#produk" className="text-secondary-foreground/70 hover:text-primary transition-colors">Pembuatan Kaos & Polo</a>
              </li>
              <li>
                <a href="#produk" className="text-secondary-foreground/70 hover:text-primary transition-colors">Seragam Kerja & Sekolah</a>
              </li>
              <li>
                <a href="#produk" className="text-secondary-foreground/70 hover:text-primary transition-colors">Jaket & Hoodie Custom</a>
              </li>
              <li>
                <a href="#layanan" className="text-secondary-foreground/70 hover:text-primary transition-colors">Sablon DTF & Plastisol</a>
              </li>
              <li>
                <a href="#layanan" className="text-secondary-foreground/70 hover:text-primary transition-colors">Bordir Komputer</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg font-serif">Hubungi Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/70 leading-relaxed">
                  Jl. Raya Konveksi No. 123,<br />
                  Kecamatan Sukamaju,<br />
                  Jawa Barat, Indonesia 40123
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/70">
                  +62 812 3456 7890
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/70">
                  Senin - Sabtu, 08:00 - 17:00
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg font-serif">Mulai Pesanan</h4>
            <p className="text-secondary-foreground/70">
              Punya desain sendiri atau butuh bantuan desain? Tim kami siap membantu mewujudkan produk Anda.
            </p>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full h-12 rounded-full font-semibold shadow-lg shadow-primary/20">
                Chat via WhatsApp <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>

        </div>

        <div className="pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/50">
          <p>© {new Date().getFullYear()} Vanny Konveksi. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
