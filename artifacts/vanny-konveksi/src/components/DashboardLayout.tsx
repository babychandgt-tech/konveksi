import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Scissors,
  CircleDollarSign, UserSquare2, Settings, LogOut, Bell, Menu, ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, UserRole } from "@/lib/auth";

interface DashboardLayoutProps { children: ReactNode }

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  roles: UserRole[];
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Utama",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "karyawan"] },
    ],
  },
  {
    label: "Penjualan",
    items: [
      { path: "/katalog", label: "Katalog Produk", icon: ShoppingBag, roles: ["admin", "karyawan"] },
      { path: "/pesanan", label: "Pesanan", icon: ShoppingCart, badge: "12", roles: ["admin", "karyawan"] },
      { path: "/produksi", label: "Produksi", icon: Scissors, roles: ["admin", "karyawan"] },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { path: "/pegawai", label: "Pegawai", icon: Users, roles: ["admin"] },
      { path: "/pelanggan", label: "Pelanggan", icon: UserSquare2, roles: ["admin", "karyawan"] },
      { path: "/pengguna", label: "Pengguna", icon: ShieldCheck, roles: ["admin"] },
    ],
  },
  {
    label: "Sistem",
    items: [
      { path: "/keuangan", label: "Keuangan", icon: CircleDollarSign, roles: ["admin"] },
      { path: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["admin"] },
      { path: "/pengaturan", label: "Custom Builder", icon: Settings, roles: ["admin"] },
    ],
  },
];

const allMenuItems: MenuItem[] = menuSections.flatMap((s) => s.items);

const roleLabel: Record<UserRole, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-violet-400/20 text-violet-200" },
  karyawan: { label: "Karyawan", color: "bg-teal-400/20 text-teal-200" },
  pelanggan: { label: "Pelanggan", color: "bg-amber-400/20 text-amber-200" },
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { profile, logout } = useAuth();

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !profile || item.roles.includes(profile.role)),
    }))
    .filter((section) => section.items.length > 0);

  const getPageTitle = () => {
    const item = allMenuItems.find((item) => item.path === location);
    return item ? item.label : "Dashboard";
  };

  const SidebarContent = () => (
    <>
      <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/10">
        <div className={`flex items-center gap-3 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
          <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center border border-teal-400/30">
            <Scissors className="w-4 h-4 text-teal-300" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white whitespace-nowrap">
            Vanny<span className="text-teal-400">.</span>
          </span>
        </div>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex w-8 h-8 rounded-md bg-white/5 items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <ChevronRight className={`w-4 h-4 text-teal-300/70 transition-transform duration-300 ${isSidebarCollapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      <div className="flex-1 py-3 overflow-y-auto scrollbar-hide flex flex-col gap-3 px-3">
        {visibleSections.map((section, sIdx) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            {!isSidebarCollapsed ? (
              <div className="px-3 pt-2 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-300/50">
                  {section.label}
                </span>
              </div>
            ) : (
              sIdx > 0 && <div className="mx-2 my-1 h-px bg-white/10" />
            )}
            {section.items.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${
                      isActive ? "bg-teal-500/20 text-white" : "text-teal-100/60 hover:bg-white/5 hover:text-teal-100"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-400 rounded-r-full" />
                    )}
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${isActive ? "text-teal-300" : "group-hover:text-teal-300"}`} />
                    <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
                      {item.label}
                    </span>
                    {item.badge && !isSidebarCollapsed && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-gray-900 px-1.5">
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isSidebarCollapsed && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/10">
        {!isSidebarCollapsed && profile && (
          <div className="mb-2 px-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleLabel[profile.role].color}`}>
              {roleLabel[profile.role].label}
            </span>
          </div>
        )}
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 ${isSidebarCollapsed ? "justify-center" : ""}`}>
          <div className="relative shrink-0">
            <Avatar className="w-9 h-9 border-2 border-teal-400/30">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || "User"}&backgroundColor=0D9488&textColor=ffffff`} />
              <AvatarFallback className="bg-teal-600 text-white font-semibold text-sm">
                {profile?.full_name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#134e4a] rounded-full" />
          </div>
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <span className="text-sm font-semibold text-white truncate">{profile?.full_name || "User"}</span>
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={logout}
              className="ml-auto w-7 h-7 rounded-md hover:bg-red-500/15 text-teal-300/50 hover:text-red-400 flex items-center justify-center transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      <aside className={`hidden lg:flex flex-col z-20 transition-all duration-300 ease-in-out h-screen sticky top-0 shrink-0 ${isSidebarCollapsed ? "w-[68px]" : "w-[240px]"}`} style={{ backgroundColor: "#134e4a" }}>
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 w-[240px] z-50 flex flex-col lg:hidden shadow-2xl"
              style={{ backgroundColor: "#134e4a" }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[60px] flex items-center justify-between px-4 lg:px-6 border-b border-black/[0.06] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Vanny Konveksi</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <span className="text-foreground font-medium">{getPageTitle()}</span>
            </div>
            <h1 className="lg:hidden font-display font-bold text-lg text-foreground">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
            </button>
            <Avatar className="w-8 h-8 border border-teal-200 lg:hidden">
              <AvatarFallback className="bg-teal-600 text-white text-xs font-semibold">
                {profile?.full_name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div key={location} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
