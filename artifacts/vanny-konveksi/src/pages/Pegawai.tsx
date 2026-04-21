import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, UserCheck, Umbrella, Loader2, RefreshCw, Search } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "aktif" | "cuti" | "tidak_aktif";
  phone: string | null;
  joined_at: string;
}

const avatarColors = [
  "bg-teal-100 text-teal-700", "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
  "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700",
  "bg-gray-100 text-gray-600",   "bg-orange-100 text-orange-700",
];

const STATUS_CFG: Record<string, string> = {
  aktif:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  cuti:        "bg-amber-50 text-amber-700 border-amber-200",
  tidak_aktif: "bg-gray-100 text-gray-500 border-gray-200",
};
const STATUS_LABEL: Record<string, string> = { aktif: "Aktif", cuti: "Cuti", tidak_aktif: "Tidak Aktif" };

const DEPARTMENTS = ["Manajemen", "Produksi", "QA/QC", "Desain", "Keuangan", "Logistik", "Pemasaran", "Lainnya"];
const EMPTY_FORM = { name: "", role: "", department: "Produksi", status: "aktif" as "aktif" | "cuti" | "tidak_aktif", phone: "", joined_at: new Date().toISOString().split("T")[0] };

export default function Pegawai() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("name");
    if (data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter(
    (e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:  employees.length,
    aktif:  employees.filter((e) => e.status === "aktif").length,
    cuti:   employees.filter((e) => e.status === "cuti").length,
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("employees").insert(form);
    setSaving(false);
    if (error) { toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pegawai ditambahkan" });
    setAddOpen(false); setForm(EMPTY_FORM);
    fetchEmployees();
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Data Pegawai</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola data dan status pegawai konveksi.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEmployees} className="border-gray-200 h-9 rounded-lg"><RefreshCw className="h-4 w-4" /></Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Pegawai
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader><DialogTitle className="text-lg font-display font-bold">Tambah Pegawai Baru</DialogTitle></DialogHeader>
                </div>
                <form onSubmit={handleAdd} className="p-5 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nama Lengkap</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Budi Santoso" className="h-9 border-gray-200 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Jabatan</Label>
                      <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Operator Cutting" className="h-9 border-gray-200 text-sm" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Divisi</Label>
                      <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                        <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">No. Telepon</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxx" className="h-9 border-gray-200 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Tanggal Bergabung</Label>
                      <Input type="date" value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} className="h-9 border-gray-200 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "aktif" | "cuti" | "tidak_aktif" })}>
                      <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="cuti">Cuti</SelectItem>
                        <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
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
            { label: "Total Pegawai", value: stats.total,  icon: Users,      color: "text-teal-600",   bg: "bg-teal-50" },
            { label: "Pegawai Aktif", value: stats.aktif,  icon: UserCheck,  color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Sedang Cuti",   value: stats.cuti,   icon: Umbrella,   color: "text-amber-600",  bg: "bg-amber-50" },
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
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, jabatan, divisi..." className="pl-9 h-9 border-gray-200 text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-5">Pegawai</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Jabatan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Divisi</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Telepon</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Bergabung</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp, idx) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`border-gray-50 ${idx % 2 === 0 ? "bg-gray-50/40" : ""} hover:bg-teal-50/30 transition-colors`}
                    >
                      <TableCell className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                              {emp.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{emp.role}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.department}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.phone ?? "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(emp.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-3 text-xs font-medium ${STATUS_CFG[emp.status]}`}>
                          {STATUS_LABEL[emp.status]}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="p-4 border-t border-gray-100">
            <span className="text-xs text-muted-foreground">Menampilkan {filtered.length} dari {employees.length} pegawai</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
