import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Katalog from "@/pages/Katalog";
import Pesanan from "@/pages/Pesanan";
import Pegawai from "@/pages/Pegawai";
import Produksi from "@/pages/Produksi";
import Keuangan from "@/pages/Keuangan";
import Pelanggan from "@/pages/Pelanggan";
import Pengaturan from "@/pages/Pengaturan";
import CustomerPortal from "@/pages/CustomerPortal";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-7 w-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user && profile) {
    if (profile.role === "pelanggan") return <Redirect to="/portal" />;
    return <Redirect to="/dashboard" />;
  }
  // User logged in tapi profil belum ada (belum run SQL) → ke dashboard aja
  if (user && !profile) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AuthGate><Login /></AuthGate>
      </Route>

      <Route path="/register">
        <AuthGate><Register /></AuthGate>
      </Route>

      <Route path="/portal">
        <ProtectedRoute allowedRoles={["pelanggan"]}>
          <CustomerPortal />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["admin", "karyawan"]}>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/katalog">
        <ProtectedRoute allowedRoles={["admin", "karyawan"]}>
          <Katalog />
        </ProtectedRoute>
      </Route>

      <Route path="/pesanan">
        <ProtectedRoute allowedRoles={["admin", "karyawan"]}>
          <Pesanan />
        </ProtectedRoute>
      </Route>

      <Route path="/pegawai">
        <ProtectedRoute allowedRoles={["admin"]}>
          <Pegawai />
        </ProtectedRoute>
      </Route>

      <Route path="/produksi">
        <ProtectedRoute allowedRoles={["admin", "karyawan"]}>
          <Produksi />
        </ProtectedRoute>
      </Route>

      <Route path="/keuangan">
        <ProtectedRoute allowedRoles={["admin"]}>
          <Keuangan />
        </ProtectedRoute>
      </Route>

      <Route path="/pelanggan">
        <ProtectedRoute allowedRoles={["admin", "karyawan"]}>
          <Pelanggan />
        </ProtectedRoute>
      </Route>

      <Route path="/pengaturan">
        <ProtectedRoute allowedRoles={["admin"]}>
          <Pengaturan />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
