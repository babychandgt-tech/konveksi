import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Loader2, RefreshCw, Building2, Users, MoreVertical, Crown, Award, UserCircle2, Mail, Phone, MapPin, Trash2, Pencil, UserPlus, Info } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Tier = "Regular" | "Gold" | "Platinum";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tier: Tier;
  created_at: string;
}

interface PelangganProfile {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

const tierStyles: Record<Tier, { color: string; icon: React.ElementType }> = {
  Platinum: { color: "bg-violet-50 text-violet-700 border-violet-200", icon: Crown },
  Gold:     { color: "bg-amber-50 text-amber-700 border-amber-200",   icon: Award },
  Regular:  { color: "bg-gray-100 text-gray-600 border-gray-200",     icon: UserCircle2 },
};

const avatarColors = [
  "bg-teal-100 text-teal-700", "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700", "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700",
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "-"; }
};

interface FormState {
  profileId: string;
  phone: string;
  address: string;
  tier: Tier;
}

const EMPTY_FORM: FormState = { profileId: "", phone: "", address: "", tier: "Regular" };

export default function Pelanggan() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profiles, setProfiles] = useState<PelangganProfile[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [profileSearch, setProfileSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [custRes, profRes, ordersRes] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email, created_at").eq("role", "pelanggan").order("full_name"),
      supabase.from("orders").select("customer_name"),
    ]);
    if (custRes.data) setCustomers(custRes.data as Customer[]);
    if (profRes.data) setProfiles(profRes.data as PelangganProfile[]);
    if (ordersRes.data) {
      const counts: Record<string, number> = {};
      (ordersRes.data as { customer_name: string }[]).forEach((o) => {
        counts[o.customer_name] = (counts[o.customer_name] ?? 0) + 1;
      });
      setOrderCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const customerIds = useMemo(() => new Set(customers.map((c) => c.id)), [customers]);

  const availableProfiles = useMemo(
    () => profiles
      .filter((p) => !customerIds.has(p.id))
      .filter((p) => !profileSearch ||
        p.full_name.toLowerCase().includes(profileSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(profileSearch.toLowerCase())),
    [profiles, customerIds, profileSearch]
  );

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === form.profileId) ?? null,
    [profiles, form.profileId]
  );

  const filtered = customers.filter(
    (c) => !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setProfileSearch("");
    setAddOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditTarget(c);
    setForm({ profileId: c.id, phone: c.phone ?? "", address: c.address ?? "", tier: c.tier });
    setEditOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) {
      toast({ title: "Pilih akun pelanggan dulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      id: selectedProfile.id,
      name: selectedProfile.full_name,
      email: selectedProfile.email,
      phone: form.phone || null,
      address: form.address || null,
      tier: form.tier,
    };
    const { error } = await supabase.from("customers").insert(payload as never);
    setSaving(false);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pelanggan ditambahkan", description: selectedProfile.full_name });
    setAddOpen(false);
    setForm(EMPTY_FORM);
    fetchData();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({
        phone: form.phone || null,
        address: form.address || null,
        tier: form.tier,
      } as never)
      .eq("id", editTarget.id);
    setSaving(false);
    if (error) {
      toast({ title: "Gagal memperbarui", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data pelanggan diperbarui" });
    setEditOpen(false);
    setEditTarget(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pelanggan dihapus", description: deleteTarget.name });
    setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const stats = {
    total:     customers.length,
    platinum:  customers.filter((c) => c.tier === "Platinum").length,
    gold:      customers.filter((c) => c.tier === "Gold").length,
    available: profiles.length - customers.length,
  };

  const renderTierSelect = () => (
    <div className="grid grid-cols-3 gap-2">
      {(["Regular", "Gold", "Platinum"] as Tier[]).map((t) => {
        const Icon = tierStyles[t].icon;
        const active = form.tier === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => setForm({ ...form, tier: t })}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 transition-all ${
              active ? "border-teal-500 bg-teal-50/50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-teal-600" : "text-gray-400"}`} />
            <span className={`text-xs font-semibold ${active ? "text-teal-700" : "text-gray-600"}`}>{t}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Data Pelanggan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola data pelanggan dari akun yang terdaftar.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="border-gray-200 h-9 rounded-lg"><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Pelanggan
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Pelanggan", value: stats.total,     icon: Users,       color: "from-teal-500 to-teal-600" },
            { label: "Platinum",        value: stats.platinum,  icon: Crown,       color: "from-violet-500 to-violet-600" },
            { label: "Gold",            value: stats.gold,      icon: Award,       color: "from-amber-500 to-amber-600" },
            { label: "Belum Terdaftar", value: stats.available, icon: UserPlus,    color: "from-blue-500 to-blue-600" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <s.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{loading ? "—" : s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, telepon..." className="pl-9 h-9 border-gray-200 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{customers.length === 0 ? "Belum ada pelanggan terdaftar." : "Tidak ada hasil yang cocok."}</p>
              {customers.length === 0 && stats.available > 0 && (
                <p className="text-xs text-gray-400">Klik <span className="font-semibold">Tambah Pelanggan</span> untuk pilih dari {stats.available} akun yang tersedia.</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent bg-gray-50/40">
                      <TableHead className="text-xs font-semibold text-gray-600 py-3 px-5">Pelanggan</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Kontak</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Pesanan</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Tier</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600">Bergabung</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-600 w-12 text-right pr-4">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((customer, idx) => {
                      const TierIcon = tierStyles[customer.tier].icon;
                      return (
                        <motion.tr
                          key={customer.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(idx, 10) * 0.02 }}
                          className="border-gray-50 hover:bg-teal-50/20 transition-colors"
                        >
                          <TableCell className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                                {customer.address && <p className="text-xs text-muted-foreground truncate max-w-[220px]">{customer.address}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-700">{customer.email ?? "-"}</p>
                            <p className="text-xs text-muted-foreground">{customer.phone ?? "Tanpa nomor"}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-gray-900">{orderCounts[customer.name] ?? 0}</span>
                            <span className="text-xs text-muted-foreground ml-1">pesanan</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 ${tierStyles[customer.tier].color}`}>
                              <TierIcon className="h-3 w-3" />
                              {customer.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(customer.created_at)}</TableCell>
                          <TableCell className="text-right pr-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openEdit(customer)} className="text-sm gap-2">
                                  <Pencil className="h-3.5 w-3.5" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(customer)}
                                  className="text-sm gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((customer, idx) => {
                  const TierIcon = tierStyles[customer.tier].icon;
                  return (
                    <div key={customer.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className={`text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}>
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                              <p className="text-xs text-gray-500 truncate">{customer.email ?? "Tanpa email"}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openEdit(customer)} className="text-sm gap-2">
                                  <Pencil className="h-3.5 w-3.5" /> Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(customer)}
                                  className="text-sm gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={`gap-1 text-[10px] ${tierStyles[customer.tier].color}`}>
                              <TierIcon className="h-2.5 w-2.5" />
                              {customer.tier}
                            </Badge>
                            <span className="text-[11px] text-gray-500">{orderCounts[customer.name] ?? 0} pesanan</span>
                            <span className="text-[11px] text-gray-400">• {formatDate(customer.created_at)}</span>
                          </div>
                          {customer.phone && (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</p>
                          )}
                          {customer.address && (
                            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /> <span className="line-clamp-2">{customer.address}</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="p-3 border-t border-gray-100 bg-gray-50/30">
            <span className="text-xs text-muted-foreground">Menampilkan {filtered.length} dari {customers.length} pelanggan</span>
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
                Tambah Pelanggan Baru
              </DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pilih Akun Pelanggan</Label>
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
                      placeholder="Cari akun pelanggan..."
                      className="h-9 pl-9 border-gray-200 text-sm"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {availableProfiles.length === 0 ? (
                      <div className="p-4 text-center">
                        <Info className="h-5 w-5 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-500">
                          {profiles.length === 0
                            ? "Belum ada akun dengan peran pelanggan."
                            : profileSearch
                              ? "Tidak ada akun cocok."
                              : "Semua akun pelanggan sudah terdaftar."}
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

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Phone className="h-3 w-3" /> No. Telepon (opsional)</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxx" className="h-9 border-gray-200 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Alamat (opsional)</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Sudirman No. 1, Jakarta" className="border-gray-200 text-sm min-h-[60px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tier</Label>
                {renderTierSelect()}
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-gray-100 bg-teal-50/40">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-bold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-teal-600" />
                Edit Data Pelanggan
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
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {editTarget.email ?? "-"}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><Phone className="h-3 w-3" /> No. Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxx" className="h-9 border-gray-200 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Alamat</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Jl. Sudirman No. 1, Jakarta" className="border-gray-200 text-sm min-h-[60px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tier</Label>
                {renderTierSelect()}
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
            <AlertDialogTitle>Hapus pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <span className="font-semibold">{deleteTarget?.name}</span> dari daftar pelanggan akan dihapus.
              Akun login user tetap aktif dan bisa kamu tambahkan lagi nanti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
