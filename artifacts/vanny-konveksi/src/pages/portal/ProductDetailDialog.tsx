import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ImageIcon, Tag, X, ShoppingCart, Minus, Plus } from "lucide-react";
import { Product, CartItem, formatRupiah, productImages, categoryColors } from "./types";

interface Props {
  product: Product | null;
  imageIdx: number;
  setImageIdx: (i: number | ((p: number) => number)) => void;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductDetailDialog({ product, imageIdx, setImageIdx, onClose, onAddToCart }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  const handleOpen = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedSize(null);
      setQty(1);
      setNotes("");
      setAdded(false);
    }
  };

  const handleAdd = () => {
    if (!product) return;
    const sizeAdd = selectedSize ? (product.size_prices?.[selectedSize] ?? 0) : 0;
    const unitPrice = product.price + sizeAdd;
    const cartItem: CartItem = {
      id: `${product.id}-${selectedSize ?? "default"}-${Date.now()}`,
      product,
      qty,
      selectedSize,
      unitPrice,
      notes,
    };
    onAddToCart(cartItem);
    setAdded(true);
    setTimeout(() => {
      onClose();
      setSelectedSize(null);
      setQty(1);
      setNotes("");
      setAdded(false);
    }, 800);
  };

  return (
    <Dialog open={!!product} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl bg-white rounded-2xl p-0 overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        {product && (() => {
          const imgs = productImages(product);
          const hasSizes = product.sizes && product.sizes.length > 0;
          const sizeAdd = selectedSize ? (product.size_prices?.[selectedSize] ?? 0) : 0;
          const unitPrice = product.price + sizeAdd;
          const canAdd = !hasSizes || selectedSize !== null;
          const minQty = product.min_order ?? 1;

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
              <div className="p-6 space-y-4 relative flex flex-col">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>

                <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${
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
                    {selectedSize ? `Harga ukuran ${selectedSize}` : hasSizes ? "Harga mulai dari" : "Harga satuan"}
                  </p>
                  <p className="text-2xl font-display font-bold text-teal-700 mt-1">
                    {formatRupiah(unitPrice)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum order {minQty} pcs
                  </p>
                </div>

                {product.description && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">
                      Deskripsi
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Size selector */}
                {hasSizes && (
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                      Pilih Ukuran <span className="text-red-500">*</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes!.map((s) => {
                        const add = product.size_prices?.[s] ?? 0;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
                              selectedSize === s
                                ? "border-teal-500 bg-teal-50 text-teal-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-teal-300"
                            }`}
                          >
                            {s}
                            {add > 0 && <span className="text-[10px] ml-1 font-normal text-gray-400">+{formatRupiah(add)}</span>}
                          </button>
                        );
                      })}
                    </div>
                    {!selectedSize && (
                      <p className="text-[11px] text-orange-500 mt-1.5">Pilih ukuran terlebih dahulu</p>
                    )}
                  </div>
                )}

                {/* Qty */}
                <div>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                    Jumlah (min. {minQty} pcs)
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[32px] text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-500">
                      = <span className="font-semibold text-teal-700">{formatRupiah(unitPrice * qty)}</span>
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">
                    Catatan (opsional)
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Warna, desain khusus, atau keterangan lain..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
                  />
                </div>

                {/* Add to cart button */}
                <div className="pt-2 border-t border-gray-100 mt-auto">
                  <Button
                    onClick={handleAdd}
                    disabled={!canAdd || added}
                    className={`w-full h-11 font-semibold rounded-xl text-sm transition-all ${
                      added
                        ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {added ? "Ditambahkan ke Keranjang!" : `Tambah ke Keranjang — ${formatRupiah(unitPrice * qty)}`}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
