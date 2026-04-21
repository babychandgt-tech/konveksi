import { motion } from "framer-motion";
import {
  Loader2, ShoppingBag, CheckCircle2, ChevronRight,
  TrendingUp, CalendarClock, CircleDollarSign, Package,
} from "lucide-react";
import { Order, Section, formatRupiah } from "./types";
import { StatusBadge, StatusIcon, ProgressBar } from "./StatusComponents";

interface Props {
  profile: { full_name: string } | null;
  orders: Order[];
  loading: boolean;
  setSection: (s: Section) => void;
}

export default function PortalBeranda({ profile, orders, loading, setSection }: Props) {
  const stats = {
    total: orders.length,
    aktif: orders.filter((o) => o.status === "baru" || o.status === "produksi").length,
    selesai: orders.filter((o) => o.status === "selesai").length,
    totalNilai: orders.reduce((s, o) => s + o.total, 0),
  };

  return (
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
  );
}
