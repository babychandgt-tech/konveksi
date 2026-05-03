import { motion } from "framer-motion";
import { Loader2, ShoppingBag } from "lucide-react";
import { Order, formatRupiah, formatDate } from "./types";
import { StatusBadge, StatusIcon, ProgressBar } from "./StatusComponents";

interface Props {
  orders: Order[];
  loading: boolean;
}

export default function PortalPesanan({ orders, loading }: Props) {
  return (
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
                    <p className="text-muted-foreground mb-0.5">Estimasi Selesai</p>
                    <p className="font-semibold text-gray-900">{order.deadline ? formatDate(order.deadline) : "Menunggu admin"}</p>
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
  );
}
