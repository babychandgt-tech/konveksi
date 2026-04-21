import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Scissors, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, profile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await login(form.email, form.password);
    setLoading(false);
    if (error) {
      setError("Email atau kata sandi salah. Silakan coba lagi.");
      return;
    }
  };

  const features = [
    { icon: BarChart3, title: "Analitik Real-time", desc: "Pantau pendapatan dan pesanan dengan dashboard interaktif." },
    { icon: Scissors, title: "Manajemen Produksi", desc: "Alur kerja Kanban untuk cutting, jahit, hingga finishing." },
    { icon: Users, title: "Sistem Terpusat", desc: "Kelola pelanggan, pegawai, dan katalog dalam satu tempat." },
  ];

  return (
    <div className="min-h-screen flex font-sans">
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden bg-login-gradient">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px"
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-400/20 flex items-center justify-center border border-teal-400/30">
              <Scissors className="w-5 h-5 text-teal-300" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              Vanny Konveksi
            </h1>
          </div>
          <p className="text-teal-100/70 text-lg font-medium max-w-sm leading-relaxed">
            Produksi Seragam, Mudah & Terpercaya
          </p>
        </motion.div>

        <div className="space-y-4 mb-10 relative z-10 max-w-md">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + idx * 0.1 }}
              className="flex items-start p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-teal-400/15 border border-teal-400/20 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-teal-300" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="mt-0.5 text-xs text-teal-100/60 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-sm text-teal-100/40">© 2025 Vanny Konveksi. Hak cipta dilindungi.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-16 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Vanny Konveksi</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900">Selamat Datang Kembali</h2>
            <p className="mt-1.5 text-sm text-gray-500">Masuk ke panel manajemen konveksi Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={handleChange}
                className="h-11 rounded-lg border-gray-200 focus-visible:ring-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="h-11 rounded-lg border-gray-200 focus-visible:ring-teal-500 pr-11"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                Lupa kata sandi?
              </a>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm shadow-teal-500/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Memproses..." : "Masuk Sekarang"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Daftar di sini
              </button>
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Butuh bantuan? Hubungi administrator sistem.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
