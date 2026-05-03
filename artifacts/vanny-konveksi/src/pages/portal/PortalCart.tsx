import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ShoppingBag, Tag, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem, Section, formatRupiah, productImages } from "./types";

interface Props {
  cartItems: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  setSection: (s: Section) => void;
}

export default function PortalCart({ cartItems, onUpdate, onRemove, setSection }: Props) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  if (cartItems.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">Keranjang Belanja</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Item yang akan kamu pesan</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500 mb-1">Keranjang masih kosong</p>
          <p className="text-xs text-muted-foreground mb-6">Tambahkan produk dari katalog untuk mulai memesan</p>
          <Button
            onClick={() => setSection("katalog")}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 text-sm font-semibold"
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Lihat Katalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">Keranjang Belanja</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{totalQty} item dipilih</p>
        </div>
        <button
          onClick={() => setSection("katalog")}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          + Tambah item
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {cartItems.map((item) => {
            const imgs = productImages(item.product);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {imgs.length > 0 ? (
                    <img src={imgs[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-7 w-7 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.selectedSize && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 font-medium">
                            <Tag className="h-2.5 w-2.5" /> Ukuran {item.selectedSize}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">{formatRupiah(item.unitPrice)}/pcs</span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 italic">"{item.notes}"</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const min = item.product.min_order ?? 1;
                          if (item.qty <= min) onRemove(item.id);
                          else onUpdate(item.id, item.qty - 1);
                        }}
                        className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <span className="text-sm font-bold text-gray-900 min-w-[24px] text-center">{item.qty}</span>
                      <button
                        onClick={() => onUpdate(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-teal-700">{formatRupiah(item.unitPrice * item.qty)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-900">Ringkasan Pesanan</p>
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-600">
            <span className="truncate pr-2">{item.product.name} {item.selectedSize ? `(${item.selectedSize})` : ""} × {item.qty}</span>
            <span className="font-medium flex-shrink-0">{formatRupiah(item.unitPrice * item.qty)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-lg font-display font-bold text-teal-700">{formatRupiah(subtotal)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">*Harga belum termasuk ongkos kirim dan bisa berubah sesuai konfirmasi admin</p>
      </div>

      <Button
        onClick={() => setSection("checkout")}
        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm"
      >
        Lanjut ke Checkout <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
