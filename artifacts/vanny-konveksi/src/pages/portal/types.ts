export interface Order {
  id: string;
  product: string;
  qty: number;
  total: number;
  status: "baru" | "produksi" | "selesai" | "batal";
  deadline: string;
  created_at: string;
}

export interface Product {
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
  image_urls: string[] | null;
}

export type Section = "beranda" | "katalog" | "pesanan" | "profil";

export const categoryColors: Record<string, string> = {
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

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export const productImages = (p: Product) =>
  p.image_urls && p.image_urls.length > 0
    ? p.image_urls
    : (p.image_url ? [p.image_url] : []);
