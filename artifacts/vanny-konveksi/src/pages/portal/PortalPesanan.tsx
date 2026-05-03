import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ShoppingBag, X, FileText, ChevronRight,
  CheckCircle2, PackageOpen, XCircle, Scissors, Shirt, Sparkles, Clock2,
} from "lucide-react";
import { Order, formatRupiah, formatDate } from "./types";
import { StatusBadge, StatusIcon, ProgressBar } from "./StatusComponents";
import { Button } from "@/components/ui/button";
import { printInvoice } from "@/lib/printInvoice";
import { supabase } from "@/lib/supabase";

interface Props {
  orders: Order[];
  loading: boolean;
}

interface ProductionTask {
  id: string;
  stage: "antrian" | "cutting" | "jahit" | "finishing";
  progress: number;
}

const STATUS_LABEL: Record<string, string> = {
  baru: "Baru", produksi: "Dalam Produksi", selesai: "Selesai", batal: "Dibatalkan",
};

const STAGES: { id: ProductionTask["stage"]; label: string; icon: React.ElementType; color: string; activeColor: string; doneColor: string }[] = [
  { id: "antrian",  label: "Antrian",  icon: Clock2,    color: "text-gray-400",   activeColor: "text-teal-600",   doneColor: "text-emerald-600" },
  { id: "cutting",  label: "Cutting",  icon: Scissors,  color: "text-gray-400",   activeColor: "text-teal-600",   doneColor: "text-emerald-600" },
  { id: "jahit",    label: "Jahit",    icon: Shirt,     color: "text-gray-400",   activeColor: "text-amber-600",  doneColor: "text-emerald-600" },
  { id: "finishing",label: "Finishing",icon: Sparkles,  color: "text-gray-400",   activeColor: "text-emerald-600",doneColor: "text-emerald-600" },
];

function ProductionStages({ task }: { task: ProductionTask }) {
  const currentIdx = STAGES.findIndex((s) => s.id === task.stage);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Tahap Produksi</h4>
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full capitalize">
          {STAGES[currentIdx]?.label ?? "—"}
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          const Icon   = stage.icon;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done   ? "bg-emerald-100 border-emerald-300"  :
                  active ? "bg-amber-100 border-amber-400 shadow-sm shadow-amber-200" :
                           "bg-white border-gray-200"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    done ? "text-emerald-600" : active ? "text-amber-600" : "text-gray-300"
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${
                  done ? "text-emerald-600" : active ? "text-amber-700" : "text-gray-400"
                }`}>
                  {stage.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 rounded-full transition-all ${
                  i < currentIdx ? "bg-emerald-300" : "bg-gray-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200/60">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-amber-700/70">Progress keseluruhan</span>
            <span className="text-[11px] font-bold text-amber-700">{task.progress}%</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all duration-700"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  icon: Icon, label, time, done, active, dim,
}: {
  icon: React.ElementType; label: string; time: string;
  done?: boolean; active?: boolean; dim?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
        done ? "bg-emerald-100 border-emerald-200 text-emerald-600" :
        active ? "bg-teal-100 border-teal-200 text-teal-600" :
        "bg-gray-50 border-gray-200 text-gray-400"
      } ${dim ? "opacity-50" : ""}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className={`flex-1 p-2.5 rounded-lg border transition-all ${
        done ? "bg-emerald-50 border-emerald-100" :
        active ? "bg-teal-50 border-teal-100" :
        "bg-gray-50 border-gray-100"
      } ${dim ? "opacity-50" : ""}`}>
        <div className="flex justify-between items-center gap-2">
          <span className={`text-sm font-medium ${done ? "text-emerald-700" : active ? "text-teal-700" : "text-gray-500"}`}>
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">{time}</span>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const [task, setTask] = useState<ProductionTask | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const unitPrice = order.qty > 0 ? order.total / order.qty : 0;

  useEffect(() => {
    if (order.status !== "produksi") return;
    setTaskLoading(true);
    supabase
      .from("production_tasks")
      .select("id, stage, progress")
      .eq("order_id", order.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTask(data as ProductionTask);
        setTaskLoading(false);
      });
  }, [order.id, order.status]);

  const timeline = [
    {
      icon: CheckCircle2,
      label: "Pesanan Dibuat",
      time: formatDate(order.created_at),
      done: true,
    },
    {
      icon: PackageOpen,
      label: "Masuk Produksi",
      time: order.status === "produksi" || order.status === "selesai" ? "Sedang diproses" : "Menunggu",
      done: order.status === "produksi" || order.status === "selesai",
      active: order.status === "produksi",
      dim: order.status === "baru",
    },
    {
      icon: order.status === "batal" ? XCircle : CheckCircle2,
      label: order.status === "batal" ? "Pesanan Dibatalkan" : "Selesai",
      time: order.deadline
        ? (order.status === "selesai" ? formatDate(order.deadline) : `Est. ${formatDate(order.deadline)}`)
        : "Belum ditentukan",
      done: order.status === "selesai",
      active: false,
      dim: order.status === "baru" || order.status === "produksi",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={order.status} />
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-1">{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Info produk */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Detail Produk</h4>
            <div>
              <p className="text-base font-semibold text-gray-900">{order.product}</p>
              {order.customer_name && (
                <p className="text-xs text-muted-foreground mt-0.5">Atas nama: {order.customer_name}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Jumlah</p>
                <p className="text-sm font-semibold text-gray-900">{order.qty} pcs</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Harga Satuan</p>
                <p className="text-sm font-semibold text-gray-900">{formatRupiah(unitPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
                <p className="text-sm font-semibold text-teal-700">{formatRupiah(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Total highlight */}
          <div className="rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/40 border border-teal-100 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600/70 mb-1">Total Nilai Pesanan</p>
            <p className="text-2xl font-display font-bold text-teal-700">{formatRupiah(order.total)}</p>
          </div>

          {/* Tahap Produksi — hanya tampil jika status produksi */}
          {order.status === "produksi" && (
            taskLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat info produksi...
              </div>
            ) : task ? (
              <ProductionStages task={task} />
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <p className="text-xs text-amber-700">Pesanan sedang dalam antrian produksi.</p>
              </div>
            )
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status Keseluruhan</h4>
              <span className="text-xs font-medium text-gray-600">{STATUS_LABEL[order.status]}</span>
            </div>
            <ProgressBar status={order.status} />
          </div>

          {/* Timeline */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline Pesanan</h4>
            <div className="space-y-2.5 relative">
              <div className="absolute left-[18px] top-9 bottom-2 w-px bg-gray-100" />
              {timeline.map((step, i) => (
                <TimelineStep key={i} {...step} />
              ))}
            </div>
          </div>

          {/* Info tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Tanggal Pesan</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(order.created_at)}</p>
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Estimasi Selesai</p>
              <p className={`text-sm font-semibold ${order.deadline ? "text-gray-900" : "text-muted-foreground"}`}>
                {order.deadline ? formatDate(order.deadline) : "Menunggu admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          <Button
            onClick={() => printInvoice({ ...order, customer_name: order.customer_name ?? "-", deadline: order.deadline ?? null })}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl h-10 gap-2"
          >
            <FileText className="w-4 h-4" /> Cetak Invoice
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PortalPesanan({ orders, loading }: Props) {
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Pesanan Saya</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Klik pesanan untuk melihat detail dan mencetak invoice.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">Belum ada pesanan</p>
            <p className="text-xs text-muted-foreground mt-1">Pesanan Anda akan tampil di sini setelah checkout.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order, i) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(order)}
                className="w-full text-left p-5 hover:bg-gray-50/80 active:bg-gray-100 transition-colors group"
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
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={order.status} />
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </div>

                <div className="mb-3">
                  <ProgressBar status={order.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Jumlah</p>
                    <p className="font-semibold text-gray-900">{order.qty} pcs</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Estimasi Selesai</p>
                    <p className="font-semibold text-gray-900">
                      {order.deadline ? formatDate(order.deadline) : "Menunggu admin"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Total</p>
                    <p className="font-semibold text-teal-700">{formatRupiah(order.total)}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
