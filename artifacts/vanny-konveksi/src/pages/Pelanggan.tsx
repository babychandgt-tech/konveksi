import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Loader2, RefreshCw, Building2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tier: "Regular" | "Gold" | "Platinum";
  created_at: string;
}

const tierColors: Record<string, string> = {
  Platinum: "bg-violet-50 text-violet-700 border-violet-200",
  Gold:     "bg-amber-50 text-amber-700 border-amber-200",
  Regular:  "bg-gray-100 text-gray-600 border-gray-200",
};

const avatarColors = [
  "bg-teal-100 text-teal-700", "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700", "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
];

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", tier: "Regular" as "Regular" | "Gold" | "Platinum" };

export default function Pelanggan() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [custRes, ordersRes] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("orders").select("customer_name"),
    ]);
    if (custRes.data) setCustomers(custRes.data as Customer[]);
    if (ordersRes.data) {
      const counts: Record<string, number> = {};
      ordersRes.data.forEach((o) => { counts[o.customer_name] = (counts[o.customer_name] ?? 0) + 1; });
      setOrderCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = customers.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("customers").insert(form);
    setSaving(false);
    if (error) { toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pelanggan ditambahkan" });
    setAddOpen(false); setForm(EMPTY_FORM);
    fetchData();
  };

  const stats = {
    total:    customers.length,
    platinum: customers.filter((c) => c.tier === "Platinum").length,
    gold:     customers.filter((c) => c.tier === "Gold").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Data Pelanggan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi dan riwayat pelanggan.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-gray-200 h-9 rounded-lg"><RefreshCw className="h-4 w-4" /></Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Pelanggan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader><DialogTitle className="text-lg font-display font-bold">Tambah Pelanggan Baru</DialogTitle></DialogHeader>
                </div>
                <form onSubmit={handleAdd} className="p-5 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nama / Perusahaan</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PT Maju Mundur" className="h-9 border-gray-200 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className="h-9 border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">No. Telepon</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxx" className="h-9 border-gray-200 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Alamat</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Sudirman No. 1, Jakarta" className="h-9 border-gray-200 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tier</Label>
                    <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as "Regular" | "Gold" | "Platinum" })}>
                      <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
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
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Pelanggan", value: stats.total, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
            { label: "Gold", value: stats.gold, icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Platinum", value: stats.platinum, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="text-xl font-display font-bold text-gray-900">{loading ? "—" : s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pelanggan..." className="pl-9 h-9 border-gray-200 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-5">Pelanggan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Kontak</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Pesanan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Tier</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Bergabung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer, idx) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`border-gray-50 ${idx % 2 === 0 ? "bg-gray-50/40" : ""} hover:bg-teal-50/30 transition-colors`}
                    >
                      <TableCell className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                              {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                            {customer.address && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{customer.address}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{customer.phone ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">{customer.email ?? "-"}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{orderCounts[customer.name] ?? 0}</span>
                        <span className="text-xs text-muted-foreground ml-1">pesanan</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-3 text-xs font-medium ${tierColors[customer.tier]}`}>{customer.tier}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="p-4 border-t border-gray-100">
            <span className="text-xs text-muted-foreground">Menampilkan {filtered.length} dari {customers.length} pelanggan</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
