import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Layanan", href: "#layanan" },
    { name: "Produk", href: "#produk" },
    { name: "Cara Pesan", href: "#cara-pesan" },
    { name: "Portofolio", href: "#portofolio" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
        scrolled ? "bg-background/90 backdrop-blur-md border-border/50 shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg leading-none transition-transform group-hover:scale-105">
                V
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                Vanny Konveksi
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full font-semibold">
                Hubungi Kami <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-5">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a 
                  href={link.href} 
                  className="text-base font-medium text-foreground block p-2 hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full rounded-md font-semibold mt-2">
              WhatsApp Sekarang
            </Button>
          </a>
        </div>
      )}
    </header>
  );
}
