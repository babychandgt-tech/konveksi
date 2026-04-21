import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, Scissors, LogOut, ShoppingBag, Clock, CheckCircle2, XCircle,
  PackageSearch, LayoutDashboard, User, Menu, ChevronRight, Bell,
  TrendingUp, CalendarClock, CircleDollarSign, Package,
  Store, Search, Tag, ImageIcon, X, ChevronLeft, Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Order {
  id: string;
  product: string;
  qty: number;
  total: number;
  status: "baru" | "produksi" | "selesai" | "batal";
  deadline: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  description: string | null;
  price: number;
  min_order: number;
  status: "aktif" | "tidak_aktif";
  sizes: string[] | null;
  size_prices: Record<string, number> | null;
  image_url: string | null;
  image_urls: string[] | null;
}

type Section = "beranda" | "katalog" | "pesanan" | "profil";

const menuItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "beranda", label: "Beranda", icon: LayoutDashboard },
  { id: "katalog", label: "Katalog Produk", icon: Store },
  { id: "pesanan", label: "Pesanan Saya", icon: ShoppingBag },
  { id: "profil", label: "Profil", icon: User },
];

const categoryColors: Record<string, string> = {
  Kaos:           "bg-teal-50 text-teal-700 border-teal-200",
  Polo:           "bg-cyan-50 text-cyan-700 border-cyan-200",
  Kemeja:         "bg-blue-50 text-blue-700 border-blue-200",
  "Baju Sekolah": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Olahraga:       "bg-rose-50 text-rose-700 border-rose-200",
  Seragam:        "bg-amber-50 text-amber-700 border-amber-200",
  Celana:         "bg-violet-50 text-violet-700 border-violet-200",
  Jaket:          "bg-orange-50 text-orange-700 border-orange-200",
  Rompi:          "bg-pink-50 text-pink-700 border-pink-200",
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    baru: "bg-teal-50 text-teal-700 border-teal-200",
    produksi: "bg-amber-50 text-amber-700 border-amber-200",
    selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
    batal: "bg-red-50 text-red-600 border-red-200",
  };
  const labels: Record<string, string> = { baru: "Baru", produksi: "Produksi", selesai: "Selesai", batal: "Batal" };
  return <Badge className={`rounded-full px-3 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "baru") return <Clock className="h-4 w-4 text-teal-600" />;
  if (status === "produksi") return <PackageSearch className="h-4 w-4 text-amber-600" />;
  if (status === "selesai") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function ProgressBar({ status }: { status: string }) {
  const pct = { baru: 10, produksi: 55, selesai: 100, batal: 0 }[status] ?? 0;
  const color = { baru: "bg-teal-500", produksi: "bg-amber-500", selesai: "bg-emerald-500", batal: "bg-red-400" }[status] ?? "bg-gray-300";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CustomerPortal() {
  const { profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("beranda");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("semua");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .ilike("customer_name", `%${profile.full_name}%`)
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
      setLoading(false);
    };
    fetchOrders();
  }, [profile]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("status", "aktif")
        .order("name");
      if (data) setProducts(data as Product[]);
      setProductsLoading(false);
    };
    fetchProducts();
  }, []);

  const productCategories = ["semua", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === "semua" || p.category === filterCategory;
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.material.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openProduct = (p: Product) => {
    setActiveProduct(p);
    setActiveImageIdx(0);
  };

  const productImages = (p: Product) =>
    p.image_urls && p.image_urls.length > 0
      ? p.image_urls
      : (p.image_url ? [p.image_url] : []);

  const stats = {
    total: orders.length,
    aktif: orders.filter((o) => o.status === "baru" || o.status === "produksi").length,
    selesai: orders.filter((o) => o.status === "selesai").length,
    totalNilai: orders.reduce((s, o) => s + o.total, 0),
  };

  const initials = profile?.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/10">
        <div className={`flex items-center gap-3 transition-all duration-300 overflow-hidden ${collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
          <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center border border-teal-400/30 shrink-0">
            <Scissors className="w-4 h-4 text-teal-300" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white whitespace-nowrap">
            Vanny<span className="text-teal-400">.</span>
          </span>
        </div>
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 rounded-md bg-white/5 items-center justify-center hover:bg-white/10 transition-colors shrink-0"
          >
            <ChevronRight className={`w-4 h-4 text-teal-300/70 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} />
          </button>
        )}
      </div>

      {(!collapsed || isMobile) && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/50">Portal Pelanggan</p>
        </div>
      )}

      <div className="flex-1 py-4 overflow-y-auto flex flex-col gap-0.5 px-3">
        {menuItems.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setMobileOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-left ${
                active ? "bg-teal-500/20 text-white" : "text-teal-100/60 hover:bg-white/5 hover:text-teal-100"
              }`}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-400 rounded-r-full" />}
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-teal-300" : "group-hover:text-teal-300"}`} />
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${collapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/10">
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors ${collapsed && !isMobile ? "justify-center" : ""}`}>
          <div className="relative shrink-0">
            <Avatar className="w-9 h-9 border-2 border-teal-400/30">
              <AvatarFallback className="bg-teal-600 text-white font-semibold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#134e4a] rounded-full" />
          </div>
          <div className={`flex-1 overflow-hidden transition-all duration-300 ${collapsed && !isMobile ? "w-0 opacity-0" : "opacity-100"}`}>
            <p className="text-sm font-semibold text-white truncate">{profile?.full_name ?? "Pelanggan"}</p>
            <p className="text-[11px] text-teal-300/50 truncate">Pelanggan</p>
          </div>
          {(!collapsed || isMobile) && (
            <button
              onClick={logout}
              title="Keluar"
              className="w-7 h-7 rounded-md hover:bg-red-500/15 text-teal-300/50 hover:text-red-400 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex overflow-hidden font-sans bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[240px]"}`}
        style={{ backgroundColor: "#134e4a" }}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col lg:hidden shadow-2xl"
              style={{ backgroundColor: "#134e4a" }}
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[60px] flex items-center justify-between px-4 lg:px-6 border-b border-black/[0.06] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Vanny Konveksi</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <span className="text-foreground font-medium">
                {menuItems.find((m) => m.id === section)?.label}
              </span>
            </div>
            <h1 className="lg:hidden font-display font-bold text-lg text-foreground">
              {menuItems.find((m) => m.id === section)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <Avatar className="w-8 h-8 border border-teal-200">
              <AvatarFallback className="bg-teal-600 text-white text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto w-full">
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

              {/* ===== BERANDA ===== */}
              {section === "beranda" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900">
                      Selamat datang, {profile?.full_name} 👋
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Pantau pesanan dan aktivitas Anda.</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Pesanan", value: stats.total, icon: Package, color: "text-teal-600", bg: "bg-teal-50" },
                      { label: "Sedang Diproses", value: stats.aktif, icon: CalendarClock, color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Selesai", value: stats.selesai, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Total Nilai", value: formatRupiah(stats.totalNilai), icon: CircleDollarSign, color: "text-teal-700", bg: "bg-teal-50", wide: true },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${s.wide ? "col-span-2 lg:col-span-1" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                          <s.icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium mb-1">{s.label}</p>
                        <p className="text-2xl font-display font-bold text-gray-900 leading-none">{s.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pesanan terbaru */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Pesanan Terbaru</h3>
                      <button
                        onClick={() => setSection("pesanan")}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        Lihat semua <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /></div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Belum ada pesanan</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {orders.slice(0, 4).map((order, i) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                              <StatusIcon status={order.status} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 truncate">{order.product}</span>
                                <span className="text-[11px] font-mono text-muted-foreground shrink-0">{order.id}</span>
                              </div>
                              <div className="mt-1"><ProgressBar status={order.status} /></div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <StatusBadge status={order.status} />
                              <span className="text-xs text-muted-foreground">{order.qty} pcs</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info Card */}
                  <div className="bg-teal-600 rounded-xl p-5 flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Ada pertanyaan tentang pesanan?</p>
                      <p className="text-xs text-teal-100/70 mt-0.5">
                        Hubungi CS kami via WhatsApp:{" "}
                        <a href="tel:081234567890" className="text-white font-semibold underline underline-offset-2">081234567890</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== KATALOG ===== */}
              {section === "katalog" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900">Katalog Produk</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Lihat semua produk yang tersedia. Klik produk untuk lihat detail.
                    </p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari produk atau bahan..."
                        className="pl-9 h-9 border-gray-200 text-sm"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {productCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                            filterCategory === cat
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-gray-600 border-gray-200 hover:border-teal-200 hover:text-teal-700"
                          }`}
                        >
                          {cat === "semua" ? "Semua" : cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {productsLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
                      <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-500">
                        {products.length === 0 ? "Belum ada produk tersedia" : "Tidak ada produk yang cocok"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredProducts.map((product, idx) => {
                        const imgs = productImages(product);
                        const adds = product.sizes?.map((s) => product.size_prices?.[s] ?? 0) ?? [];
                        const maxAdd = adds.length ? Math.max(...adds) : 0;
                        return (
                          <motion.button
                            key={product.id}
                            type="button"
                            onClick={() => openProduct(product)}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="text-left bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200 transition-all group"
                          >
                            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                              {imgs.length > 0 ? (
                                <>
                                  <img
                                    src={imgs[0]}
                                    alt={product.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  {imgs.length > 1 && (
                                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                      <ImageIcon className="h-2.5 w-2.5" /> +{imgs.length - 1}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-10 w-10 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium mb-2 ${
                                categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                              }`}>
                                <Tag className="h-3 w-3 mr-1 inline" />{product.category}
                              </Badge>
                              <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug line-clamp-1">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{product.material}</p>
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {maxAdd > 0 ? "Mulai" : "Harga"}
                                  </p>
                                  <p className="text-base font-display font-bold text-teal-700 leading-tight">
                                    {formatRupiah(product.price)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Min. {product.min_order} pcs
                                  </p>
                                </div>
                                <span className="text-xs font-medium text-teal-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                                  Detail <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Menampilkan {filteredProducts.length} dari {products.length} produk aktif
                  </p>
                </div>
              )}

              {/* ===== PESANAN ===== */}
              {section === "pesanan" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900">Pesanan Saya</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Daftar semua pesanan yang pernah Anda buat.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                      <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-16">
                        <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500">Belum ada pesanan</p>
                        <p className="text-xs text-muted-foreground mt-1">Pesanan Anda akan tampil di sini setelah admin menginput.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {orders.map((order, i) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="p-5 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  order.status === "selesai" ? "bg-emerald-50" :
                                  order.status === "produksi" ? "bg-amber-50" :
                                  order.status === "batal" ? "bg-red-50" : "bg-teal-50"
                                }`}>
                                  <StatusIcon status={order.status} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{order.product}</p>
                                  <p className="text-[11px] font-mono text-muted-foreground">{order.id}</p>
                                </div>
                              </div>
                              <StatusBadge status={order.status} />
                            </div>

                            <div className="mb-3"><ProgressBar status={order.status} /></div>

                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <p className="text-muted-foreground mb-0.5">Jumlah</p>
                                <p className="font-semibold text-gray-900">{order.qty} pcs</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-0.5">Deadline</p>
                                <p className="font-semibold text-gray-900">{order.deadline ? formatDate(order.deadline) : "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-0.5">Total</p>
                                <p className="font-semibold text-teal-700">{formatRupiah(order.total)}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== PROFIL ===== */}
              {section === "profil" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900">Profil Saya</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Informasi akun Anda.</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-teal-600 h-24 relative">
                      <div className="absolute -bottom-8 left-6">
                        <Avatar className="w-16 h-16 border-4 border-white shadow-md">
                          <AvatarFallback className="bg-teal-700 text-white text-xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="pt-12 px-6 pb-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-display font-bold text-gray-900">{profile?.full_name}</h3>
                          <span className="inline-block mt-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-3 py-0.5">
                            Pelanggan
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: "Total Pesanan", value: `${stats.total} pesanan` },
                          { label: "Pesanan Selesai", value: `${stats.selesai} pesanan` },
                          { label: "Pesanan Aktif", value: `${stats.aktif} pesanan` },
                          { label: "Total Nilai Transaksi", value: formatRupiah(stats.totalNilai) },
                        ].map((item) => (
                          <div key={item.label} className="bg-gray-50 rounded-lg px-4 py-3">
                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs text-muted-foreground mb-1">Butuh bantuan atau update data?</p>
                        <p className="text-sm text-gray-700">
                          Hubungi admin kami di{" "}
                          <a href="tel:081234567890" className="text-teal-600 font-semibold">081234567890</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!activeProduct} onOpenChange={(o) => !o && setActiveProduct(null)}>
        <DialogContent className="max-w-3xl bg-white rounded-2xl p-0 overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
          {activeProduct && (() => {
            const imgs = productImages(activeProduct);
            const adds = activeProduct.sizes?.map((s) => activeProduct.size_prices?.[s] ?? 0) ?? [];
            const maxAdd = adds.length ? Math.max(...adds) : 0;
            return (
              <div className="grid md:grid-cols-2">
                {/* Gallery */}
                <div className="bg-gray-50 relative">
                  <div className="aspect-square w-full relative overflow-hidden">
                    {imgs.length > 0 ? (
                      <img
                        src={imgs[activeImageIdx]}
                        alt={activeProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    {imgs.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIdx((i) => (i + 1) % imgs.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
                          {activeImageIdx + 1} / {imgs.length}
                        </span>
                      </>
                    )}
                  </div>
                  {imgs.length > 1 && (
                    <div className="flex gap-1.5 p-3 overflow-x-auto">
                      {imgs.map((url, i) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => setActiveImageIdx(i)}
                          className={`w-14 h-14 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${
                            i === activeImageIdx ? "border-teal-500" : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detail */}
                <div className="p-6 space-y-4 relative">
                  <button
                    type="button"
                    onClick={() => setActiveProduct(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    categoryColors[activeProduct.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    <Tag className="h-3 w-3 mr-1 inline" />{activeProduct.category}
                  </Badge>

                  <div>
                    <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">
                      {activeProduct.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{activeProduct.material}</p>
                  </div>

                  <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4">
                    <p className="text-[11px] text-teal-700/70 font-medium uppercase tracking-wide">
                      {maxAdd > 0 ? "Harga mulai dari" : "Harga satuan"}
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-2xl font-display font-bold text-teal-700">
                        {formatRupiah(activeProduct.price)}
                      </p>
                      {maxAdd > 0 && (
                        <p className="text-sm text-gray-500">
                          s/d {formatRupiah(activeProduct.price + maxAdd)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum order {activeProduct.min_order} pcs
                    </p>
                  </div>

                  {activeProduct.description && (
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">
                        Deskripsi
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {activeProduct.description}
                      </p>
                    </div>
                  )}

                  {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                        Ukuran tersedia
                      </p>
                      <div className="space-y-1.5">
                        {activeProduct.sizes.map((s) => {
                          const add = activeProduct.size_prices?.[s] ?? 0;
                          const totalPrice = activeProduct.price + add;
                          return (
                            <div
                              key={s}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                            >
                              <span className="text-sm font-semibold text-gray-800 w-12">{s}</span>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-teal-700">
                                  {formatRupiah(totalPrice)}
                                </span>
                                {add > 0 && (
                                  <span className="text-[11px] text-gray-500 ml-1.5">
                                    (+{formatRupiah(add)})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-muted-foreground mb-2">Tertarik memesan produk ini?</p>
                    <a
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-10 text-sm font-semibold transition-colors"
                    >
                      <Phone className="h-4 w-4" /> Hubungi Admin
                    </a>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
