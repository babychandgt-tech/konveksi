import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartItem, Section, formatRupiah } from "./types";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface Props {
  cartItems: CartItem[];
  profile: { id: string; full_name: string; email?: string } | null;
  onSuccess: () => void;
  setSection: (s: Section) => void;
}

export default function PortalCheckout({ cartItems, profile, onSuccess, setSection }: Props) {
  const [form, setForm] = useState({
    name: profile?.full_name ?? "",
    email: profile?.email ?? "",
    phone: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapReady, setSnapReady] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY ?? "";

  useEffect(() => {
    if (!clientKey) return;
    if (document.getElementById("midtrans-snap")) {
      setSnapReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => setSnapReady(true);
    script.onerror = () => setError("Gagal memuat Midtrans Snap.js. Periksa koneksi internet Anda.");
    document.head.appendChild(script);
    return () => {};
  }, [clientKey]);

  const handlePayment = async () => {
    setError(null);
    if (!form.name || !form.email || !form.phone) {
      setError("Nama, email, dan nomor telepon wajib diisi.");
      return;
    }
    if (!clientKey) {
      setError("Konfigurasi payment gateway belum lengkap. Hubungi admin.");
      return;
    }
    if (!snapReady || !window.snap) {
      setError("Payment gateway belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }

    setLoading(true);
    try {
      const orderId = `VK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const itemDetails = cartItems.map((item) => ({
        id: item.product.id,
        name: `${item.product.name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`,
        price: item.unitPrice,
        quantity: item.qty,
      }));

      const res = await fetch(`/api/payment/create-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: subtotal,
          customer: { name: form.name, email: form.email, phone: form.phone },
          items: itemDetails,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Gagal membuat transaksi. Coba lagi.");
      }

      const { token } = (await res.json()) as { token: string };
      setLoading(false);

      window.snap.pay(token, {
        onSuccess: async () => {
          try {
            await createOrders(orderId);
            onSuccess();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Pembayaran berhasil tapi pesanan gagal disimpan. Hubungi admin.");
          }
        },
        onPending: async () => {
          try {
            await createOrders(orderId);
            onSuccess();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Pembayaran pending tapi pesanan gagal disimpan. Hubungi admin.");
          }
        },
        onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
        onClose: () => {},
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    }
  };

  const createOrders = async (orderId: string) => {
    for (const item of cartItems) {
      const { error } = await supabase.from("orders").insert({
        id: `${orderId}-${item.id.slice(-6)}`,
        customer_id: profile?.id ?? null,
        customer_name: form.name,
        product: `${item.product.name}${item.selectedSize ? ` (${item.selectedSize})` : ""}`,
        qty: item.qty,
        total: item.unitPrice * item.qty,
        status: "baru",
        deadline: null,
      });
      if (error) {
        console.error("Gagal simpan pesanan:", error);
        throw new Error(`Gagal menyimpan pesanan: ${error.message}`);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-4">Keranjang kosong</p>
        <Button onClick={() => setSection("keranjang")} variant="outline" className="rounded-xl">
          Kembali ke Keranjang
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSection("keranjang")}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-display font-bold text-gray-900">Checkout</h2>
          <p className="text-sm text-muted-foreground">Lengkapi data untuk melanjutkan pembayaran</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!clientKey && (
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Payment gateway (Midtrans) belum dikonfigurasi. Fitur pembayaran belum aktif.</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-900">Data Pemesan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Nama Lengkap <span className="text-red-500">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nama lengkap"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@contoh.com"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">No. Telepon / WhatsApp <span className="text-red-500">*</span></Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="08xxxxxxxxxx"
              className="h-10 text-sm border-gray-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">Alamat Pengiriman</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Alamat lengkap"
              className="h-10 text-sm border-gray-200"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-600">Catatan Tambahan</Label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Permintaan khusus, warna, desain, dll..."
            rows={2}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-900">Ringkasan Pesanan</p>
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-gray-600">
            <span className="truncate pr-2">{item.product.name} {item.selectedSize ? `(${item.selectedSize})` : ""} × {item.qty}</span>
            <span className="font-medium flex-shrink-0">{formatRupiah(item.unitPrice * item.qty)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Pembayaran</span>
          <span className="text-xl font-display font-bold text-teal-700">{formatRupiah(subtotal)}</span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading || !clientKey}
        className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
        ) : (
          <><CreditCard className="h-4 w-4 mr-2" /> Bayar Sekarang — {formatRupiah(subtotal)}</>
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground">
        Pembayaran diproses oleh Midtrans. Kami mendukung transfer bank, kartu kredit, e-wallet, dan QRIS.
      </p>
    </div>
  );
}
