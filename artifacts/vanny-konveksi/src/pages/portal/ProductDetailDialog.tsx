import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ImageIcon, Tag, X, Phone } from "lucide-react";
import { Product, formatRupiah, productImages, categoryColors } from "./types";

interface Props {
  product: Product | null;
  imageIdx: number;
  setImageIdx: (i: number | ((p: number) => number)) => void;
  onClose: () => void;
}

export default function ProductDetailDialog({ product, imageIdx, setImageIdx, onClose }: Props) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-white rounded-2xl p-0 overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        {product && (() => {
          const imgs = productImages(product);
          const adds = product.sizes?.map((s) => product.size_prices?.[s] ?? 0) ?? [];
          const maxAdd = adds.length ? Math.max(...adds) : 0;
          return (
            <div className="grid md:grid-cols-2">
              {/* Gallery */}
              <div className="bg-gray-50 relative">
                <div className="aspect-square w-full relative overflow-hidden">
                  {imgs.length > 0 ? (
                    <img
                      src={imgs[imageIdx]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  {imgs.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setImageIdx((i) => (i - 1 + imgs.length) % imgs.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageIdx((i) => (i + 1) % imgs.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                      </button>
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded-full">
                        {imageIdx + 1} / {imgs.length}
                      </span>
                    </>
                  )}
                </div>
                {imgs.length > 1 && (
                  <div className="flex gap-1.5 p-3 overflow-x-auto">
                    {imgs.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setImageIdx(i)}
                        className={`w-14 h-14 rounded-md overflow-hidden border-2 flex-shrink-0 transition-colors ${
                          i === imageIdx ? "border-teal-500" : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="p-6 space-y-4 relative">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>

                <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                }`}>
                  <Tag className="h-3 w-3 mr-1 inline" />{product.category}
                </Badge>

                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{product.material}</p>
                </div>

                <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4">
                  <p className="text-[11px] text-teal-700/70 font-medium uppercase tracking-wide">
                    {maxAdd > 0 ? "Harga mulai dari" : "Harga satuan"}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-display font-bold text-teal-700">
                      {formatRupiah(product.price)}
                    </p>
                    {maxAdd > 0 && (
                      <p className="text-sm text-gray-500">
                        s/d {formatRupiah(product.price + maxAdd)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum order {product.min_order} pcs
                  </p>
                </div>

                {product.description && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">
                      Deskripsi
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                      Ukuran tersedia
                    </p>
                    <div className="space-y-1.5">
                      {product.sizes.map((s) => {
                        const add = product.size_prices?.[s] ?? 0;
                        const totalPrice = product.price + add;
                        return (
                          <div
                            key={s}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm font-semibold text-gray-800 w-12">{s}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-teal-700">
                                {formatRupiah(totalPrice)}
                              </span>
                              {add > 0 && (
                                <span className="text-[11px] text-gray-500 ml-1.5">
                                  (+{formatRupiah(add)})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-muted-foreground mb-2">Tertarik memesan produk ini?</p>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-10 text-sm font-semibold transition-colors"
                  >
                    <Phone className="h-4 w-4" /> Hubungi Admin
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
