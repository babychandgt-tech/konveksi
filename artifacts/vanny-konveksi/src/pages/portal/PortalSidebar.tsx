import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Scissors, LogOut, ChevronRight, ShoppingCart } from "lucide-react";
import { Section, CartItem, menuItems } from "./types";

interface Props {
  isMobile?: boolean;
  collapsed: boolean;
  setCollapsed: (b: boolean) => void;
  section: Section;
  setSection: (s: Section) => void;
  setMobileOpen: (b: boolean) => void;
  initials: string;
  fullName: string;
  onLogout: () => void;
  cartItems?: CartItem[];
}

export default function PortalSidebar({
  isMobile = false, collapsed, setCollapsed, section, setSection,
  setMobileOpen, initials, fullName, onLogout, cartItems = [],
}: Props) {
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
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
          const active = section === item.id || (item.id === "keranjang" && section === "checkout");
          const isCart = item.id === "keranjang";
          return (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setMobileOpen(false); }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group text-left ${
                active ? "bg-teal-500/20 text-white" : "text-teal-100/60 hover:bg-white/5 hover:text-teal-100"
              }`}
            >
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-400 rounded-r-full" />}
              <div className="relative flex-shrink-0">
                <item.icon className={`w-[18px] h-[18px] ${active ? "text-teal-300" : "group-hover:text-teal-300"}`} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-orange-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 flex-1 ${collapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
                {item.label}
              </span>
              {isCart && cartCount > 0 && (!collapsed || isMobile) && (
                <span className="ml-auto bg-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {cartCount}
                </span>
              )}
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
            <p className="text-sm font-semibold text-white truncate">{fullName}</p>
            <p className="text-[11px] text-teal-300/50 truncate">Pelanggan</p>
          </div>
          {(!collapsed || isMobile) && (
            <button
              onClick={onLogout}
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
}
