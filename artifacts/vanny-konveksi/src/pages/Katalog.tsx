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
  description: string | null;
  price: number;
  min_order: number;
  status: "aktif" | "tidak_aktif";
  sizes: string[] | null;
  size_prices: Record<string, number> | null;
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
  description: string;
  price: string;
  min_order: string;
  sizes: string[];
  size_prices: Record<string, string>;
  image_urls: string[];
}

const EMPTY_FORM: FormState = {
  name: "", category: "Kaos", material: "", description: "", price: "", min_order: "12",
  sizes: ["M", "L", "XL"], size_prices: {}, image_urls: [],
};
const MAX_IMAGES = 6;

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
    setForm((f) => {
      if (f.sizes.includes(size)) {
        const { [size]: _, ...rest } = f.size_prices;
        return { ...f, sizes: f.sizes.filter((s) => s !== size), size_prices: rest };
      }
      return { ...f, sizes: [...f.sizes, size] };
    });
  };

  const setSizePrice = (size: string, value: string) => {
    setForm((f) => ({ ...f, size_prices: { ...f.size_prices, [size]: value } }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - form.image_urls.length;
    if (remaining <= 0) {
      toast({ title: `Maksimal ${MAX_IMAGES} gambar per produk`, variant: "destructive" });
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of list) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} dilewati`, description: "Ukuran maksimal 5MB", variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) {
        toast({
          title: "Gagal upload",
          description: error.message + " — pastikan bucket 'product-images' sudah ada (public).",
          variant: "destructive",
        });
        continue;
      }
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
      uploaded.push(data.publicUrl);
    }
    setUploading(false);
    if (uploaded.length > 0) {
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }));
      toast({ title: `${uploaded.length} gambar diupload` });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== idx) }));
  };

  const moveImageToFirst = (idx: number) => {
    setForm((f) => {
      if (idx === 0) return f;
      const arr = [...f.image_urls];
      const [item] = arr.splice(idx, 1);
      arr.unshift(item);
      return { ...f, image_urls: arr };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.sizes.length === 0) {
      toast({ title: "Pilih minimal satu varian ukuran", variant: "destructive" });
      return;
    }
    setSaving(true);
    const sizePricesNum: Record<string, number> = {};
    form.sizes.forEach((s) => {
      const v = parseInt(form.size_prices[s] ?? "0");
      sizePricesNum[s] = isNaN(v) ? 0 : v;
    });
    const payload = {
      name: form.name,
      category: form.category,
      material: form.material,
      description: form.description.trim() || null,
      price: parseInt(form.price),
      min_order: parseInt(form.min_order),
      sizes: form.sizes,
      size_prices: sizePricesNum,
      image_urls: form.image_urls,
      image_url: form.image_urls[0] || null,
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
    const allUrls = [
      ...(deleteTarget.image_urls ?? []),
      ...(deleteTarget.image_url && !(deleteTarget.image_urls ?? []).includes(deleteTarget.image_url)
        ? [deleteTarget.image_url] : []),
    ];
    const paths = allUrls
      .map((u) => u.split(`/${STORAGE_BUCKET}/`).pop())
      .filter((p): p is string => !!p);
    if (paths.length > 0) await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${deleteTarget.name} dihapus` });
    setDeleteTarget(null);
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    const sp: Record<string, string> = {};
    if (p.size_prices) Object.entries(p.size_prices).forEach(([k, v]) => { sp[k] = String(v); });
    const imgs = p.image_urls && p.image_urls.length > 0
      ? p.image_urls
      : (p.image_url ? [p.image_url] : []);
    setForm({
      name: p.name, category: p.category, material: p.material,
      description: p.description ?? "",
      price: String(p.price), min_order: String(p.min_order),
      sizes: p.sizes ?? [], size_prices: sp, image_urls: imgs,
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
                  {/* Images */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Foto Produk <span className="text-gray-400">({form.image_urls.length}/{MAX_IMAGES})</span>
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {form.image_urls.map((url, idx) => (
                        <div
                          key={url}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${
                            idx === 0 ? "border-teal-500" : "border-gray-200"
                          }`}
                        >
                          <img src={url} alt={`foto ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 text-[9px] font-bold bg-teal-600 text-white px-1.5 py-0.5 rounded">
                              UTAMA
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => moveImageToFirst(idx)}
                                className="text-[10px] bg-white text-gray-800 px-1.5 py-0.5 rounded font-semibold hover:bg-teal-50"
                                title="Jadikan utama"
                              >
                                Utama
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              title="Hapus"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {form.image_urls.length < MAX_IMAGES && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/40 transition-colors disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span className="text-[10px] font-medium">Tambah</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {form.image_urls.length === 0 && (
                      <p className="text-[10px] text-gray-400">Bisa pilih beberapa gambar sekaligus. Gambar pertama jadi foto utama.</p>
                    )}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Material / Bahan</Label>
                    <Input
                      value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}
                      placeholder="Cotton Combed 30s" className="h-9 border-gray-200 text-sm" required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Deskripsi <span className="text-gray-400">(opsional)</span>
                    </Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Detail produk, keterangan finishing, sablon, dll."
                      rows={3}
                      maxLength={500}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 text-right">{form.description.length}/500</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Harga Dasar (Rp)</Label>
                    <Input
                      type="number" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="45000" className="h-9 border-gray-200 text-sm" required
                    />
                  </div>

                  {/* Sizes + per-size price additions */}
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
                    {form.sizes.length > 0 && (
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5 space-y-1.5">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">
                          Tambahan harga per ukuran (Rp)
                        </p>
                        {form.sizes.map((size) => (
                          <div key={size} className="flex items-center gap-2">
                            <span className="w-12 text-xs font-semibold text-gray-700">{size}</span>
                            <span className="text-xs text-gray-400">+</span>
                            <Input
                              type="number" min="0"
                              value={form.size_prices[size] ?? ""}
                              onChange={(e) => setSizePrice(size, e.target.value)}
                              placeholder="0"
                              className="h-8 border-gray-200 text-sm flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
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
                  {(() => {
                    const imgs = product.image_urls && product.image_urls.length > 0
                      ? product.image_urls
                      : (product.image_url ? [product.image_url] : []);
                    return imgs.length > 0 ? (
                      <>
                        <img
                          src={imgs[0]} alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {imgs.length > 1 && (
                          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm inline-flex items-center gap-1">
                            <ImageIcon className="h-2.5 w-2.5" /> +{imgs.length - 1}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-gray-300" />
                      </div>
                    );
                  })()}
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
                  <p className="text-xs text-muted-foreground mb-1.5">{product.material}</p>
                  {product.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed" title={product.description}>
                      {product.description}
                    </p>
                  )}

                  {/* Sizes with per-size additions */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.sizes.map((s) => {
                        const add = product.size_prices?.[s] ?? 0;
                        return (
                          <span
                            key={s}
                            title={add > 0 ? `+${formatRp(add)}` : "Harga dasar"}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100 inline-flex items-center gap-0.5"
                          >
                            {s}
                            {add > 0 && (
                              <span className="text-[9px] font-medium text-teal-500">
                                +{add >= 1000 ? `${Math.round(add / 1000)}k` : add}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-end justify-between">
                    <div>
                      {(() => {
                        const adds = product.sizes?.map((s) => product.size_prices?.[s] ?? 0) ?? [];
                        const maxAdd = adds.length ? Math.max(...adds) : 0;
                        return (
                          <>
                            <p className="text-xs text-muted-foreground mb-0.5">
                              Harga {maxAdd > 0 ? "mulai" : "satuan"}
                            </p>
                            <p className="text-lg font-display font-bold text-teal-700 leading-tight">
                              {formatRp(product.price)}
                            </p>
                            {maxAdd > 0 && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                s/d {formatRp(product.price + maxAdd)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">Min. order {product.min_order} pcs</p>
                          </>
                        );
                      })()}
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
