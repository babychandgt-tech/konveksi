import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Check, Scissors, Printer, Settings2 } from "lucide-react";

type GarmentRow = { id: string; label: string; basePrice: number; desc: string };
type PrintRow   = { id: string; label: string; desc: string; surcharge: number };
type GeneralRow = { min_order: number; sizes: string[] };

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const DEFAULT_GARMENTS: GarmentRow[] = [
  { id: "kaos",   label: "Kaos",   basePrice: 75000,  desc: "Katun 30s / 24s combed" },
  { id: "polo",   label: "Polo",   basePrice: 95000,  desc: "Lacoste / pique cotton" },
  { id: "hoodie", label: "Hoodie", basePrice: 155000, desc: "Fleece / terry cotton" },
  { id: "jaket",  label: "Jaket",  basePrice: 185000, desc: "Parasut / drill / taslan" },
];

const DEFAULT_PRINT_METHODS: PrintRow[] = [
  { id: "tanpa",  label: "Tanpa Cetak", desc: "Baju polos tanpa tambahan",     surcharge: 0 },
  { id: "sablon", label: "Sablon",      desc: "Tinta rubber / plastisol",      surcharge: 15000 },
  { id: "dtf",    label: "DTF",         desc: "Direct to Film, warna tajam",   surcharge: 20000 },
  { id: "bordir", label: "Bordir",      desc: "Jahitan benang, kesan premium", surcharge: 30000 },
];

const DEFAULT_GENERAL: GeneralRow = { min_order: 1, sizes: ["S", "M", "L", "XL", "XXL"] };

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
      <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function SaveBtn({ id, saving, saved, onClick }: {
  id: string; saving: string | null; saved: string | null; onClick: () => void;
}) {
  const busy = saving === id;
  const ok   = saved  === id;
  return (
    <Button onClick={onClick} disabled={busy}
      className={`h-9 text-sm font-semibold rounded-lg transition-all ${
        ok   ? "bg-emerald-500 hover:bg-emerald-500 text-white" :
               "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-500/20"
      }`}>
      {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Menyimpan…</>
        : ok ? <><Check className="w-3.5 h-3.5 mr-1.5" />Tersimpan!</>
        : <><Save className="w-3.5 h-3.5 mr-1.5" />Simpan Perubahan</>}
    </Button>
  );
}

export default function PengaturanBuilder() {
  const [garments,     setGarments]     = useState<GarmentRow[]>(DEFAULT_GARMENTS);
  const [printMethods, setPrintMethods] = useState<PrintRow[]>(DEFAULT_PRINT_METHODS);
  const [general,      setGeneral]      = useState<GeneralRow>(DEFAULT_GENERAL);
  const [saving,       setSaving]       = useState<string | null>(null);
  const [saved,        setSaved]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    supabase.from("builder_settings").select("id, data").then(async ({ data }) => {
      const rows = data ?? [];
      const ids  = rows.map(r => r.id);

      const toSeed: { id: string; data: unknown; updated_at: string }[] = [];
      const now = new Date().toISOString();

      if (ids.includes("garments")) {
        setGarments(rows.find(r => r.id === "garments")!.data as unknown as GarmentRow[]);
      } else {
        toSeed.push({ id: "garments", data: DEFAULT_GARMENTS, updated_at: now });
      }

      if (ids.includes("print_methods")) {
        setPrintMethods(rows.find(r => r.id === "print_methods")!.data as unknown as PrintRow[]);
      } else {
        toSeed.push({ id: "print_methods", data: DEFAULT_PRINT_METHODS, updated_at: now });
      }

      if (ids.includes("general")) {
        setGeneral(rows.find(r => r.id === "general")!.data as unknown as GeneralRow);
      } else {
        toSeed.push({ id: "general", data: DEFAULT_GENERAL, updated_at: now });
      }

      if (toSeed.length > 0) {
        await supabase.from("builder_settings").upsert(toSeed);
      }

      setLoading(false);
    });
  }, []);

  async function saveSection(id: string, data: unknown) {
    setSaving(id);
    await supabase.from("builder_settings")
      .upsert({ id, data: data as Record<string, unknown>, updated_at: new Date().toISOString() });
    setSaving(null);
    setSaved(id);
    setTimeout(() => setSaved(null), 2500);
  }

  const updGarment = (i: number, field: keyof GarmentRow, val: string | number) =>
    setGarments(g => g.map((r, j) => j === i ? { ...r, [field]: val } : r));

  const updPrint = (i: number, field: keyof PrintRow, val: string | number) =>
    setPrintMethods(g => g.map((r, j) => j === i ? { ...r, [field]: val } : r));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        <span className="ml-2 text-sm text-gray-500">Memuat pengaturan…</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Jenis Garmen ── */}
      <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm">
        <SectionHeader
          icon={<Scissors className="h-5 w-5 text-teal-600" />}
          title="Jenis Garmen & Harga Dasar"
          desc="Atur label, harga dasar per pcs, dan keterangan material setiap jenis baju." />
        <div className="space-y-3">
          {garments.map((g, i) => (
            <div key={g.id} className="grid grid-cols-[80px_1fr_140px_2fr] gap-3 items-end">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">ID</label>
                <div className="h-8 flex items-center px-3 rounded-lg bg-gray-50 border border-gray-100 text-xs font-mono text-gray-400">{g.id}</div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Label</label>
                <Input value={g.label} onChange={e => updGarment(i, "label", e.target.value)}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Harga Dasar (Rp)</label>
                <Input type="number" value={g.basePrice}
                  onChange={e => updGarment(i, "basePrice", Number(e.target.value))}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Material / Keterangan</label>
                <Input value={g.desc} onChange={e => updGarment(i, "desc", e.target.value)}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <SaveBtn id="garments" saving={saving} saved={saved}
            onClick={() => saveSection("garments", garments)} />
        </div>
      </div>

      {/* ── Metode Cetak ── */}
      <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm">
        <SectionHeader
          icon={<Printer className="h-5 w-5 text-teal-600" />}
          title="Metode Cetak & Biaya Tambahan"
          desc="Atur label, deskripsi, dan biaya surcharge per pcs untuk setiap metode cetak." />
        <div className="space-y-3">
          {printMethods.map((m, i) => (
            <div key={m.id} className="grid grid-cols-[80px_1fr_2fr_150px] gap-3 items-end">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">ID</label>
                <div className="h-8 flex items-center px-3 rounded-lg bg-gray-50 border border-gray-100 text-xs font-mono text-gray-400">{m.id}</div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Label</label>
                <Input value={m.label} onChange={e => updPrint(i, "label", e.target.value)}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Deskripsi</label>
                <Input value={m.desc} onChange={e => updPrint(i, "desc", e.target.value)}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Biaya Tambahan (Rp)</label>
                <Input type="number" value={m.surcharge}
                  onChange={e => updPrint(i, "surcharge", Number(e.target.value))}
                  className="h-8 text-sm border-gray-200 focus-visible:ring-teal-500" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <SaveBtn id="print_methods" saving={saving} saved={saved}
            onClick={() => saveSection("print_methods", printMethods)} />
        </div>
      </div>

      {/* ── Pengaturan Umum ── */}
      <div className="bg-white p-6 rounded-xl border border-black/[0.07] shadow-sm">
        <SectionHeader
          icon={<Settings2 className="h-5 w-5 text-teal-600" />}
          title="Pengaturan Umum Builder"
          desc="Minimum order dan pilihan ukuran yang tersedia di Custom Builder pelanggan." />
        <div className="space-y-5">
          <div className="max-w-xs">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Minimum Order (pcs)</label>
            <Input type="number" min={1} value={general.min_order}
              onChange={e => setGeneral(g => ({ ...g, min_order: Number(e.target.value) }))}
              className="h-9 text-sm border-gray-200 focus-visible:ring-teal-500" />
            <p className="text-[11px] text-gray-400 mt-1">Pelanggan harus memesan minimal sejumlah ini.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">Ukuran Tersedia</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map(sz => {
                const active = general.sizes.includes(sz);
                return (
                  <button key={sz} type="button"
                    onClick={() => setGeneral(g => ({
                      ...g,
                      sizes: active ? g.sizes.filter(s => s !== sz) : [...g.sizes, sz],
                    }))}
                    className={`w-12 h-9 rounded-lg text-sm font-bold border-2 transition-all ${
                      active
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}>
                    {sz}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Ukuran yang dipilih akan tampil di langkah pemilihan ukuran.</p>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <SaveBtn id="general" saving={saving} saved={saved}
            onClick={() => saveSection("general", general)} />
        </div>
      </div>

    </div>
  );
}
