import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Edit, PowerOff, Tag, Loader2, RefreshCw, Power,
  Trash2, Upload, ImageIcon, X,
} from "lucide-react";
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
  sizes: string[] | null;
  image_url: string | null;
}

const categoryColors: Record<string, string> = {
  Kaos:           "bg-teal-50 text-teal-700 border-teal-200",
  Polo:           "bg-cyan-50 text-cyan-700 border-cyan-200",
  Kemeja:         "bg-blue-50 text-blue-700 border-blue-200",
  "Baju Sekolah": "bg-indigo-50 text-indigo-700 border-indigo-200",
  Olahraga:       "bg-rose-50 text-rose-700 border-rose-200",
  Seragam:        "bg-amber-50 text-amber-700 border-amber-200",
  Celana:         "bg-violet-50 text-violet-700 border-violet-200",
  Jaket:          "bg-orange-50 text-orange-700 border-orange-200",
  Rompi:          "bg-pink-50 text-pink-700 border-pink-200",
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const CATEGORIES = [
  "Kaos", "Polo", "Kemeja", "Baju Sekolah", "Olahraga",
  "Seragam", "Celana", "Jaket", "Rompi", "Lainnya",
];
const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const STORAGE_BUCKET = "product-images";

interface FormState {
  name: string;
  category: string;
  material: string;
  price: string;
  min_order: string;
  sizes: string[];
  image_url: string;
}

const EMPTY_FORM: FormState = {
  name: "", category: "Kaos", material: "", price: "", min_order: "12",
  sizes: ["M", "L", "XL"], image_url: "",
};

export default function Katalog() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("semua");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.material.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ukuran maksimal 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
      cacheControl: "3600", upsert: false,
    });
    setUploading(false);
    if (error) {
      toast({
        title: "Gagal upload gambar",
        description: error.message + " — pastikan bucket 'product-images' sudah dibuat (public) di Supabase.",
        variant: "destructive",
      });
      return;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    toast({ title: "Gambar berhasil diupload" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.sizes.length === 0) {
      toast({ title: "Pilih minimal satu varian ukuran", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      category: form.category,
      material: form.material,
      price: parseInt(form.price),
      min_order: parseInt(form.min_order),
      sizes: form.sizes,
      image_url: form.image_url || null,
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.image_url) {
      const path = deleteTarget.image_url.split(`/${STORAGE_BUCKET}/`).pop();
      if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    }
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${deleteTarget.name} dihapus` });
    setDeleteTarget(null);
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name, category: p.category, material: p.material,
      price: String(p.price), min_order: String(p.min_order),
      sizes: p.sizes ?? [], image_url: p.image_url ?? "",
    });
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
            <Button variant="outline" size="sm" onClick={fetchProducts} className="border-gray-200 h-9 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setEditProduct(null); setForm(EMPTY_FORM); } }}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Produk
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl p-0 overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-100 bg-teal-50/40">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display font-bold">
                      {editProduct ? "Edit Produk" : "Tambah Produk Baru"}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <form onSubmit={handleSave} className="p-5 space-y-3.5">
                  {/* Image */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Foto Produk</Label>
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-20 rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {form.image_url ? (
                          <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        />
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="h-8 text-xs border-gray-200 rounded-md w-full"
                        >
                          {uploading ? (
                            <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Mengupload...</>
                          ) : (
                            <><Upload className="h-3 w-3 mr-1.5" /> {form.image_url ? "Ganti Gambar" : "Pilih Gambar"}</>
                          )}
                        </Button>
                        {form.image_url && (
                          <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => setForm({ ...form, image_url: "" })}
                            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 w-full"
                          >
                            <X className="h-3 w-3 mr-1" /> Hapus gambar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nama Produk</Label>
                    <Input
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Kaos Polos Premium" className="h-9 border-gray-200 text-sm" required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Kategori</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger className="h-9 border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Min. Order (pcs)</Label>
                      <Input
                        type="number" value={form.min_order}
                        onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                        className="h-9 border-gray-200 text-sm" required
                      />
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Varian Ukuran <span className="text-gray-400">({form.sizes.length} dipilih)</span>
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_OPTIONS.map((size) => {
                        const active = form.sizes.includes(size);
                        return (
                          <button
                            key={size} type="button" onClick={() => toggleSize(size)}
                            className={`px-3 h-8 rounded-md text-xs font-semibold border transition-colors ${
                              active
                                ? "bg-teal-600 text-white border-teal-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Material / Bahan</Label>
                    <Input
                      value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                      placeholder="Cotton Combed 30s" className="h-9 border-gray-200 text-sm" required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Harga Satuan (Rp)</Label>
                    <Input
                      type="number" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="45000" className="h-9 border-gray-200 text-sm" required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button" variant="outline"
                      onClick={() => setAddOpen(false)}
                      className="border-gray-200 rounded-lg h-9 text-sm"
                    >Batal</Button>
                    <Button
                      type="submit" disabled={saving || uploading}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-9 text-sm font-semibold"
                    >
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
            <Input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk atau material..."
              className="pl-9 h-9 border-gray-200 text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filterCategory === cat
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-200 hover:text-teal-700"
                }`}
              >
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
                className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${
                  product.status === "tidak_aktif" ? "opacity-60 border-gray-100" : "border-black/[0.07]"
                }`}
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url} alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                  <Badge className={`absolute top-2.5 right-2.5 rounded-full px-2.5 text-[11px] font-medium ${
                    product.status === "aktif"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {product.status === "aktif" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>

                <div className="p-5">
                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium mb-3 ${
                    categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    <Tag className="h-3 w-3 mr-1 inline" />{product.category}
                  </Badge>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.material}</p>

                  {/* Sizes */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.sizes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Harga satuan</p>
                      <p className="text-lg font-display font-bold text-teal-700">{formatRp(product.price)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Min. order {product.min_order} pcs</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(product)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleStatus(product)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                          product.status === "aktif"
                            ? "border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200"
                            : "border-teal-200 text-teal-600 hover:bg-teal-50"
                        }`}
                        title={product.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {product.status === "aktif" ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <span className="font-semibold text-gray-900">{deleteTarget?.name}</span> akan
              dihapus permanen beserta gambarnya. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
