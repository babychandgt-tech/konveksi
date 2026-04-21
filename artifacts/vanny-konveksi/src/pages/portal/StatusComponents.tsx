import { Badge } from "@/components/ui/badge";
import { Clock, PackageSearch, CheckCircle2, XCircle } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    baru: "bg-teal-50 text-teal-700 border-teal-200",
    produksi: "bg-amber-50 text-amber-700 border-amber-200",
    selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
    batal: "bg-red-50 text-red-600 border-red-200",
  };
  const labels: Record<string, string> = { baru: "Baru", produksi: "Produksi", selesai: "Selesai", batal: "Batal" };
  return <Badge className={`rounded-full px-3 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>{labels[status] ?? status}</Badge>;
}

export function StatusIcon({ status }: { status: string }) {
  if (status === "baru") return <Clock className="h-4 w-4 text-teal-600" />;
  if (status === "produksi") return <PackageSearch className="h-4 w-4 text-amber-600" />;
  if (status === "selesai") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export function ProgressBar({ status }: { status: string }) {
  const pct = { baru: 10, produksi: 55, selesai: 100, batal: 0 }[status] ?? 0;
  const color = { baru: "bg-teal-500", produksi: "bg-amber-500", selesai: "bg-emerald-500", batal: "bg-red-400" }[status] ?? "bg-gray-300";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
