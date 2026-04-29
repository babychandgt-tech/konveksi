import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Users, UserCheck, Umbrella, Loader2, RefreshCw, Search, UserPlus, Info, Phone, CalendarDays, Briefcase, Building2,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "aktif" | "cuti" | "tidak_aktif";
  phone: string | null;
  joined_at: string;
}

interface KaryawanProfile {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
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

interface FormState {
  profileId: string;
  role: string;
  department: string;
  status: "aktif" | "cuti" | "tidak_aktif";
  phone: string;
  joined_at: string;
}

const EMPTY_FORM: FormState = {
  profileId: "",
  role: "",
  department: "Produksi",
  status: "aktif",
  phone: "",
  joined_at: new Date().toISOString().split("T")[0],
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

export default function Pegawai() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [profiles, setProfiles] = useState<KaryawanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [profileSearch, setProfileSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [empRes, profRes] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, email, created_at").eq("role", "karyawan").order("full_name"),
    ]);
    if (empRes.data) setEmployees(empRes.data as Employee[]);
    if (profRes.data) setProfiles(profRes.data as KaryawanProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const employeeIds = useMemo(() => new Set(employees.map((e) => e.id)), [employees]);

  const availableProfiles = useMemo(
    () => profiles
      .filter((p) => !employeeIds.has(p.id))
      .filter((p) => !profileSearch ||
        p.full_name.toLowerCase().includes(profileSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(profileSearch.toLowerCase())),
    [profiles, employeeIds, profileSearch]
  );

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === form.profileId) ?? null,
    [profiles, form.profileId]
  );

  const filtered = employees.filter(
    (e) => !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:  employees.length,
    aktif:  employees.filter((e) => e.status === "aktif").length,
    cuti:   employees.filter((e) => e.status === "cuti").length,
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setProfileSearch("");
    setAddOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) {
      toast({ title: "Pilih akun karyawan dulu", variant: "destructive" });
      return;
    }
    if (!form.role.trim()) {
      toast({ title: "Jabatan wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      id: selectedProfile.id,
      name: selectedProfile.full_name,
      role: form.role,
      department: form.department,
      status: form.status,
      phone: form.phone || null,
      joined_at: form.joined_at,
    };
    const { error } = await supabase.from("employees").insert(payload as never);
    setSaving(false);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pegawai ditambahkan", description: selectedProfile.full_name });
    setAddOpen(false);
    setForm(EMPTY_FORM);
    fetchData();
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
            <Button variant="outline" size="sm" onClick={fetchData} className="border-gray-200 h-9 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Pegawai
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Total Pegawai", short: "Total", value: stats.total, icon: Users,     color: "from-teal-500 to-teal-600" },
            { label: "Pegawai Aktif", short: "Aktif", value: stats.aktif, icon: UserCheck, color: "from-emerald-500 to-emerald-600" },
            { label: "Sedang Cuti",   short: "Cuti",  value: stats.cuti,  icon: Umbrella,  color: "from-amber-500 to-amber-600" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
                <span className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">
                  <span className="sm:hidden">{s.short}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  <s.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-display font-bold text-gray-900">{loading ? "—" : s.value}</div>
            </motion.div>
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{employees.length === 0 ? "Belum ada pegawai terdaftar." : "Tidak ada hasil yang cocok."}</p>
              {employees.length === 0 && availableProfiles.length > 0 && (
                <p className="text-xs text-gray-400">Klik <span className="font-semibold">Tambah Pegawai</span> untuk pilih dari {availableProfiles.length} akun karyawan tersedia.</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent bg-gray-50/40">
                      <TableHead className="text-xs font-semibold text-gray-600 py-3 px-5">Pegawai</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Jabatan</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Divisi</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Telepon</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Bergabung</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((emp, idx) => (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx, 10) * 0.02 }}
                        className="border-gray-50 hover:bg-teal-50/20 transition-colors"
                      >
                        <TableCell className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                                {getInitials(emp.name)}
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

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((emp, idx) => (
                  <div key={emp.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.role}</p>
                          </div>
                          <Badge className={`rounded-full px-2.5 text-[10px] font-medium shrink-0 ${STATUS_CFG[emp.status]}`}>
                            {STATUS_LABEL[emp.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {emp.department}</span>
                          {emp.phone && <span className="flex items-center gap-1">• <Phone className="h-3 w-3" /> {emp.phone}</span>}
                          <span className="flex items-center gap-1">• <CalendarDays className="h-3 w-3" /> {new Date(emp.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="p-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-muted-foreground">Menampilkan {filtered.length} dari {employees.length} pegawai</span>
          </div>
        </div>
      </div>

      {/* Tambah Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-gray-100 bg-teal-50/40">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-bold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-teal-600" />
                Tambah Pegawai Baru
              </DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pilih Akun Karyawan</Label>
              {selectedProfile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-teal-200 bg-teal-50/40">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-bold">{getInitials(selectedProfile.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedProfile.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedProfile.email ?? "Tanpa email"}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, profileId: "" })} className="h-7 text-xs text-teal-700 hover:text-teal-800">
                    Ganti
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      value={profileSearch}
                      onChange={(e) => setProfileSearch(e.target.value)}
                      placeholder="Cari akun karyawan..."
                      className="h-9 pl-9 border-gray-200 text-sm"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {availableProfiles.length === 0 ? (
                      <div className="p-4 text-center">
                        <Info className="h-5 w-5 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500">
                          {profiles.length === 0
                            ? "Belum ada akun dengan peran karyawan."
                            : profileSearch
                              ? "Tidak ada akun cocok."
                              : "Semua akun karyawan sudah terdaftar."}
                        </p>
                      </div>
                    ) : (
                      availableProfiles.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setForm({ ...form, profileId: p.id }); setProfileSearch(""); }}
                          className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-teal-50/40 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-semibold">{getInitials(p.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{p.email ?? "Tanpa email"}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Jabatan</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Operator Cutting" className="h-9 border-gray-200 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Divisi</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Phone className="h-3 w-3" /> No. Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxx" className="h-9 border-gray-200 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Tanggal Bergabung</Label>
                <Input type="date" value={form.joined_at} onChange={(e) => setForm({ ...form, joined_at: e.target.value })} className="h-9 border-gray-200 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["aktif", "cuti", "tidak_aktif"] as const).map((s) => {
                  const active = form.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                        active ? "border-teal-500 bg-teal-50/50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 rounded-lg h-9 text-sm">Batal</Button>
              <Button type="submit" disabled={saving || !selectedProfile} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
