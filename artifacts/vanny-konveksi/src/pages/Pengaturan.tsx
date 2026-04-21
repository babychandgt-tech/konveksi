import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Building2, Phone, Mail, MapPin, CreditCard, Shield } from "lucide-react";

export default function Pengaturan() {
  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Kelola konfigurasi bisnis dan preferensi sistem.</p>
        </div>

        <Tabs defaultValue="profil" className="w-full">
          <TabsList className="mb-5 border-b border-gray-100 rounded-none h-auto p-0 bg-transparent w-full justify-start gap-0">
            <TabsTrigger
              value="profil"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:text-teal-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 py-3 px-5 text-sm font-medium"
            >
              Profil Toko
            </TabsTrigger>
            <TabsTrigger
              value="pembayaran"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:text-teal-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 py-3 px-5 text-sm font-medium"
            >
              Metode Pembayaran
            </TabsTrigger>
            <TabsTrigger
              value="akses"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:text-teal-700 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 py-3 px-5 text-sm font-medium"
            >
              Hak Akses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Informasi Bisnis</h2>
                  <p className="text-xs text-muted-foreground">Perbarui informasi dasar usaha Anda.</p>
                </div>
              </div>
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" /> Nama Usaha / Toko
                    </Label>
                    <Input
                      defaultValue="Vanny Konveksi"
                      className="border-gray-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-9 text-sm"
                      data-testid="input-nama-usaha"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" /> Nomor WhatsApp
                    </Label>
                    <Input
                      defaultValue="081234567890"
                      className="border-gray-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-9 text-sm"
                      data-testid="input-whatsapp"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Bisnis
                    </Label>
                    <Input
                      defaultValue="info@vannykonveksi.com"
                      className="border-gray-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 h-9 text-sm"
                      data-testid="input-email-bisnis"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" /> Alamat Lengkap
                    </Label>
                    <Textarea
                      defaultValue="Jl. Kebon Jeruk Raya No. 45, Jakarta Barat, 11530"
                      rows={2}
                      className="border-gray-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-sm resize-none"
                      data-testid="input-alamat"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Deskripsi Singkat</Label>
                    <Textarea
                      defaultValue="Vanny Konveksi adalah penyedia jasa pembuatan seragam kantor, sekolah, dan komunitas terpercaya sejak 2015."
                      rows={2}
                      className="border-gray-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-sm resize-none"
                      data-testid="input-deskripsi"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg h-9 text-sm shadow-sm shadow-teal-500/20" data-testid="button-simpan-profil">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="pembayaran">
            <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Metode Pembayaran Aktif</h2>
                  <p className="text-xs text-muted-foreground">Pilih metode yang diterima dari pelanggan.</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Transfer Bank", desc: "Menerima transfer via BCA, Mandiri, BNI", active: true },
                  { label: "QRIS / E-Wallet", desc: "Menerima pembayaran via GoPay, OVO, Dana", active: true },
                  { label: "Sistem Termin / Cicilan", desc: "Izinkan DP 50% untuk pesanan di atas Rp 5 Juta", active: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      defaultChecked={item.active}
                      className="data-[state=checked]:bg-teal-600"
                      data-testid={`switch-payment-${idx}`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg h-9 text-sm shadow-sm shadow-teal-500/20" data-testid="button-simpan-pembayaran">
                  Simpan Pengaturan
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="akses">
            <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Manajemen Hak Akses</h2>
                  <p className="text-xs text-muted-foreground">Kelola fitur yang dapat diakses setiap peran.</p>
                </div>
              </div>

              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Konfigurasi hak akses detail</p>
                <p className="text-xs text-muted-foreground mt-1">Tersedia di versi Enterprise.</p>
                <Button variant="outline" className="mt-4 border-teal-200 text-teal-700 hover:bg-teal-50 rounded-lg h-8 text-xs" data-testid="button-hubungi-support">
                  Hubungi Support
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
