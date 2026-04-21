import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit, PowerOff, Tag, Loader2, RefreshCw, Power } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  min_order: number;
  status: "aktif" | "tidak_aktif";
}

const categoryColors: Record<string, string> = {
  Kaos:    "bg-teal-50 text-teal-700 border-teal-200",
  Kemeja:  "bg-blue-50 text-blue-700 border-blue-200",
  Celana:  "bg-violet-50 text-violet-700 border-violet-200",
  Jaket:   "bg-orange-50 text-orange-700 border-orange-200",
  Seragam: "bg-amber-50 text-amber-700 border-amber-200",
  Rompi:   "bg-pink-50 text-pink-700 border-pink-200",
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const CATEGORIES = ["Kaos", "Kemeja", "Celana", "Jaket", "Seragam", "Rompi", "Lainnya"];
const EMPTY_FORM = { name: "", category: "Kaos", material: "", price: "", min_order: "12" };

export default function Katalog() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("semua");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = ["semua", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchCat = filterCategory === "semua" || p.category === filterCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.material.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      material: form.material,
      price: parseInt(form.price),
      min_order: parseInt(form.min_order),
    };
    const { error } = editProduct
      ? await supabase.from("products").update(payload).eq("id", editProduct.id)
      : await supabase.from("products").insert({ ...payload, status: "aktif" });
    setSaving(false);
    if (error) { toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" }); return; }
    toast({ title: editProduct ? "Produk diperbarui" : "Produk ditambahkan" });
    setAddOpen(false); setEditProduct(null); setForm(EMPTY_FORM);
    fetchProducts();
  };

  const toggleStatus = async (p: Product) => {
    const newStatus = p.status === "aktif" ? "tidak_aktif" : "aktif";
    const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", p.id);
    if (error) { toast({ title: "Gagal update status", variant: "destructive" }); return; }
    toast({ title: `${p.name} → ${newStatus === "aktif" ? "Aktif" : "Tidak Aktif"}` });
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, category: p.category, material: p.material, price: String(p.price), min_order: String(p.min_order) });
    setAddOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Katalog Produk</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola daftar produk dan harga konveksi.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchProducts} className="border-gray-200 h-9 rounded-lg"><RefreshCw className="h-4 w-4" /></Button>
            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setEditProduct(null); setForm(EMPTY_FORM); } }}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display font-bold">{editProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                  </DialogHeader>
                </div>
                <form onSubmit={handleSave} className="p-5 space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nama Produk</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kaos Polos Premium" className="h-9 border-gray-200 text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Kategori</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Min. Order (pcs)</Label>
                      <Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="h-9 border-gray-200 text-sm" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Material / Bahan</Label>
                    <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="Cotton Combed 30s" className="h-9 border-gray-200 text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Harga Satuan (Rp)</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45000" className="h-9 border-gray-200 text-sm" required />
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk atau material..." className="pl-9 h-9 border-gray-200 text-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${filterCategory === cat ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-200 hover:text-teal-700"}`}>
                {cat === "semua" ? "Semua" : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-all ${product.status === "tidak_aktif" ? "opacity-60 border-gray-100" : "border-black/[0.07]"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    <Tag className="h-3 w-3 mr-1 inline" />{product.category}
                  </Badge>
                  <Badge className={`rounded-full px-2.5 text-[11px] font-medium ${product.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {product.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{product.material}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Harga satuan</p>
                    <p className="text-lg font-display font-bold text-teal-700">{formatRp(product.price)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Min. order {product.min_order} pcs</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(product)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-colors">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => toggleStatus(product)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${product.status === "aktif" ? "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200" : "border-teal-200 text-teal-600 hover:bg-teal-50"}`}>
                      {product.status === "aktif" ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {products.length} produk
        </p>
      </div>
    </DashboardLayout>
  );
}
