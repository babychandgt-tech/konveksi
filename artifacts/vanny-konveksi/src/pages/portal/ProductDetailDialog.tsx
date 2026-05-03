import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, ImageIcon, Tag, X,
  ShoppingCart, Minus, Plus, Check,
} from "lucide-react";
import { Product, CartItem, formatRupiah, productImages, categoryColors } from "./types";

interface Props {
  product: Product | null;
  imageIdx: number;
  setImageIdx: (i: number | ((p: number) => number)) => void;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

function ImageGallery({
  imgs, imageIdx, setImageIdx, productName,
}: {
  imgs: string[]; imageIdx: number;
  setImageIdx: (i: number | ((p: number) => number)) => void;
  productName: string;
}) {
  return (
    <div className="relative bg-gray-100 select-none">
      {/* Main image */}
      <div className="relative overflow-hidden" style={{ height: "clamp(200px, 50vw, 300px)" }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imageIdx}
            src={imgs[imageIdx]}
            alt={productName}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Nav arrows */}
        {imgs.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setImageIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center active:bg-white/95 z-10"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => setImageIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm shadow flex items-center justify-center active:bg-white/95 z-10"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {imgs.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImageIdx(i)}
                className={`transition-all rounded-full ${
                  i === imageIdx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
          {imgs.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setImageIdx(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                i === imageIdx
                  ? "border-teal-500 scale-105 shadow-sm"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile bottom sheet ────────────────────────────────── */
function MobileSheet({
  product, imageIdx, setImageIdx, onClose, onAddToCart,
}: Props & { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(product.min_order ?? 1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQty(product.min_order ?? 1);
    setSelectedSize(null);
    setNotes("");
    setAdded(false);
  }, [product.id]);

  const imgs = productImages(product);
  const hasSizes = product.sizes && product.sizes.length > 0;
  const sizeAdd = selectedSize ? (product.size_prices?.[selectedSize] ?? 0) : 0;
  const unitPrice = product.price + sizeAdd;
  const canAdd = !hasSizes || selectedSize !== null;
  const minQty = product.min_order ?? 1;

  const handleAdd = () => {
    const cartItem: CartItem = {
      id: `${product.id}-${selectedSize ?? "default"}-${Date.now()}`,
      product, qty, selectedSize,
      unitPrice, notes,
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
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "94dvh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Gallery — fixed, not scrollable */}
        <div className="shrink-0">
          {imgs.length > 0 ? (
            <ImageGallery imgs={imgs} imageIdx={imageIdx} setImageIdx={setImageIdx} productName={product.name} />
          ) : (
            <div className="flex items-center justify-center bg-gray-50" style={{ height: 180 }}>
              <ImageIcon className="h-12 w-12 text-gray-200" />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-medium mb-1.5 ${
                categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
              }`}>
                <Tag className="h-2.5 w-2.5 mr-1 inline" />{product.category}
              </Badge>
              <h2 className="text-lg font-display font-bold text-gray-900 leading-snug">{product.name}</h2>
              {product.material && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.material}</p>
              )}
            </div>
            {/* Price pill */}
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-teal-600/70 font-medium">
                {selectedSize ? `Ukuran ${selectedSize}` : hasSizes ? "Mulai" : "Satuan"}
              </p>
              <p className="text-xl font-bold text-teal-700">{formatRupiah(unitPrice)}</p>
              <p className="text-[10px] text-gray-400">min. {minQty} pcs</p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Size selector */}
          {hasSizes && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                Ukuran <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map((s) => {
                  const add = product.size_prices?.[s] ?? 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                        selectedSize === s
                          ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
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
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
              Jumlah (min. {minQty} pcs)
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={qty <= minQty}
                onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                className="w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-gray-200 active:bg-gray-50"
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-lg font-bold text-gray-900 min-w-[36px] text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center active:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
              <div className="flex-1 text-right">
                <p className="text-[10px] text-gray-400">Subtotal</p>
                <p className="text-base font-bold text-teal-700">{formatRupiah(unitPrice * qty)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">
              Catatan (opsional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Warna, desain khusus, atau keterangan lain..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
            />
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white/90 backdrop-blur-sm">
          <Button
            onClick={handleAdd}
            disabled={!canAdd || added}
            className={`w-full h-12 font-bold rounded-2xl text-sm transition-all ${
              added
                ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4 mr-2" /> Ditambahkan ke Keranjang!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Tambah — {formatRupiah(unitPrice * qty)}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Desktop dialog (unchanged look) ───────────────────── */
function DesktopDialog({
  product, imageIdx, setImageIdx, onClose, onAddToCart,
}: Props & { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(product.min_order ?? 1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setQty(product.min_order ?? 1);
    setSelectedSize(null);
    setNotes("");
    setAdded(false);
  }, [product.id]);

  const imgs = productImages(product);
  const hasSizes = product.sizes && product.sizes.length > 0;
  const sizeAdd = selectedSize ? (product.size_prices?.[selectedSize] ?? 0) : 0;
  const unitPrice = product.price + sizeAdd;
  const canAdd = !hasSizes || selectedSize !== null;
  const minQty = product.min_order ?? 1;

  const handleAdd = () => {
    const cartItem: CartItem = {
      id: `${product.id}-${selectedSize ?? "default"}-${Date.now()}`,
      product, qty, selectedSize,
      unitPrice, notes,
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl bg-white rounded-2xl p-0 overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="grid md:grid-cols-2">
          {/* Gallery */}
          <div className="bg-gray-50 relative">
            <div className="aspect-square w-full relative overflow-hidden">
              {imgs.length > 0 ? (
                <img src={imgs[imageIdx]} alt={product.name} className="w-full h-full object-cover" />
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
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>

            <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${
              categoryColors[product.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
            }`}>
              <Tag className="h-3 w-3 mr-1 inline" />{product.category}
            </Badge>

            <div>
              <h2 className="text-xl font-display font-bold text-gray-900 leading-tight">{product.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{product.material}</p>
            </div>

            <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4">
              <p className="text-[11px] text-teal-700/70 font-medium uppercase tracking-wide">
                {selectedSize ? `Harga ukuran ${selectedSize}` : hasSizes ? "Harga mulai dari" : "Harga satuan"}
              </p>
              <p className="text-2xl font-display font-bold text-teal-700 mt-1">{formatRupiah(unitPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">Minimum order {minQty} pcs</p>
            </div>

            {product.description && (
              <div>
                <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">Deskripsi</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line line-clamp-3">{product.description}</p>
              </div>
            )}

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

            <div>
              <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-2">
                Jumlah (min. {minQty} pcs)
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={qty <= minQty}
                  onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-gray-200 hover:enabled:bg-gray-100"
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

            <div>
              <p className="text-[11px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">Catatan (opsional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Warna, desain khusus, atau keterangan lain..."
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 mt-auto">
              <Button
                onClick={handleAdd}
                disabled={!canAdd || added}
                className={`w-full h-11 font-semibold rounded-xl text-sm transition-all ${
                  added ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-teal-600 hover:bg-teal-700 text-white"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {added ? "Ditambahkan ke Keranjang!" : `Tambah ke Keranjang — ${formatRupiah(unitPrice * qty)}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main export — detects mobile vs desktop ────────────── */
export default function ProductDetailDialog(props: Props) {
  const { product } = props;
  if (!product) return null;

  const isMobile = window.innerWidth < 768;

  return isMobile
    ? <MobileSheet {...props} product={product} />
    : <DesktopDialog {...props} product={product} />;
}
