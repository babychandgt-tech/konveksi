import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Eye, FileText, CheckCircle2, Clock, PackageOpen, Loader2, RefreshCw, PackageSearch, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "baru" | "produksi" | "selesai" | "batal";

interface Order {
  id: string;
  customer_name: string;
  product: string;
  qty: number;
  total: number;
  status: OrderStatus;
  deadline: string | null;
  created_at: string;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

const STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string }> = {
  baru:     { label: "Baru",     badge: "bg-teal-50 text-teal-700 border-teal-200" },
  produksi: { label: "Produksi", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  selesai:  { label: "Selesai",  badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  batal:    { label: "Batal",    badge: "bg-red-50 text-red-600 border-red-200" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge className={`rounded-full px-3 font-medium text-xs ${cfg.badge}`}>{cfg.label}</Badge>;
}

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === "baru")     return <Clock className="h-4 w-4 text-teal-600" />;
  if (status === "produksi") return <PackageSearch className="h-4 w-4 text-amber-600" />;
  if (status === "selesai")  return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

const EMPTY_FORM = { customer_name: "", product: "", qty: "", total: "", deadline: "", status: "baru" as OrderStatus };

export default function Pesanan() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("semua");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Tab counts
  const counts = {
    semua:    orders.length,
    baru:     orders.filter((o) => o.status === "baru").length,
    produksi: orders.filter((o) => o.status === "produksi").length,
    selesai:  orders.filter((o) => o.status === "selesai").length,
    batal:    orders.filter((o) => o.status === "batal").length,
  };

  const tabs = [
    { id: "semua",    label: "Semua" },
    { id: "baru",     label: "Baru" },
    { id: "produksi", label: "Produksi" },
    { id: "selesai",  label: "Selesai" },
    { id: "batal",    label: "Batal" },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchTab = activeTab === "semua" || o.status === activeTab;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q) || o.product.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Generate next order ID
  const generateOrderId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const max = orders.reduce((acc, o) => {
      const num = parseInt(o.id.split("-")[2] ?? "0");
      return num > acc ? num : acc;
    }, 0);
    return `ORD-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newId = generateOrderId();
    const { error } = await supabase.from("orders").insert({
      id: newId,
      customer_name: form.customer_name,
      product: form.product,
      qty: parseInt(form.qty),
      total: parseInt(form.total.replace(/\D/g, "")),
      status: form.status,
      deadline: form.deadline || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pesanan ditambahkan", description: `${newId} berhasil disimpan.` });
    setAddOpen(false);
    setForm(EMPTY_FORM);
    fetchOrders();
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", selectedOrder.id);
    setUpdatingStatus(false);
    if (error) {
      toast({ title: "Gagal update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status diperbarui", description: `${selectedOrder.id} → ${STATUS_CONFIG[newStatus].label}` });
    setSelectedOrder({ ...selectedOrder, status: newStatus });
    fetchOrders();
  };

  const timelineSteps = (order: Order) => [
    { icon: CheckCircle2, label: "Pesanan Dibuat",  time: formatDate(order.created_at), done: true },
    { icon: PackageOpen,  label: "Masuk Produksi",  time: "—", done: order.status === "produksi" || order.status === "selesai", active: order.status === "produksi" },
    { icon: CheckCircle2, label: "Selesai",         time: order.status === "selesai" ? formatDate(order.deadline) : `Est. ${formatDate(order.deadline)}`, done: order.status === "selesai", dim: order.status !== "selesai" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Manajemen Pesanan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Lacak dan kelola pesanan dari awal hingga selesai.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders} className="border-gray-200 h-9 rounded-lg text-sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Pesanan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display font-bold text-gray-900">Tambah Pesanan Baru</DialogTitle>
                  </DialogHeader>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Nama Pelanggan</Label>
                      <Input placeholder="PT Maju Mundur" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="h-9 border-gray-200 focus-visible:ring-teal-500 text-sm" required />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Produk</Label>
                      <Input placeholder="Seragam Karyawan" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="h-9 border-gray-200 focus-visible:ring-teal-500 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Jumlah (pcs)</Label>
                      <Input type="number" placeholder="100" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="h-9 border-gray-200 focus-visible:ring-teal-500 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Total (Rp)</Label>
                      <Input type="number" placeholder="10000000" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} className="h-9 border-gray-200 focus-visible:ring-teal-500 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Deadline</Label>
                      <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="h-9 border-gray-200 focus-visible:ring-teal-500 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Status Awal</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OrderStatus })}>
                        <SelectTrigger className="h-9 border-gray-200 focus:ring-teal-500 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 rounded-lg h-9 text-sm">Batal</Button>
                    <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold">
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Simpan
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-500/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50"
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari no. pesanan atau pelanggan..."
                className="pl-9 border-gray-200 focus-visible:ring-teal-500 h-9 rounded-lg text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <PackageOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-5">No. Pesanan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Pelanggan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Produk</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Total</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Deadline</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right px-5">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order, idx) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`border-gray-50 ${idx % 2 === 0 ? "bg-gray-50/40" : ""} hover:bg-teal-50/30 transition-colors`}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-gray-700 py-3.5 px-5">{order.id}</TableCell>
                      <TableCell className="text-sm text-gray-800 font-medium">{order.customer_name}</TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{order.product}</p>
                        <p className="text-xs text-muted-foreground">{order.qty} pcs</p>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-teal-700">{formatRp(order.total)}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.deadline)}</TableCell>
                      <TableCell className="text-right px-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg text-xs h-7"
                          onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> Detail
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Menampilkan {filteredOrders.length} dari {counts.semua} pesanan
            </span>
          </div>
        </div>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl bg-white border-gray-200 text-gray-900 rounded-2xl p-0 overflow-hidden shadow-xl">
            {selectedOrder && (
              <>
                <div className="p-6 border-b border-gray-100 bg-teal-50/50">
                  <DialogHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <DialogTitle className="text-xl font-display font-bold text-gray-900">Detail Pesanan</DialogTitle>
                        <p className="text-teal-600 font-mono text-sm mt-1 font-medium">{selectedOrder.id}</p>
                      </div>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                  </DialogHeader>
                </div>

                <div className="p-6 grid grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pelanggan</h4>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Detail Produk</h4>
                      <p className="font-semibold text-gray-900">{selectedOrder.product}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Jumlah: <span className="font-bold text-gray-900">{selectedOrder.qty} pcs</span></p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Nilai</h4>
                      <p className="text-xl font-bold text-teal-700">{formatRp(selectedOrder.total)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => (
                          <button
                            key={s}
                            disabled={selectedOrder.status === s || updatingStatus}
                            onClick={() => handleUpdateStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              selectedOrder.status === s
                                ? `${STATUS_CONFIG[s].badge} cursor-default`
                                : "border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50"
                            }`}
                          >
                            {updatingStatus && selectedOrder.status !== s ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null}
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Timeline Pesanan</h4>
                    <div className="space-y-4 relative">
                      <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />
                      {timelineSteps(selectedOrder).map((step, i) => (
                        <div key={i} className="relative flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                            step.done ? "bg-emerald-100 border-emerald-200 text-emerald-600" :
                            step.active ? "bg-teal-100 border-teal-200 text-teal-600" :
                            "bg-gray-50 border-gray-100 text-gray-400"
                          }`}>
                            <step.icon className="w-4 h-4" />
                          </div>
                          <div className={`flex-1 p-2.5 rounded-lg border ${
                            step.done ? "bg-emerald-50 border-emerald-100" :
                            step.active ? "bg-teal-50 border-teal-100" :
                            "bg-gray-50 border-gray-100 opacity-60"
                          }`}>
                            <div className="flex justify-between">
                              <span className={`text-sm font-medium ${step.done ? "text-emerald-700" : step.active ? "text-teal-700" : "text-gray-500"}`}>{step.label}</span>
                              <span className="text-xs text-muted-foreground">{step.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <p className="text-xs text-muted-foreground">Deadline: {formatDate(selectedOrder.deadline)}</p>
                  <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg text-sm h-9">
                    <FileText className="mr-2 h-4 w-4" /> Cetak Invoice
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
