import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, Plus, TrendingUp, TrendingDown, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "masuk" | "keluar";
  amount: number;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const formatRpCompact = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const CATEGORIES_MASUK  = ["Pendapatan", "DP Pesanan", "Pelunasan", "Lainnya"];
const CATEGORIES_KELUAR = ["Bahan Baku", "Gaji", "Operasional", "Peralatan", "Lainnya"];

const EMPTY_FORM = { date: new Date().toISOString().split("T")[0], description: "", category: "Pendapatan", type: "masuk" as "masuk" | "keluar", amount: "" };

export default function Keuangan() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    if (data) {
      const txs = data as Transaction[];
      setTransactions(txs);

      // Build chart for last 6 months
      const now = new Date();
      const months: { name: string; pemasukan: number; pengeluaran: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTxs = txs.filter((t) => {
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });
        const pemasukan  = monthTxs.filter((t) => t.type === "masuk").reduce((s, t) => s + t.amount, 0);
        const pengeluaran = monthTxs.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0);
        months.push({ name: MONTHS[d.getMonth()], pemasukan: pemasukan / 1e6, pengeluaran: pengeluaran / 1e6 });
      }
      setChartData(months);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const stats = {
    totalMasuk:    transactions.filter((t) => t.type === "masuk").reduce((s, t)  => s + t.amount, 0),
    totalKeluar:   transactions.filter((t) => t.type === "keluar").reduce((s, t) => s + t.amount, 0),
    bulanMasuk:    transactions.filter((t) => { const d = new Date(t.date); const n = new Date(); return t.type === "masuk"  && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce((s, t) => s + t.amount, 0),
    bulanKeluar:   transactions.filter((t) => { const d = new Date(t.date); const n = new Date(); return t.type === "keluar" && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce((s, t) => s + t.amount, 0),
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("transactions").insert({
      date: form.date, description: form.description,
      category: form.category, type: form.type,
      amount: parseInt(form.amount.replace(/\D/g, "")),
    });
    setSaving(false);
    if (error) { toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Transaksi dicatat" });
    setAddOpen(false); setForm(EMPTY_FORM);
    fetchTransactions();
  };

  const categoryOptions = form.type === "masuk" ? CATEGORIES_MASUK : CATEGORIES_KELUAR;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Keuangan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pantau pemasukan, pengeluaran, dan arus kas.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTransactions} className="border-gray-200 h-9 rounded-lg"><RefreshCw className="h-4 w-4" /></Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Catat Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader><DialogTitle className="text-lg font-display font-bold">Catat Transaksi Baru</DialogTitle></DialogHeader>
                </div>
                <form onSubmit={handleAdd} className="p-5 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Jenis</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "masuk" | "keluar", category: v === "masuk" ? "Pendapatan" : "Bahan Baku" })}>
                        <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masuk">Pemasukan</SelectItem>
                          <SelectItem value="keluar">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Tanggal</Label>
                      <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 border-gray-200 text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Keterangan</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pelunasan pesanan PT Maju Mundur" className="h-9 border-gray-200 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Kategori</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Jumlah (Rp)</Label>
                      <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="10000000" className="h-9 border-gray-200 text-sm" required />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 rounded-lg h-9 text-sm">Batal</Button>
                    <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold">
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Simpan
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pemasukan",    value: stats.totalMasuk,  icon: TrendingUp,    iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
            { label: "Total Pengeluaran",  value: stats.totalKeluar, icon: TrendingDown,  iconBg: "bg-red-50",     iconColor: "text-red-500",     valueColor: "text-red-600" },
            { label: "Pemasukan Bulan Ini",value: stats.bulanMasuk,  icon: ArrowUpRight,  iconBg: "bg-teal-50",    iconColor: "text-teal-600",    valueColor: "text-teal-700" },
            { label: "Pengeluaran Bulan Ini", value: stats.bulanKeluar, icon: ArrowDownRight, iconBg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-700" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-5">
              <div className={`h-9 w-9 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <p className="text-[11px] text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-lg font-display font-bold ${s.valueColor}`}>
                {loading ? "—" : formatRpCompact(s.value)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900">Arus Kas 6 Bulan Terakhir</h3>
            <p className="text-xs text-muted-foreground">Dalam jutaan Rupiah</p>
          </div>
          {loading ? (
            <div className="h-52 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-300" /></div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#E2E8F0", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`${v.toFixed(1)}jt`]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  <Line type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#0D9488" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Riwayat Transaksi</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-5">Tanggal</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Keterangan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Kategori</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Jenis</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right px-5">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, idx) => (
                    <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className={`border-gray-50 ${idx % 2 === 0 ? "bg-gray-50/40" : ""} hover:bg-teal-50/20 transition-colors`}>
                      <TableCell className="py-3.5 px-5 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-800 font-medium">{tx.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tx.category}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-3 text-xs font-medium ${tx.type === "masuk" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                          {tx.type === "masuk" ? <ArrowUpRight className="h-3 w-3 inline mr-0.5" /> : <ArrowDownRight className="h-3 w-3 inline mr-0.5" />}
                          {tx.type === "masuk" ? "Masuk" : "Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right px-5 text-sm font-bold ${tx.type === "masuk" ? "text-emerald-700" : "text-red-600"}`}>
                        {tx.type === "keluar" ? "-" : "+"}{formatRp(tx.amount)}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
