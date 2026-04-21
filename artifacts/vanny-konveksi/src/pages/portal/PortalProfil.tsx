import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Order, formatRupiah } from "./types";

interface Props {
  profile: { full_name: string } | null;
  orders: Order[];
  initials: string;
}

export default function PortalProfil({ profile, orders, initials }: Props) {
  const stats = {
    total: orders.length,
    aktif: orders.filter((o) => o.status === "baru" || o.status === "produksi").length,
    selesai: orders.filter((o) => o.status === "selesai").length,
    totalNilai: orders.reduce((s, o) => s + o.total, 0),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Profil Saya</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Informasi akun Anda.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-teal-600 h-24 relative">
          <div className="absolute -bottom-8 left-6">
            <Avatar className="w-16 h-16 border-4 border-white shadow-md">
              <AvatarFallback className="bg-teal-700 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-gray-900">{profile?.full_name}</h3>
              <span className="inline-block mt-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-3 py-0.5">
                Pelanggan
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Total Pesanan", value: `${stats.total} pesanan` },
              { label: "Pesanan Selesai", value: `${stats.selesai} pesanan` },
              { label: "Pesanan Aktif", value: `${stats.aktif} pesanan` },
              { label: "Total Nilai Transaksi", value: formatRupiah(stats.totalNilai) },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-muted-foreground mb-1">Butuh bantuan atau update data?</p>
            <p className="text-sm text-gray-700">
              Hubungi admin kami di{" "}
              <a href="tel:081234567890" className="text-teal-600 font-semibold">081234567890</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
