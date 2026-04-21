import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { ShoppingCart, Users, Wallet, TrendingUp, ArrowRight, Package, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";

type OrderStatus = "baru" | "produksi" | "selesai" | "batal";

const STATUS_CFG: Record<OrderStatus, string> = {
  baru:     "bg-teal-50 text-teal-700 border-teal-200",
  produksi: "bg-amber-50 text-amber-700 border-amber-200",
  selesai:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  batal:    "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Baru", produksi: "Produksi", selesai: "Selesai", batal: "Batal",
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(n);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const STAGE_COLORS: Record<string, string> = {
  antrian: "#0D9488", cutting: "#14B8A6", jahit: "#F59E0B", finishing: "#10B981",
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ total: 0, aktif: 0, pegawai: 0, pendapatan: 0 });
  const [chartPesanan, setChartPesanan] = useState<{ name: string; masuk: number }[]>([]);
  const [chartProduksi, setChartProduksi] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [ordersRes, employeesRes, transactionsRes, productionRes] = await Promise.all([
        supabase.from("orders").select("id, customer_name, product, status, created_at, qty"),
        supabase.from("employees").select("status"),
        supabase.from("transactions").select("amount, type, date"),
        supabase.from("production_tasks").select("stage"),
      ]);

      const orders = ordersRes.data ?? [];
      const employees = employeesRes.data ?? [];
      const transactions = transactionsRes.data ?? [];
      const production = productionRes.data ?? [];

      // Stats
      const aktif = orders.filter((o) => o.status === "baru" || o.status === "produksi").length;
      const pegawai = employees.filter((e) => e.status === "aktif").length;
      const now = new Date();
      const pendapatan = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return t.type === "masuk" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, t) => s + t.amount, 0);

      setStats({ total: orders.length, aktif, pegawai, pendapatan });

      // Chart: pesanan per bulan (last 6 months)
      const monthCounts: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthCounts[key] = 0;
      }
      orders.forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in monthCounts) monthCounts[key]++;
      });
      const chartData = Object.entries(monthCounts).map(([key, masuk]) => {
        const [y, m] = key.split("-").map(Number);
        return { name: MONTHS[m], masuk };
      });
      setChartPesanan(chartData);

      // Chart: produksi by stage
      const stageCounts: Record<string, number> = { antrian: 0, cutting: 0, jahit: 0, finishing: 0 };
      production.forEach((p) => { if (p.stage in stageCounts) stageCounts[p.stage]++; });
      const total = Object.values(stageCounts).reduce((s, v) => s + v, 0) || 1;
      const stageLabels: Record<string, string> = { antrian: "Antrian", cutting: "Cutting", jahit: "Jahit", finishing: "Finishing" };
      setChartProduksi(
        Object.entries(stageCounts).map(([key, val]) => ({
          name: stageLabels[key],
          value: Math.round((val / total) * 100),
          color: STAGE_COLORS[key],
        }))
      );

      // Recent orders (last 5)
      const recent = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(recent);

      setLoading(false);
    };

    fetchAll();
  }, []);

  const statCards = [
    { title: "Total Pesanan",       value: loading ? "—" : stats.total.toString(),      trend: "",     icon: ShoppingCart, iconBg: "bg-teal-50",   iconColor: "text-teal-600",   trendColor: "" },
    { title: "Pesanan Aktif",       value: loading ? "—" : stats.aktif.toString(),      trend: "",     icon: Package,      iconBg: "bg-blue-50",   iconColor: "text-blue-600",   trendColor: "" },
    { title: "Pegawai Aktif",       value: loading ? "—" : stats.pegawai.toString(),    trend: "",     icon: Users,        iconBg: "bg-violet-50", iconColor: "text-violet-600", trendColor: "" },
    { title: "Pendapatan Bulan Ini",value: loading ? "—" : formatRp(stats.pendapatan), trend: "",     icon: Wallet,       iconBg: "bg-amber-50",  iconColor: "text-amber-600",  trendColor: "" },
  ];

  const totalProduksi = chartProduksi.reduce((s, v) => s + v.value, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Ringkasan Hari Ini</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pantau aktivitas produksi dan keuangan terkini.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                {stat.trend && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.trendColor}`}>
                    <TrendingUp className="inline h-3 w-3 mr-0.5" />{stat.trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">{stat.title}</p>
              <div className="text-2xl font-display font-bold text-gray-900">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-300 mt-1" /> : stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }}
            className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-5 lg:col-span-2"
          >
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Pesanan Masuk</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tren 6 bulan terakhir</p>
            </div>
            <div className="h-[220px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartPesanan} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: '#0F172A', fontSize: '13px' }} itemStyle={{ color: '#0D9488' }} />
                    <Area type="monotone" dataKey="masuk" name="Pesanan" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMasuk)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.45 }}
            className="bg-white rounded-xl border border-black/[0.07] shadow-sm p-5"
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Status Produksi</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribusi task aktif</p>
            </div>
            {loading ? (
              <div className="h-[160px] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
              </div>
            ) : (
              <>
                <div className="h-[160px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartProduksi} cx="50%" cy="50%" innerRadius={55} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none">
                        {chartProduksi.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-2xl font-display font-bold text-gray-900">{totalProduksi > 0 ? chartProduksi.reduce((s,v) => s + (v.value > 0 ? 1 : 0), 0) : 0}</span>
                    <span className="text-[10px] text-muted-foreground">Tahap Aktif</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {chartProduksi.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-muted-foreground truncate">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.5 }}
          className="bg-white rounded-xl border border-black/[0.07] shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pesanan Terbaru</h2>
              <p className="text-xs text-muted-foreground">5 pesanan terakhir masuk</p>
            </div>
            <Link href="/pesanan">
              <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs">
                Lihat Semua <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-teal-300" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 px-5">No. Pesanan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Pelanggan</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Produk</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right px-5">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order, idx) => (
                    <TableRow key={order.id} className={`border-gray-50 ${idx % 2 === 0 ? "bg-gray-50/50" : ""} hover:bg-teal-50/30 transition-colors`}>
                      <TableCell className="font-mono text-xs font-semibold text-gray-700 py-3 px-5">{order.id}</TableCell>
                      <TableCell className="text-sm text-gray-700">{order.customer_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{order.product}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-3 font-medium text-xs ${STATUS_CFG[order.status as OrderStatus] ?? ""}`}>
                          {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-5 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
