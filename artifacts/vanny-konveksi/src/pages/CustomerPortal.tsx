import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, ChevronRight, Bell } from "lucide-react";

import { Order, Product, Section } from "./portal/types";
import PortalSidebar, { menuItems } from "./portal/PortalSidebar";
import PortalBeranda from "./portal/PortalBeranda";
import PortalKatalog from "./portal/PortalKatalog";
import PortalPesanan from "./portal/PortalPesanan";
import PortalProfil from "./portal/PortalProfil";
import ProductDetailDialog from "./portal/ProductDetailDialog";

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

  const initials = profile?.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  const handleOpenProduct = (p: Product) => {
    setActiveProduct(p);
    setActiveImageIdx(0);
  };

  return (
    <div className="min-h-screen flex overflow-hidden font-sans bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-[240px]"}`}
        style={{ backgroundColor: "#134e4a" }}
      >
        <PortalSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          section={section}
          setSection={setSection}
          setMobileOpen={setMobileOpen}
          initials={initials}
          fullName={profile?.full_name ?? "Pelanggan"}
          onLogout={logout}
        />
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
              <PortalSidebar
                isMobile
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                section={section}
                setSection={setSection}
                setMobileOpen={setMobileOpen}
                initials={initials}
                fullName={profile?.full_name ?? "Pelanggan"}
                onLogout={logout}
              />
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
              {section === "beranda" && (
                <PortalBeranda
                  profile={profile}
                  orders={orders}
                  loading={loading}
                  setSection={setSection}
                />
              )}

              {section === "katalog" && (
                <PortalKatalog
                  products={products}
                  loading={productsLoading}
                  search={search}
                  setSearch={setSearch}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  onOpenProduct={handleOpenProduct}
                />
              )}

              {section === "pesanan" && (
                <PortalPesanan orders={orders} loading={loading} />
              )}

              {section === "profil" && (
                <PortalProfil profile={profile} orders={orders} initials={initials} />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <ProductDetailDialog
        product={activeProduct}
        imageIdx={activeImageIdx}
        setImageIdx={setActiveImageIdx}
        onClose={() => setActiveProduct(null)}
      />
    </div>
  );
}
