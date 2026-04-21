import { motion } from "framer-motion";
import { Loader2, Search, Tag, ImageIcon, ChevronRight, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product, formatRupiah, productImages, categoryColors } from "./types";

interface Props {
  products: Product[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  onOpenProduct: (p: Product) => void;
}

export default function PortalKatalog({
  products, loading, search, setSearch, filterCategory, setFilterCategory, onOpenProduct,
}: Props) {
  const productCategories = ["semua", ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === "semua" || p.category === filterCategory;
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.material.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Katalog Produk</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lihat semua produk yang tersedia. Klik produk untuk lihat detail.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau bahan..."
            className="pl-9 h-9 border-gray-200 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {productCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
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
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {products.length === 0 ? "Belum ada produk tersedia" : "Tidak ada produk yang cocok"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {filteredProducts.map((product, idx) => {
            const imgs = productImages(product);
            const adds = product.sizes?.map((s) => product.size_prices?.[s] ?? 0) ?? [];
            const maxAdd = adds.length ? Math.max(...adds) : 0;
            return (
              <motion.button
                key={product.id}
                type="button"
                onClick={() => onOpenProduct(product)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="text-left bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden hover:shadow-md hover:border-teal-200 transition-all group"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                  {imgs.length > 0 ? (
                    <>
                      <img
                        src={imgs[0]}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {imgs.length > 1 && (
                        <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          <ImageIcon className="h-2.5 w-2.5" /> +{imgs.length - 1}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium mb-2 ${
                    categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    <Tag className="h-3 w-3 mr-1 inline" />{product.category}
                  </Badge>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-snug line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{product.material}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        {maxAdd > 0 ? "Mulai" : "Harga"}
                      </p>
                      <p className="text-base font-display font-bold text-teal-700 leading-tight">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Min. {product.min_order} pcs
                      </p>
                    </div>
                    <span className="text-xs font-medium text-teal-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      Detail <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Menampilkan {filteredProducts.length} dari {products.length} produk aktif
      </p>
    </div>
  );
}
