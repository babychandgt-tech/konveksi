import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Scissors, UserCircle2, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ fullName: "", companyName: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    setLoading(true);
    const { error } = await register(form.email, form.password, form.fullName, "pelanggan", form.companyName);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setLocation("/portal");
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden bg-login-gradient">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px"
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-400/20 flex items-center justify-center border border-teal-400/30">
            <Scissors className="w-4 h-4 text-teal-300" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Vanny Konveksi</h1>
        </div>

        <div className="relative z-10 mb-8">
          <h2 className="text-3xl font-display font-bold text-white leading-tight mb-3">
            Bergabung dengan<br />platform kami
          </h2>
          <p className="text-teal-100/70 text-base leading-relaxed max-w-xs">
            Daftar sebagai pelanggan untuk memesan produk dan melacak status pesananmu kapan saja.
          </p>
        </div>

        <p className="relative z-10 text-sm text-teal-100/40">
          © 2025 Vanny Konveksi. Hak cipta dilindungi.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Vanny Konveksi</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Buat Akun Baru</h2>
            <p className="mt-1 text-sm text-gray-500">
              Daftar sebagai <span className="font-semibold text-teal-700">Pelanggan</span> untuk mulai memesan.
            </p>
            <div className="mt-3 px-3 py-2 rounded-lg bg-teal-50/60 border border-teal-100">
              <p className="text-[11px] text-teal-800 leading-relaxed">
                Untuk akun karyawan, hubungi admin — pendaftaran karyawan dilakukan dari dashboard internal.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <UserCircle2 className="h-3.5 w-3.5 text-gray-400" /> Nama Lengkap
              </Label>
              <Input
                name="fullName"
                placeholder="Budi Santoso"
                value={form.fullName}
                onChange={handleChange}
                className="h-10 border-gray-200 focus-visible:ring-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400" /> Nama Instansi
                <span className="text-[10px] font-normal text-gray-400">(opsional)</span>
              </Label>
              <Input
                name="companyName"
                placeholder="PT Maju Mundur (kosongkan jika perorangan)"
                value={form.companyName}
                onChange={handleChange}
                className="h-10 border-gray-200 focus-visible:ring-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={handleChange}
                className="h-10 border-gray-200 focus-visible:ring-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Kata Sandi</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={handleChange}
                  className="h-10 border-gray-200 focus-visible:ring-teal-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{" "}
              <button
                onClick={() => setLocation("/")}
                className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
