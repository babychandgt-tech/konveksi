import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { supabase, supabaseAdminCreate } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Users, UserCheck, Umbrella, Loader2, RefreshCw, Search, UserPlus,
  Phone, CalendarDays, Mail, KeyRound, Eye, EyeOff, UserCircle2, ShieldCheck,
  MoreVertical, Pencil, Trash2,
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

const DEFAULT_DIVISION = "Produksi";
const DEFAULT_ROLE = "Staf Produksi";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  joined_at: string;
  status: "aktif" | "cuti" | "tidak_aktif";
}

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  joined_at: new Date().toISOString().split("T")[0],
  status: "aktif",
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

export default function Pegawai() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    phone: "",
    joined_at: "",
    status: "aktif" as "aktif" | "cuti" | "tidak_aktif",
  });

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("employees").select("*").order("name");
    if (data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = employees.filter(
    (e) => !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employees.length,
    aktif: employees.filter((e) => e.status === "aktif").length,
    cuti:  employees.filter((e) => e.status === "cuti").length,
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setAddOpen(true);
  };

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let pwd = "";
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, password: pwd }));
    setShowPassword(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (!fullName || !email || !form.password) {
      toast({ title: "Lengkapi data dulu", description: "Nama, email, dan kata sandi wajib diisi.", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Kata sandi terlalu pendek", description: "Minimal 6 karakter.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: signUpData, error: signUpError } = await supabaseAdminCreate.auth.signUp({
      email,
      password: form.password,
      options: {
        data: { full_name: fullName, role: "karyawan", email },
      },
    });

    if (signUpError || !signUpData.user) {
      setSaving(false);
      toast({
        title: "Gagal membuat akun",
        description: signUpError?.message ?? "Pengguna tidak dapat dibuat.",
        variant: "destructive",
      });
      return;
    }

    const newUserId = signUpData.user.id;

    await supabaseAdminCreate
      .from("profiles")
      .upsert({
        id: newUserId,
        full_name: fullName,
        email,
        role: "karyawan",
      } as never);

    const payload = {
      id: newUserId,
      name: fullName,
      role: DEFAULT_ROLE,
      department: DEFAULT_DIVISION,
      status: form.status,
      phone: form.phone.trim() || null,
      joined_at: form.joined_at,
    };

    const { error: empError } = await supabase.from("employees").insert(payload as never);

    await supabaseAdminCreate.auth.signOut();
    setSaving(false);

    if (empError) {
      toast({
        title: "Akun dibuat, tapi data pegawai gagal disimpan",
        description: empError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pegawai berhasil ditambahkan",
      description: `Akun untuk ${fullName} sudah dibuat.`,
    });
    setAddOpen(false);
    setForm(EMPTY_FORM);
    fetchData();
  };

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setEditForm({
      phone: emp.phone ?? "",
      joined_at: emp.joined_at,
      status: emp.status,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const payload = {
      phone: editForm.phone.trim() || null,
      joined_at: editForm.joined_at,
      status: editForm.status,
    };
    const { error } = await supabase
      .from("employees")
      .update(payload as never)
      .eq("id", editTarget.id);
    setSaving(false);
    if (error) {
      toast({ title: "Gagal memperbarui", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data pegawai diperbarui", description: editTarget.name });
    setEmployees((prev) =>
      prev.map((p) => (p.id === editTarget.id ? { ...p, ...payload } : p))
    );
    setEditOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("employees").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pegawai dihapus", description: deleteTarget.name });
    setEmployees((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Data Pegawai</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola data dan akun pegawai konveksi.</p>
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
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama pegawai..." className="pl-9 h-9 border-gray-200 text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{employees.length === 0 ? "Belum ada pegawai terdaftar." : "Tidak ada hasil yang cocok."}</p>
              {employees.length === 0 && (
                <p className="text-xs text-gray-400">Klik <span className="font-semibold">Tambah Pegawai</span> untuk membuat akun pegawai pertama.</p>
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
                      <TableHead className="text-xs font-semibold text-gray-600">Telepon</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Bergabung</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 text-right pr-3">Aksi</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">{emp.phone ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(emp.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <Badge className={`rounded-full px-3 text-xs font-medium ${STATUS_CFG[emp.status]}`}>
                            {STATUS_LABEL[emp.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(emp)} className="text-sm gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Edit Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(emp)}
                                className="text-sm gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge className={`rounded-full px-2.5 text-[10px] font-medium ${STATUS_CFG[emp.status]}`}>
                              {STATUS_LABEL[emp.status]}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1.5"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openEdit(emp)} className="text-sm gap-2">
                                  <Pencil className="h-3.5 w-3.5" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(emp)}
                                  className="text-sm gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-gray-500">
                          {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {emp.phone}</span>}
                          {emp.phone && <span>•</span>}
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(emp.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
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

      {/* Tambah Pegawai Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-gray-100 bg-teal-50/40">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-bold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-teal-600" />
                Buat Akun Pegawai Baru
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                Akun login akan dibuat otomatis dengan peran <span className="font-semibold text-teal-700">karyawan</span>.
              </p>
            </DialogHeader>
          </div>

          <form onSubmit={handleAdd} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-hide">
            {/* Section: Akun Login */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Akun Login</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <UserCircle2 className="h-3 w-3 text-gray-400" /> Nama Lengkap <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Budi Santoso"
                  className="h-9 border-gray-200 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-gray-400" /> Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="budi@vannykonveksi.com"
                  className="h-9 border-gray-200 text-sm"
                  required
                />
                <p className="text-[10px] text-gray-400">Pegawai pakai email ini untuk login.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-gray-400" /> Kata Sandi <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="h-9 border-gray-200 text-sm pr-20"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] text-teal-700 hover:text-teal-800 font-medium"
                >
                  + Buatkan kata sandi acak
                </button>
              </div>
            </div>

            {/* Section: Detail Kepegawaian */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Detail Kepegawaian</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-gray-400" /> No. Telepon
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxx"
                    className="h-9 border-gray-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3 text-gray-400" /> Tanggal Bergabung
                  </Label>
                  <Input
                    type="date"
                    value={form.joined_at}
                    onChange={(e) => setForm({ ...form, joined_at: e.target.value })}
                    className="h-9 border-gray-200 text-sm"
                  />
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
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 rounded-lg h-9 text-sm">
                Batal
              </Button>
              <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {saving ? "Menyimpan..." : "Buat Akun & Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-gray-100 bg-teal-50/40">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-bold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-teal-600" />
                Edit Data Pegawai
              </DialogTitle>
            </DialogHeader>
          </div>
          {editTarget && (
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-bold">{getInitials(editTarget.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{editTarget.name}</p>
                  <p className="text-xs text-gray-500 truncate">{editTarget.role} • {editTarget.department}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Phone className="h-3 w-3" /> No. Telepon</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="08xxxxxxxx"
                  className="h-9 border-gray-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Tanggal Bergabung</Label>
                <Input
                  type="date"
                  value={editForm.joined_at}
                  onChange={(e) => setEditForm({ ...editForm, joined_at: e.target.value })}
                  className="h-9 border-gray-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["aktif", "cuti", "tidak_aktif"] as const).map((s) => {
                    const active = editForm.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, status: s })}
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
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-gray-200 rounded-lg h-9 text-sm">Batal</Button>
                <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Simpan Perubahan
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pegawai?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <span className="font-semibold">{deleteTarget?.name}</span> dari daftar pegawai akan dihapus.
              Akun login user tetap aktif di sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />} Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
