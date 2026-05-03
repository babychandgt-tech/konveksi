import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Check, Plus, Minus, Upload,
  ShoppingCart, RotateCcw, Type, ImageIcon, X, Wand2,
  Palette, Layers, Scissors, Pencil, Move, Hand, Minimize2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem, Product, formatRupiah } from "./types";

/* ─── Types ──────────────────────────────────────────────── */
type GarmentId   = "kaos" | "polo" | "hoodie" | "jaket";
type PrintMethod = "tanpa" | "sablon" | "dtf" | "bordir";
type PreviewSide = "front" | "back";
type ViewSide    = "front" | "sleeve-l" | "sleeve-r" | "back";
type TextShape   = "normal" | "arc-up" | "arc-down" | "circle";

interface TextEl {
  id: string; text: string; color: string;
  size: number; bold: boolean; side: PreviewSide;
  x: number; y: number; // percent 0–100 within canvas
  font: string;
  shape: TextShape;
}
interface BuilderState {
  garment: GarmentId; color: string; printMethod: PrintMethod;
  texts: TextEl[]; logoDataUrl: string | null; logoSide: PreviewSide;
  logoX: number; logoY: number; logoSize: number;
  sizeBreakdown: Record<string, number>;
}

/* ─── Constants ──────────────────────────────────────────── */
const GARMENTS: { id: GarmentId; label: string; basePrice: number; desc: string }[] = [
  { id: "kaos",   label: "Kaos",   basePrice: 75000,  desc: "Katun 30s / 24s combed" },
  { id: "polo",   label: "Polo",   basePrice: 95000,  desc: "Lacoste / pique cotton" },
  { id: "hoodie", label: "Hoodie", basePrice: 155000, desc: "Fleece / terry cotton" },
  { id: "jaket",  label: "Jaket",  basePrice: 185000, desc: "Parasut / drill / taslan" },
];

const FABRIC_COLORS = [
  { name: "Putih",      hex: "#F8F8F8" },
  { name: "Hitam",      hex: "#1c1c1c" },
  { name: "Abu",        hex: "#9ca3af" },
  { name: "Abu Gelap",  hex: "#4b5563" },
  { name: "Navy",       hex: "#1e3a5f" },
  { name: "Biru",       hex: "#2563eb" },
  { name: "Biru Muda",  hex: "#60a5fa" },
  { name: "Merah",      hex: "#dc2626" },
  { name: "Maroon",     hex: "#7f1d1d" },
  { name: "Hijau Tua",  hex: "#166534" },
  { name: "Hijau",      hex: "#16a34a" },
  { name: "Tosca",      hex: "#0d9488" },
  { name: "Kuning",     hex: "#ca8a04" },
  { name: "Orange",     hex: "#ea580c" },
  { name: "Ungu",       hex: "#7c3aed" },
  { name: "Pink",       hex: "#db2777" },
];

const PRINT_METHODS: { id: PrintMethod; label: string; desc: string; surcharge: number; color: string }[] = [
  { id: "tanpa",  label: "Tanpa Cetak", desc: "Baju polos tanpa tambahan",         surcharge: 0,     color: "border-gray-200 bg-gray-50" },
  { id: "sablon", label: "Sablon",      desc: "Tinta rubber / plastisol",          surcharge: 15000, color: "border-teal-200 bg-teal-50" },
  { id: "dtf",    label: "DTF",         desc: "Direct to Film, warna tajam",       surcharge: 20000, color: "border-blue-200 bg-blue-50" },
  { id: "bordir", label: "Bordir",      desc: "Jahitan benang, kesan premium",     surcharge: 30000, color: "border-amber-200 bg-amber-50" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const TEXT_PRESETS: { id: string; label: string; side: PreviewSide; x: number; y: number }[] = [
  { id: "chest-left",    label: "Dada Kiri (Depan)",     side: "front", x: 38, y: 42 },
  { id: "chest-center",  label: "Tengah Depan",           side: "front", x: 50, y: 46 },
  { id: "back-center",   label: "Tengah Belakang",        side: "back",  x: 50, y: 48 },
  { id: "back-top",      label: "Leher Belakang (Kecil)", side: "back",  x: 50, y: 26 },
  { id: "sleeve-left-f", label: "Lengan Kiri (Depan)",   side: "front", x: 19, y: 44 },
  { id: "sleeve-rgt-f",  label: "Lengan Kanan (Depan)",  side: "front", x: 81, y: 44 },
  { id: "sleeve-left-b", label: "Lengan Kiri (Belakang)",side: "back",  x: 19, y: 44 },
  { id: "sleeve-rgt-b",  label: "Lengan Kanan (Belakang)",side: "back", x: 81, y: 44 },
];

const FONTS: { family: string; label: string }[] = [
  { family: "'Inter', sans-serif",          label: "Inter" },
  { family: "'Oswald', sans-serif",         label: "Oswald" },
  { family: "'Bebas Neue', sans-serif",     label: "Bebas Neue" },
  { family: "'Pacifico', cursive",          label: "Pacifico" },
  { family: "'Dancing Script', cursive",    label: "Dancing Script" },
  { family: "'Permanent Marker', cursive",  label: "Marker" },
  { family: "'Roboto Slab', serif",         label: "Roboto Slab" },
];

const SHAPES: { id: TextShape; label: string }[] = [
  { id: "normal",   label: "Normal" },
  { id: "arc-up",   label: "Lengkung ↑" },
  { id: "arc-down", label: "Lengkung ↓" },
  { id: "circle",   label: "Melingkar" },
];

const DEFAULT_FONT  = FONTS[0].family;
const DEFAULT_SHAPE: TextShape = "normal";

const DEFAULT_STATE: BuilderState = {
  garment: "kaos", color: "#1e3a5f", printMethod: "sablon",
  texts: [], logoDataUrl: null, logoSide: "front", logoX: 50, logoY: 42, logoSize: 80,
  sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0 },
};

/* ─── SVG Garment Components ─────────────────────────────── */
function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

/* shared SVG defs helper */
function GarmentDefs({ uid, light }: { uid: string; light: boolean }) {
  return (
    <defs>
      <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
        <stop offset="22%"  stopColor="rgba(0,0,0,0.03)" />
        <stop offset="78%"  stopColor="rgba(0,0,0,0.03)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
      </linearGradient>
      <linearGradient id={`${uid}hg`} x1="0.3" y1="0" x2="0.7" y2="0.4">
        <stop offset="0%"  stopColor={light ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.07)"} />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <filter id={`${uid}sh`} x="-15%" y="-8%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.22)" />
      </filter>
    </defs>
  );
}

function SleeveSVG({ fill, side, uid = "sl" }: { fill: string; side: "sleeve-l" | "sleeve-r"; uid?: string }) {
  const light = isLight(fill);
  const b = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  // Sleeve laid flat — portrait: top=shoulder area, bottom=cuff
  const path = "M 44,28 Q 22,26 22,56 L 22,232 Q 22,268 52,272 L 212,260 Q 238,256 238,226 L 238,58 Q 238,26 212,24 L 64,24 Z";
  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GarmentDefs uid={uid} light={light} />
      <ellipse cx="130" cy="288" rx="90" ry="6" fill="rgba(0,0,0,0.07)" />
      <path filter={`url(#${uid}sh)`} d={path} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={path} fill={`url(#${uid}sg)`} />
      <path d={path} fill={`url(#${uid}hg)`} />
      {/* Shoulder seam (top, dashed) */}
      <line x1="48" y1="24" x2="210" y2="24" stroke={b} strokeWidth="1.2" strokeDasharray="5,3" opacity="0.7" />
      {/* Armhole seam (left curved edge, dashed) */}
      <path d="M 44,28 Q 22,26 22,56 L 22,232 Q 22,268 52,272"
        fill="none" stroke={b} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
      {/* Cuff hem (bottom, solid) */}
      <line x1="52" y1="272" x2="212" y2="260" stroke={b} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      {/* Center fold crease (subtle) */}
      <line x1="26" y1="148" x2="234" y2="148"
        stroke={light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}
        strokeWidth="1.5" strokeDasharray="6,4" />
      {/* Sleeve label */}
      <text x="130" y="160" textAnchor="middle" fontSize="12"
        fontFamily="Inter, system-ui, sans-serif"
        fill={light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)"}>
        {side === "sleeve-l" ? "Lengan Kiri" : "Lengan Kanan"}
      </text>
    </svg>
  );
}

function KaosSVG({ fill, uid = "k", side = "front" }: { fill: string; uid?: string; side?: "front" | "back" }) {
  const light = isLight(fill);
  const b = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const shade = light ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.32)";

  const body = "M88,50 C70,50 46,60 32,78 L8,100 L38,120 C48,108 60,106 62,105 C62,105 60,175 59,258 Q130,272 201,258 C200,175 198,105 198,105 C200,106 212,108 222,120 L252,100 L228,78 C214,60 190,50 172,50 C162,40 148,35 130,34 C112,35 98,40 88,50 Z";

  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GarmentDefs uid={uid} light={light} />
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      <path filter={`url(#${uid}sh)`} d={body} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={body} fill={`url(#${uid}sg)`} />
      <path d={body} fill={`url(#${uid}hg)`} />

      {side === "front" ? (
        <>
          {/* Front collar */}
          <path d="M88,50 C98,40 112,35 130,34 C148,35 162,40 172,50 C162,60 148,66 130,68 C112,66 98,60 88,50 Z"
            fill={shade} stroke={b} strokeWidth="1" />
        </>
      ) : (
        <>
          {/* Back neckline — simple curved scoop */}
          <path d="M100,44 C110,52 120,56 130,56 C140,56 150,52 160,44"
            fill="none" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
          {/* Back center seam */}
          <line x1="130" y1="56" x2="130" y2="258" stroke={b} strokeWidth="0.9" strokeDasharray="5,4" opacity="0.5" />
          {/* Back shoulder seam */}
          <path d="M88,50 C100,54 115,58 130,58 C145,58 160,54 172,50"
            fill="none" stroke={b} strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
          {/* Clothing tag */}
          <rect x="122" y="60" width="16" height="10" rx="2" fill={shade} stroke={b} strokeWidth="0.8" />
          <line x1="130" y1="60" x2="130" y2="70" stroke={b} strokeWidth="0.6" />
        </>
      )}

      {/* Sleeve crease */}
      <path d="M32,78 C38,90 40,100 38,120" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" strokeLinecap="round" />
      <path d="M228,78 C222,90 220,100 222,120" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" strokeLinecap="round" />
      {/* Hem stitch */}
      <path d="M68,257 Q130,270 192,257" fill="none" stroke={b} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function PoloSVG({ fill, uid = "p", side = "front" }: { fill: string; uid?: string; side?: "front" | "back" }) {
  const light = isLight(fill);
  const b = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const collarFill = light ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.22)";
  const collarStroke = light ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.4)";
  const hi = light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)";

  const body = "M96,65 C76,58 48,62 32,80 L8,102 L38,122 C48,110 62,108 64,107 C64,107 62,175 61,258 Q130,272 199,258 C198,175 196,107 196,107 C198,108 212,110 222,122 L252,102 L228,80 C212,62 184,58 164,65 L152,80 L130,88 L108,80 Z";

  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GarmentDefs uid={uid} light={light} />
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      <path filter={`url(#${uid}sh)`} d={body} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
      <path d={body} fill={`url(#${uid}sg)`} />
      <path d={body} fill={`url(#${uid}hg)`} />

      {side === "front" ? (
        <>
          <path d="M96,65 L108,80 L130,88 L120,115 L98,108 L96,65 Z" fill={collarFill} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
          <path d="M164,65 L152,80 L130,88 L140,115 L162,108 L164,65 Z" fill={collarFill} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
          <path d="M108,80 C116,76 122,74 130,72" fill="none" stroke={hi} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M152,80 C144,76 138,74 130,72" fill="none" stroke={hi} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="130" y1="88" x2="130" y2="138" stroke={b} strokeWidth="1.2" />
          {[98, 110, 122].map(y => (
            <circle key={y} cx="130" cy={y} r="2.8" fill={light ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)"} />
          ))}
        </>
      ) : (
        <>
          {/* Back collar — standing band */}
          <path d="M102,62 C110,50 120,44 130,43 C140,44 150,50 158,62 C150,68 140,72 130,72 C120,72 110,68 102,62 Z"
            fill={collarFill} stroke={collarStroke} strokeWidth="1.2" strokeLinejoin="round" />
          {/* Collar band rib lines */}
          <path d="M106,60 C114,50 122,45 130,44" fill="none" stroke={collarStroke} strokeWidth="0.7" strokeDasharray="2,2" />
          <path d="M154,60 C146,50 138,45 130,44" fill="none" stroke={collarStroke} strokeWidth="0.7" strokeDasharray="2,2" />
          {/* Center back seam */}
          <line x1="130" y1="72" x2="130" y2="258" stroke={b} strokeWidth="0.9" strokeDasharray="5,4" opacity="0.5" />
        </>
      )}
      <path d="M70,257 Q130,270 190,257" fill="none" stroke={b} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function HoodieSVG({ fill, uid = "h", side = "front" }: { fill: string; uid?: string; side?: "front" | "back" }) {
  const light = isLight(fill);
  const b = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const pocketFill = light ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.25)";
  const stringColor = light ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)";
  const hoodShade = light ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.22)";

  const bodyPath = "M102,62 C82,64 46,76 28,88 L8,116 L40,134 C50,120 62,112 64,111 C64,111 62,180 61,263 Q130,276 199,263 C198,180 196,111 196,111 C198,112 210,120 220,134 L252,116 L232,88 C214,76 178,64 158,62 L130,68 Z";

  return (
    <svg viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GarmentDefs uid={uid} light={light} />
      <ellipse cx="130" cy="295" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />

      {side === "front" ? (
        <>
          {/* Front hood */}
          <path filter={`url(#${uid}sh)`}
            d="M92,54 C76,36 42,38 26,68 L26,86 L50,94 C58,66 78,56 102,62 L130,68 L158,62 C182,56 202,66 210,94 L234,86 L234,68 C218,38 184,36 168,54 C158,40 146,30 130,28 C114,30 102,40 92,54 Z"
            fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M92,54 C76,36 42,38 26,68 L26,86 L50,94 C58,66 78,56 102,62 L130,68 L158,62 C182,56 202,66 210,94 L234,86 L234,68 C218,38 184,36 168,54 C158,40 146,30 130,28 C114,30 102,40 92,54 Z"
            fill={`url(#${uid}sg)`} />
          {/* Body */}
          <path d={bodyPath} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={bodyPath} fill={`url(#${uid}sg)`} />
          <path d={bodyPath} fill={`url(#${uid}hg)`} />
          {/* Hood seam */}
          <path d="M102,62 C112,64 120,66 130,68 C140,66 148,64 158,62" fill="none" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M50,94 C68,70 94,62 130,68 C166,62 192,70 210,94" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
          {/* Drawstrings */}
          <path d="M118,68 C116,80 113,90 110,104" stroke={stringColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M142,68 C144,80 147,90 150,104" stroke={stringColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="110" cy="104" r="3.5" fill={stringColor} />
          <circle cx="150" cy="104" r="3.5" fill={stringColor} />
          {/* Kangaroo pocket */}
          <path d="M84,198 C84,192 88,188 94,188 L166,188 C172,188 176,192 176,198 L176,244 C176,250 172,254 166,254 L94,254 C88,254 84,250 84,244 Z" fill={pocketFill} stroke={b} strokeWidth="1" />
          <line x1="130" y1="188" x2="130" y2="254" stroke={b} strokeWidth="0.8" />
        </>
      ) : (
        <>
          {/* Back — hood visible from behind: large rounded dome */}
          <path filter={`url(#${uid}sh)`}
            d="M68,90 C60,70 56,48 70,32 C84,16 106,8 130,8 C154,8 176,16 190,32 C204,48 200,70 192,90 C178,82 156,76 130,76 C104,76 82,82 68,90 Z"
            fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          {/* Hood shading — inner darker area */}
          <path d="M68,90 C60,70 56,48 70,32 C84,16 106,8 130,8 C154,8 176,16 190,32 C204,48 200,70 192,90 C178,82 156,76 130,76 C104,76 82,82 68,90 Z"
            fill={`url(#${uid}sg)`} />
          {/* Hood highlight top */}
          <path d="M100,18 C112,10 122,8 130,8 C138,8 148,10 160,18"
            fill="none" stroke={light ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"} strokeWidth="3" strokeLinecap="round" />
          {/* Hood center seam */}
          <line x1="130" y1="8" x2="130" y2="90" stroke={b} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          {/* Body */}
          <path d={bodyPath} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={bodyPath} fill={`url(#${uid}sg)`} />
          <path d={bodyPath} fill={`url(#${uid}hg)`} />
          {/* Hood-body seam (back) */}
          <path d="M68,90 C86,82 108,78 130,78 C152,78 174,82 192,90"
            fill="none" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
          {/* Center back seam */}
          <line x1="130" y1="90" x2="130" y2="263" stroke={b} strokeWidth="0.9" strokeDasharray="5,4" opacity="0.5" />
          {/* Back shoulder yoke */}
          <path d="M64,111 C90,118 110,122 130,122 C150,122 170,118 196,111"
            fill="none" stroke={b} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5" />
          {/* Hood shadow on body */}
          <path d="M75,90 C90,96 110,100 130,100 C150,100 170,96 185,90"
            fill="none" stroke={hoodShade} strokeWidth="6" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      <path d="M70,262 Q130,275 190,262" fill="none" stroke={b} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function JaketSVG({ fill, uid = "j", side = "front" }: { fill: string; uid?: string; side?: "front" | "back" }) {
  const light = isLight(fill);
  const b = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const lapelFill  = light ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.28)";
  const pocketFill = light ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.22)";
  const zipperColor = light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)";

  const bodyFront = "M90,50 C70,52 44,62 28,82 L6,112 L40,132 C50,118 62,110 64,109 C64,109 62,178 61,258 Q130,270 199,258 C198,178 196,109 196,109 C198,110 210,118 220,132 L254,112 L232,82 C216,62 190,52 170,50 L158,72 L130,82 L102,72 Z";
  const bodyBack  = "M90,50 C70,52 44,62 28,82 L6,112 L40,132 C50,118 62,110 64,109 C64,109 62,178 61,258 Q130,270 199,258 C198,178 196,109 196,109 C198,110 210,118 220,132 L254,112 L232,82 C216,62 190,52 170,50 C162,42 148,36 130,36 C112,36 98,42 90,50 Z";

  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <GarmentDefs uid={uid} light={light} />
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />

      {side === "front" ? (
        <>
          <path filter={`url(#${uid}sh)`} d={bodyFront} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={bodyFront} fill={`url(#${uid}sg)`} />
          <path d={bodyFront} fill={`url(#${uid}hg)`} />
          {/* Lapels */}
          <path d="M90,50 L102,72 L130,82 L116,114 L96,106 C92,90 86,68 90,50 Z" fill={lapelFill} stroke={b} strokeWidth="1" strokeLinejoin="round" />
          <path d="M170,50 L158,72 L130,82 L144,114 L164,106 C168,90 174,68 170,50 Z" fill={lapelFill} stroke={b} strokeWidth="1" strokeLinejoin="round" />
          <path d="M102,72 C112,70 120,74 130,78" fill="none" stroke={light ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M158,72 C148,70 140,74 130,78" fill="none" stroke={light ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"} strokeWidth="1.2" strokeLinecap="round" />
          {/* Zipper */}
          <line x1="130" y1="82" x2="130" y2="258" stroke={zipperColor} strokeWidth="1.5" />
          {[96,110,124,138,152,166,180,194,208,222,236,250].map(y => (
            <line key={y} x1="127" y1={y} x2="133" y2={y} stroke={zipperColor} strokeWidth="1.2" />
          ))}
          {/* Chest pockets */}
          <rect x="72" y="126" width="42" height="26" rx="4" fill={pocketFill} stroke={b} strokeWidth="0.9" />
          <rect x="146" y="126" width="42" height="26" rx="4" fill={pocketFill} stroke={b} strokeWidth="0.9" />
          <line x1="72" y1="134" x2="114" y2="134" stroke={b} strokeWidth="0.7" />
          <line x1="146" y1="134" x2="188" y2="134" stroke={b} strokeWidth="0.7" />
          {/* Hip pockets */}
          <path d="M66,196 C66,190 70,186 76,186 L120,186 C126,186 130,190 130,196 L130,225 C130,231 126,235 120,235 L72,235 C68,235 66,233 66,229 Z" fill={pocketFill} stroke={b} strokeWidth="0.9" />
          <path d="M130,196 C130,190 134,186 140,186 L184,186 C190,186 194,190 194,196 L194,225 C194,231 190,235 184,235 L136,235 C132,235 130,233 130,229 Z" fill={pocketFill} stroke={b} strokeWidth="0.9" />
        </>
      ) : (
        <>
          <path filter={`url(#${uid}sh)`} d={bodyBack} fill={fill} stroke={b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d={bodyBack} fill={`url(#${uid}sg)`} />
          <path d={bodyBack} fill={`url(#${uid}hg)`} />
          {/* Back neckline — collar band */}
          <path d="M100,46 C110,36 120,32 130,32 C140,32 150,36 160,46 C150,54 140,58 130,58 C120,58 110,54 100,46 Z"
            fill={pocketFill} stroke={b} strokeWidth="1.1" />
          {/* Back collar highlight */}
          <path d="M106,44 C114,36 122,33 130,32" fill="none" stroke={light ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)"} strokeWidth="1.2" strokeLinecap="round" />
          {/* Back yoke seam (horizontal shoulder panel) */}
          <path d="M64,109 C90,120 110,126 130,126 C150,126 170,120 196,109"
            fill="none" stroke={b} strokeWidth="1.2" strokeLinecap="round" />
          {/* Center back seam */}
          <line x1="130" y1="58" x2="130" y2="258" stroke={b} strokeWidth="1" strokeDasharray="5,4" opacity="0.55" />
          {/* Back hip slash pockets */}
          <path d="M74,196 C80,190 102,188 112,190" fill="none" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M148,196 C158,190 178,188 186,190" fill="none" stroke={b} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      <path d="M70,257 Q130,268 190,257" fill="none" stroke={b} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

const GARMENT_SVG: Record<GarmentId, React.FC<{ fill: string; uid?: string; side?: "front" | "back" }>> = {
  kaos: KaosSVG, polo: PoloSVG, hoodie: HoodieSVG, jaket: JaketSVG,
};

/* ─── Shaped Text Renderer ───────────────────────────────── */
function ShapedText({ t, light }: { t: TextEl; light: boolean }) {
  const shadow = light ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 4px rgba(0,0,0,0.65)";
  const baseStyle = {
    fontFamily: t.font, fontWeight: t.bold ? 700 : 500,
    color: t.color, fontSize: t.size,
    letterSpacing: "0.04em", whiteSpace: "nowrap" as const,
    textShadow: shadow,
  };

  if (t.shape === "normal") {
    return <span style={{ ...baseStyle, display: "block" }}>{t.text}</span>;
  }

  const uid = `tp-${t.id}`;
  let svgW: number, svgH: number, pathD: string;

  if (t.shape === "arc-up") {
    svgW = 280; svgH = 100;
    pathD = "M 14,88 Q 140,8 266,88";
  } else if (t.shape === "arc-down") {
    svgW = 280; svgH = 100;
    pathD = "M 14,12 Q 140,92 266,12";
  } else {
    // circle — top semicircle
    svgW = 240; svgH = 130;
    pathD = "M 20,120 a 100,100 0 0,1 200,0";
  }

  return (
    <svg width={svgW} height={svgH}
      style={{ display: "block", overflow: "visible", filter: `drop-shadow(${shadow})` }}>
      <defs><path id={uid} d={pathD} fill="none" /></defs>
      <text fontFamily={t.font} fontSize={t.size} fontWeight={t.bold ? 700 : 500}
        fill={t.color} textAnchor="middle" letterSpacing="1.5">
        <textPath href={`#${uid}`} startOffset="50%">{t.text}</textPath>
      </text>
    </svg>
  );
}

/* ─── Static Garment Display (used in modal) ─────────────── */
function GarmentCanvas({ state, side }: { state: BuilderState; side: ViewSide }) {
  const isSleeve    = side === "sleeve-l" || side === "sleeve-r";
  const garmentSide: PreviewSide = isSleeve ? "front" : side as PreviewSide;
  const GarmentComp = GARMENT_SVG[state.garment];
  const visibleTexts = state.texts.filter(t => {
    if (!isSleeve) return t.side === garmentSide;
    return t.side === "front" && (side === "sleeve-l" ? t.x <= 40 : t.x >= 60);
  });
  const showLogo = !!(state.logoDataUrl && (
    isSleeve
      ? state.logoSide === "front" && (side === "sleeve-l" ? state.logoX <= 40 : state.logoX >= 60)
      : state.logoSide === garmentSide
  ));
  const light = isLight(state.color);
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{
      background: "radial-gradient(ellipse at 50% 40%, #e8ecf0 0%, #d4d8de 100%)",
      padding: "28px 24px 20px",
    }}>
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "70%", height: "55%",
        background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div className="relative">
        {isSleeve
          ? <SleeveSVG fill={state.color} side={side as "sleeve-l" | "sleeve-r"} uid={`canvas-${side}-${state.garment}`} />
          : <GarmentComp fill={state.color} uid={`canvas-${garmentSide}-${state.garment}`} side={garmentSide} />
        }
        {visibleTexts.map(t => (
          <div key={t.id} className="absolute pointer-events-none"
            style={{ left: `${t.x}%`, top: `${t.y}%`, transform: "translate(-50%,-50%)" }}>
            <ShapedText t={t} light={light} />
          </div>
        ))}
        {showLogo && (
          <div className="absolute pointer-events-none"
            style={{ left: `${state.logoX}%`, top: `${state.logoY}%`, transform: "translate(-50%,-50%)" }}>
            <img src={state.logoDataUrl!} alt="logo"
              style={{ width: state.logoSize, height: state.logoSize, objectFit: "contain",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))", display: "block" }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Preview Modal ──────────────────────────────────────── */
function PreviewModal({ state, onClose }: { state: BuilderState; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: "spring", damping: 24, stiffness: 320 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Preview Desain</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tampilan depan, lengan & belakang</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-auto p-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            {([
              { id: "front",    label: "Depan" },
              { id: "sleeve-l", label: "Lengan Kiri" },
              { id: "sleeve-r", label: "Lengan Kanan" },
              { id: "back",     label: "Belakang" },
            ] as { id: ViewSide; label: string }[]).map(s => (
              <div key={s.id}>
                <p className="text-xs font-semibold text-gray-500 text-center mb-2 uppercase tracking-wide">
                  {s.label}
                </p>
                <GarmentCanvas state={state} side={s.id} />
              </div>
            ))}
          </div>
          {/* Summary row */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-xs text-center">
            <div>
              <p className="text-gray-400 mb-0.5">Jenis</p>
              <p className="font-semibold text-gray-700">
                {state.garment === "kaos" ? "Kaos" : state.garment === "polo" ? "Polo" : state.garment === "hoodie" ? "Hoodie" : "Jaket"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Warna</p>
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ background: state.color }} />
                <span className="font-semibold text-gray-700">{state.color.toUpperCase()}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 mb-0.5">Elemen</p>
              <p className="font-semibold text-gray-700">
                {state.texts.length} teks{state.logoDataUrl ? " + logo" : ""}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Preview Panel ──────────────────────────────────────── */
const LOGO_DRAG_ID = "__logo__";

function ShirtPreview({
  state, side, onChangeSide, onUpdateText, onUpdateLogo,
}: {
  state: BuilderState; side: ViewSide;
  onChangeSide: (s: ViewSide) => void;
  onUpdateText?: (id: string, patch: Partial<TextEl>) => void;
  onUpdateLogo?: (patch: { x: number; y: number }) => void;
}) {
  const isSleeve     = side === "sleeve-l" || side === "sleeve-r";
  const garmentSide: PreviewSide = isSleeve ? "front" : side as PreviewSide;
  const GarmentComp  = GARMENT_SVG[state.garment];
  const visibleTexts = state.texts.filter(t => {
    if (!isSleeve) return t.side === garmentSide;
    return t.side === "front" && (side === "sleeve-l" ? t.x <= 40 : t.x >= 60);
  });
  const showLogo = !!(state.logoDataUrl && (
    isSleeve
      ? state.logoSide === "front" && (side === "sleeve-l" ? state.logoX <= 40 : state.logoX >= 60)
      : state.logoSide === garmentSide
  ));

  // zoom / pan local state
  const [zoom, setZoom]   = useState(1);
  const [panX, setPanX]   = useState(0);
  const [panY, setPanY]   = useState(0);
  const [mode, setMode]   = useState<"select" | "hand">("select");
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // element dragging
  const [dragging, setDragging] = useState<string | null>(null);

  /* ── reset view on side change ── */
  useEffect(() => {
    setZoom(1); setPanX(0); setPanY(0); setMode("select");
  }, [side]);

  const outerRef   = useRef<HTMLDivElement>(null); // clip container (unchanged size)
  const contentRef = useRef<HTMLDivElement>(null); // scaled+translated inner

  /* ── reset zoom ── */
  const resetZoom = () => { setZoom(1); setPanX(0); setPanY(0); };

  /* ── zoom step ── */
  const doZoom = (delta: number) => {
    setZoom(z => {
      const next = Math.min(4, Math.max(1, +(z + delta).toFixed(2)));
      if (next === 1) { setPanX(0); setPanY(0); }
      return next;
    });
  };

  /* ── clamp pan so content never drifts too far out ── */
  const clampPan = useCallback((px: number, py: number, z: number) => {
    const maxShift = 140 * (z - 1) / z;
    return {
      px: Math.max(-maxShift, Math.min(maxShift, px)),
      py: Math.max(-maxShift, Math.min(maxShift, py)),
    };
  }, []);

  /* ── get % position relative to scaled content ── */
  const getPct = (e: React.MouseEvent) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width)  * 100)),
      y: Math.max(2, Math.min(98, ((e.clientY - rect.top)  / rect.height) * 100)),
    };
  };

  /* ── wheel zoom ── */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    doZoom(e.deltaY < 0 ? 0.12 : -0.12);
  };

  /* ── unified mouse down ── */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === "hand") {
      e.preventDefault();
      setPanning(true);
      panStart.current = { mx: e.clientX, my: e.clientY, px: panX, py: panY };
    }
  };

  /* ── mouse move ── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // hand pan
    if (mode === "hand" && panning && panStart.current) {
      const rawPx = panStart.current.px + (e.clientX - panStart.current.mx) / zoom;
      const rawPy = panStart.current.py + (e.clientY - panStart.current.my) / zoom;
      const { px, py } = clampPan(rawPx, rawPy, zoom);
      setPanX(px); setPanY(py);
      return;
    }
    // element drag
    if (!dragging) return;
    const pct = getPct(e);
    if (!pct) return;
    if (dragging === LOGO_DRAG_ID) onUpdateLogo?.(pct);
    else onUpdateText?.(dragging, pct);
  }, [mode, panning, dragging, zoom, panX, panY, onUpdateText, onUpdateLogo, clampPan]);

  const stopAll = () => { setDragging(null); setPanning(false); panStart.current = null; };

  /* ── cursor logic ── */
  const outerCursor = mode === "hand"
    ? (panning ? "grabbing" : "grab")
    : dragging ? "grabbing" : "default";

  const isZoomed = zoom > 1.01;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Top row: side toggle + zoom controls */}
      <div className="flex items-center justify-between w-full" style={{ maxWidth: 360 }}>
        {/* Side toggle */}
        <div className="flex bg-white/60 border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
          {([
            { id: "front",    label: "Depan" },
            { id: "sleeve-l", label: "← Lengan" },
            { id: "sleeve-r", label: "Lengan →" },
            { id: "back",     label: "Belakang" },
          ] as { id: ViewSide; label: string }[]).map(s => (
            <button key={s.id} type="button" onClick={() => onChangeSide(s.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                side === s.id
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-xl px-1.5 py-1 shadow-sm">
          {/* Hand / select toggle — only show when zoomed */}
          {isZoomed && (
            <button type="button"
              title={mode === "hand" ? "Mode pilih" : "Mode geser"}
              onClick={() => setMode(m => m === "hand" ? "select" : "hand")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                mode === "hand" ? "bg-teal-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              <Hand className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => doZoom(-0.25)} title="Zoom out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all text-base font-bold leading-none">
            −
          </button>
          <span className="text-[11px] font-semibold text-gray-600 min-w-[34px] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => doZoom(0.25)} title="Zoom in"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all text-base font-bold leading-none">
            +
          </button>
          {isZoomed && (
            <button type="button" onClick={() => { resetZoom(); setMode("select"); }} title="Reset zoom"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sleeve indicator banner */}
      {isSleeve && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-teal-50 border border-teal-100"
          style={{ maxWidth: 360 }}>
          <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
            <span>{side === "sleeve-l" ? "👕 Lengan Kiri" : "Lengan Kanan 👕"}</span>
            <span className="text-teal-400 font-normal">· tampilan pola lengan</span>
          </div>
          <span className="text-[10px] text-teal-500">Drag elemen untuk atur posisi</span>
        </motion.div>
      )}

      {/* Canvas */}
      <div className="relative w-full" style={{ maxWidth: 360 }}>
        <div className="rounded-2xl overflow-hidden" style={{
          background: "radial-gradient(ellipse at 50% 40%, #e8ecf0 0%, #d4d8de 100%)",
          padding: "34px 30px 26px",
        }}>
          {/* Spotlight */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "70%", height: "55%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Outer clip + event capture */}
          <div
            ref={outerRef}
            style={{ overflow: "hidden", cursor: outerCursor, userSelect: "none", position: "relative" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopAll}
            onMouseLeave={stopAll}
            onWheel={handleWheel}
          >
            {/* Scaled + translated content */}
            <div
              ref={contentRef}
              style={{
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                transformOrigin: "50% 50%",
                transition: panning || dragging ? "none" : "transform 0.15s ease",
                position: "relative",
              }}
            >
              {isSleeve
                ? <SleeveSVG fill={state.color} side={side as "sleeve-l" | "sleeve-r"} uid={`prev-${state.garment}-${side}`} />
                : <GarmentComp fill={state.color} uid={`prev-${state.garment}-${garmentSide}`} side={garmentSide} />
              }

              {/* Text overlays */}
              {visibleTexts.map(t => (
                <div key={t.id} className="absolute"
                  style={{
                    left: `${t.x}%`, top: `${t.y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: (onUpdateText && mode === "select") ? (dragging === t.id ? "grabbing" : "grab") : "inherit",
                    outline: (onUpdateText && mode === "select")
                      ? dragging === t.id ? "1.5px dashed rgba(99,102,241,0.7)" : "1.5px dashed rgba(99,102,241,0.3)"
                      : "none",
                    borderRadius: 6, padding: 2,
                  }}
                  onMouseDown={e => {
                    if (!onUpdateText || mode !== "select") return;
                    e.preventDefault(); e.stopPropagation();
                    setDragging(t.id);
                  }}>
                  <ShapedText t={t} light={isLight(state.color)} />
                </div>
              ))}

              {/* Logo overlay */}
              {showLogo && (
                <div className="absolute"
                  style={{
                    left: `${state.logoX}%`, top: `${state.logoY}%`,
                    transform: "translate(-50%,-50%)",
                    cursor: (onUpdateLogo && mode === "select") ? (dragging === LOGO_DRAG_ID ? "grabbing" : "grab") : "inherit",
                    outline: (onUpdateLogo && mode === "select")
                      ? dragging === LOGO_DRAG_ID ? "1.5px dashed rgba(99,102,241,0.7)" : "1.5px dashed rgba(99,102,241,0.3)"
                      : "none",
                    borderRadius: 6, padding: 2,
                  }}
                  onMouseDown={e => {
                    if (!onUpdateLogo || mode !== "select") return;
                    e.preventDefault(); e.stopPropagation();
                    setDragging(LOGO_DRAG_ID);
                  }}>
                  <img src={state.logoDataUrl!} alt="logo"
                    style={{
                      width: state.logoSize, height: state.logoSize,
                      objectFit: "contain",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                      display: "block", pointerEvents: "none",
                    }} />
                </div>
              )}

              {/* Empty state */}
              {visibleTexts.length === 0 && !showLogo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-medium text-gray-400 bg-white/60 px-3 py-1 rounded-full shadow-sm border border-white/80">
                    {onUpdateText ? "Tambah teks / logo, lalu drag di sini" : "Desain muncul di sini"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zoom hint badge */}
        {isZoomed && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] font-medium text-gray-500 bg-white/80 border border-gray-200 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              {mode === "hand" ? <><Hand className="w-3 h-3" /> Geser canvas</> : <><Move className="w-3 h-3" /> Mode pilih — aktifkan hand untuk geser</>}
            </span>
          </div>
        )}
      </div>

      {/* Hint row */}
      <div className="flex items-center justify-between w-full" style={{ maxWidth: 360 }}>
        {onUpdateText && (visibleTexts.length > 0 || showLogo) ? (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Move className="w-3 h-3" />
            <span>Scroll untuk zoom · drag teks/logo untuk pindah posisi</span>
          </div>
        ) : <div />}

        {/* Color info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm flex-shrink-0" style={{ background: state.color }} />
          <span>{FABRIC_COLORS.find(c => c.hex === state.color)?.name ?? "Custom"}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Pilih Jenis Baju ───────────────────────────── */
function Step1({ state, set }: { state: BuilderState; set: (s: Partial<BuilderState>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Pilih Jenis Baju</p>
        <div className="grid grid-cols-2 gap-3">
          {GARMENTS.map(g => {
            const GComp = GARMENT_SVG[g.id];
            const active = state.garment === g.id;
            return (
              <button key={g.id} type="button" onClick={() => set({ garment: g.id })}
                className={`relative rounded-2xl border-2 p-3 text-left transition-all ${
                  active ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-100" : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="w-full h-24 mb-2">
                  <GComp fill={active ? "#0d9488" : "#9ca3af"} side="front" />
                </div>
                <p className={`text-sm font-bold ${active ? "text-teal-700" : "text-gray-700"}`}>{g.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{g.desc}</p>
                <p className={`text-xs font-semibold mt-1 ${active ? "text-teal-600" : "text-gray-500"}`}>
                  ab. {formatRupiah(g.basePrice)}/pcs
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Warna Kain</p>
        <div className="flex flex-wrap gap-2">
          {FABRIC_COLORS.map(c => (
            <button key={c.hex} type="button" onClick={() => set({ color: c.hex })}
              title={c.name}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                state.color === c.hex ? "border-teal-500 scale-110 shadow-md" : "border-gray-200"
              }`}
              style={{ background: c.hex }} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <label className="text-xs text-gray-500">Warna custom:</label>
          <input type="color" value={state.color}
            onChange={e => set({ color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
          <span className="text-xs font-mono text-gray-400">{state.color}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Desain ─────────────────────────────────────── */
function Step2({
  state, set, previewSide, setPreviewSide,
}: { state: BuilderState; set: (s: Partial<BuilderState>) => void; previewSide: ViewSide; setPreviewSide: (s: ViewSide) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [newText,  setNewText]  = useState("");
  const [newColor, setNewColor] = useState("#ffffff");
  const [newSize,  setNewSize]  = useState(10);
  const [newBold,  setNewBold]  = useState(true);
  const [newPreset, setNewPreset] = useState("chest-center");
  const [newFont,  setNewFont]  = useState(DEFAULT_FONT);
  const [newShape, setNewShape] = useState<TextShape>(DEFAULT_SHAPE);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdateText = (id: string, patch: Partial<TextEl>) => {
    set({ texts: state.texts.map(t => t.id === id ? { ...t, ...patch } : t) });
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    const preset = TEXT_PRESETS.find(p => p.id === newPreset) ?? TEXT_PRESETS[1];
    const el: TextEl = {
      id: Date.now().toString(), text: newText.trim(),
      color: newColor, size: newSize, bold: newBold,
      side: preset.side, x: preset.x, y: preset.y,
      font: newFont, shape: newShape,
    };
    set({ texts: [...state.texts, el] });
    setNewText("");
    setPreviewSide(preset.side);
    setEditingId(el.id);
  };

  const handleRemoveText = (id: string) => {
    set({ texts: state.texts.filter(t => t.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set({ logoDataUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Print method */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Metode Cetak</p>
        <div className="grid grid-cols-2 gap-2">
          {PRINT_METHODS.map(m => (
            <button key={m.id} type="button" onClick={() => set({ printMethod: m.id })}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                state.printMethod === m.id
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : `border-gray-200 ${m.color} hover:border-gray-300`
              }`}>
              {state.printMethod === m.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              <p className="text-sm font-bold text-gray-800">{m.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
              <p className="text-[11px] font-semibold text-teal-600 mt-1">
                {m.surcharge > 0 ? `+${formatRupiah(m.surcharge)}/pcs` : "Gratis"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Add text */}
      {state.printMethod !== "tanpa" && (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-teal-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tambah Teks</p>
          </div>

          <input
            type="text" value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddText(); }}
            placeholder="Contoh: TEAM VANNY 2025"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 bg-white"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Posisi awal</label>
              <select value={newPreset} onChange={e => setNewPreset(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
                {TEXT_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Ukuran font</label>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setNewSize(s => Math.max(6, s - 2))}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-semibold w-6 text-center">{newSize}</span>
                <button type="button" onClick={() => setNewSize(s => Math.min(48, s + 2))}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Font picker */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block">Font</label>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {FONTS.map(f => (
                <button key={f.family} type="button" onClick={() => setNewFont(f.family)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    newFont === f.family
                      ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`} style={{ fontFamily: f.family }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shape picker */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block">Bentuk teks</label>
            <div className="grid grid-cols-4 gap-1.5">
              {SHAPES.map(s => (
                <button key={s.id} type="button" onClick={() => setNewShape(s.id)}
                  className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    newShape === s.id
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-gray-500">Warna</label>
              <input type="color" value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
            </div>
            <button type="button" onClick={() => setNewBold(b => !b)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                newBold ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"
              }`}>B</button>
            <button type="button" onClick={handleAddText}
              disabled={!newText.trim()}
              className="ml-auto px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>

          {/* Existing texts — with inline editing */}
          {state.texts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 font-medium">Klik pensil untuk edit • Drag di canvas untuk pindah posisi</p>
              {state.texts.map(t => {
                const isEditing = editingId === t.id;
                return (
                  <div key={t.id} className={`rounded-xl border overflow-hidden transition-all ${
                    isEditing ? "border-teal-300 shadow-sm shadow-teal-100" : "border-gray-100 bg-white"
                  }`}>
                    {/* Row */}
                    <div className={`flex items-center justify-between px-3 py-2 ${isEditing ? "bg-teal-50" : "bg-white"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ background: t.color }} />
                        <span className="text-xs font-semibold text-gray-800 truncate">{t.text || <span className="italic text-gray-400">kosong</span>}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">{t.side === "front" ? "Depan" : "Belakang"}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button type="button" onClick={() => { setEditingId(isEditing ? null : t.id); if (!isEditing) setPreviewSide(t.side); }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isEditing ? "bg-teal-500 text-white" : "hover:bg-gray-100 text-gray-400 hover:text-teal-500"
                          }`} title="Edit">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => handleRemoveText(t.id)}
                          className="w-6 h-6 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors" title="Hapus">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit panel */}
                    {isEditing && (
                      <div className="px-3 pb-3 pt-2 space-y-3 border-t border-teal-100 bg-white">
                        {/* Text input */}
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">Teks</label>
                          <input type="text" value={t.text}
                            onChange={e => handleUpdateText(t.id, { text: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                          />
                        </div>

                        {/* Preset position buttons */}
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Posisi preset (atau drag langsung di canvas)</label>
                          <div className="grid grid-cols-2 gap-1">
                            {TEXT_PRESETS.map(p => (
                              <button key={p.id} type="button"
                                onClick={() => { handleUpdateText(t.id, { x: p.x, y: p.y, side: p.side }); setPreviewSide(p.side); }}
                                className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all text-left ${
                                  t.side === p.side && Math.abs(t.x - p.x) < 3 && Math.abs(t.y - p.y) < 3
                                    ? "bg-teal-600 text-white border-teal-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                                }`}>
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color + size + bold + side */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-gray-500">Warna</label>
                            <input type="color" value={t.color}
                              onChange={e => handleUpdateText(t.id, { color: e.target.value })}
                              className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-gray-500">Ukuran</label>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => handleUpdateText(t.id, { size: Math.max(6, t.size - 2) })}
                                className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600">
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold w-6 text-center">{t.size}</span>
                              <button type="button" onClick={() => handleUpdateText(t.id, { size: Math.min(48, t.size + 2) })}
                                className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600">
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <button type="button" onClick={() => handleUpdateText(t.id, { bold: !t.bold })}
                            className={`px-2.5 py-0.5 rounded-lg border text-xs font-extrabold transition-all ${
                              t.bold ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
                            }`}>B</button>
                          <div className="flex items-center gap-1">
                            {(["front","back"] as PreviewSide[]).map(s => (
                              <button key={s} type="button"
                                onClick={() => { handleUpdateText(t.id, { side: s }); setPreviewSide(s); }}
                                className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all ${
                                  t.side === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}>
                                {s === "front" ? "Depan" : "Belakang"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Font picker (edit) */}
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Font</label>
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                            {FONTS.map(f => (
                              <button key={f.family} type="button"
                                onClick={() => handleUpdateText(t.id, { font: f.family })}
                                className={`flex-shrink-0 px-2.5 py-1 rounded-lg border text-[10px] transition-all ${
                                  (t.font ?? DEFAULT_FONT) === f.family
                                    ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`} style={{ fontFamily: f.family }}>
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Shape picker (edit) */}
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Bentuk teks</label>
                          <div className="grid grid-cols-4 gap-1">
                            {SHAPES.map(s => (
                              <button key={s.id} type="button"
                                onClick={() => handleUpdateText(t.id, { shape: s.id })}
                                className={`py-1 rounded-lg border text-[10px] font-medium transition-all ${
                                  (t.shape ?? "normal") === s.id
                                    ? "border-teal-500 bg-teal-50 text-teal-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload logo */}
      {state.printMethod !== "tanpa" && (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">Upload Logo / Gambar</p>
          </div>

          {state.logoDataUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src={state.logoDataUrl} alt="logo" className="w-14 h-14 object-contain rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500 mb-1.5">Posisi cepat</p>
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {[
                      { label: "Tengah Depan",   side: "front" as PreviewSide, x: 50, y: 42 },
                      { label: "Tengah Belakang",side: "back"  as PreviewSide, x: 50, y: 42 },
                      { label: "Lengan Kiri",    side: "front" as PreviewSide, x: 19, y: 44 },
                      { label: "Lengan Kanan",   side: "front" as PreviewSide, x: 81, y: 44 },
                    ].map(p => (
                      <button key={p.label} type="button"
                        onClick={() => { set({ logoSide: p.side, logoX: p.x, logoY: p.y }); setPreviewSide(p.side); }}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-all text-left ${
                          state.logoSide === p.side && Math.abs(state.logoX - p.x) < 4 && Math.abs(state.logoY - p.y) < 4
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => set({ logoDataUrl: null, logoX: 50, logoY: 42 })}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X className="w-3 h-3" /> Hapus logo
                  </button>
                </div>
              </div>
              {/* Size slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-gray-500">Ukuran logo</span>
                  <span className="text-[11px] font-semibold text-gray-700">{state.logoSize}px</span>
                </div>
                <input type="range" min={16} max={160} step={2}
                  value={state.logoSize}
                  onChange={e => set({ logoSize: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full accent-teal-600 cursor-pointer" />
                <p className="text-[10px] text-gray-400 mt-1">Drag logo di canvas untuk pindahkan posisi</p>
              </div>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-2 hover:border-teal-300 hover:bg-teal-50/40 transition-all">
                <Upload className="w-6 h-6 text-gray-400" />
                <p className="text-xs text-gray-500">Klik untuk upload logo / gambar</p>
                <p className="text-[10px] text-gray-400">PNG, JPG, SVG — maks 5MB</p>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Ukuran & Jumlah ────────────────────────────── */
function Step3({ state, set }: { state: BuilderState; set: (s: Partial<BuilderState>) => void }) {
  const totalQty = Object.values(state.sizeBreakdown).reduce((a, b) => a + b, 0);
  const garment  = GARMENTS.find(g => g.id === state.garment)!;
  const method   = PRINT_METHODS.find(m => m.id === state.printMethod)!;
  const unitPrice = garment.basePrice + method.surcharge;

  const setSize = (size: string, delta: number) => {
    set({
      sizeBreakdown: {
        ...state.sizeBreakdown,
        [size]: Math.max(0, (state.sizeBreakdown[size] ?? 0) + delta),
      },
    });
  };

  // Make sure all SIZES exist in breakdown
  const breakdown = Object.fromEntries(SIZES.map(s => [s, state.sizeBreakdown[s] ?? 0]));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah per Ukuran</p>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
            Total: {totalQty} pcs
          </span>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {SIZES.map((size, i) => (
            <div key={size}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""} ${breakdown[size] > 0 ? "bg-teal-50/40" : "bg-white"}`}>
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  breakdown[size] > 0 ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"
                }`}>{size}</span>
                {breakdown[size] > 0 && (
                  <span className="text-xs text-teal-600 font-medium">
                    {formatRupiah(unitPrice * breakdown[size])}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSize(size, -1)} disabled={breakdown[size] === 0}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:enabled:bg-gray-100 transition-colors">
                  <Minus className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <span className={`text-base font-bold min-w-[24px] text-center ${breakdown[size] > 0 ? "text-teal-700" : "text-gray-400"}`}>
                  {breakdown[size]}
                </span>
                <button type="button" onClick={() => setSize(size, 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      {totalQty > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/40 border border-teal-100 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600/70">Estimasi Total</p>
          <div className="text-xs text-teal-700/70 space-y-1">
            <div className="flex justify-between">
              <span>Harga dasar {garment.label}</span>
              <span>{formatRupiah(garment.basePrice)}/pcs</span>
            </div>
            {method.surcharge > 0 && (
              <div className="flex justify-between">
                <span>Biaya {method.label}</span>
                <span>+{formatRupiah(method.surcharge)}/pcs</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-teal-700 border-t border-teal-200 pt-1 mt-1">
              <span>{totalQty} pcs × {formatRupiah(unitPrice)}</span>
              <span>{formatRupiah(unitPrice * totalQty)}</span>
            </div>
          </div>
          <p className="text-[10px] text-teal-600/60">*Estimasi, harga final dikonfirmasi admin</p>
        </motion.div>
      )}

      {totalQty === 0 && (
        <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-100 rounded-xl py-3">
          Tambahkan setidaknya 1 pcs untuk lanjut ke keranjang
        </p>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Jenis & Warna",  icon: Scissors },
  { id: 2, label: "Desain",         icon: Palette  },
  { id: 3, label: "Ukuran & Qty",   icon: Layers   },
];

interface Props { onAddToCart: (item: CartItem) => void; setSection: (s: any) => void; }

export default function PortalCustomBuilder({ onAddToCart, setSection }: Props) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);
  const [previewSide, setPreviewSide] = useState<ViewSide>("front");
  const [added, setAdded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const set = (partial: Partial<BuilderState>) => setState(prev => ({ ...prev, ...partial }));

  const updateText = (id: string, patch: Partial<TextEl>) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...patch } : t),
    }));
  };

  const updateLogo = (patch: { x: number; y: number }) => {
    set({ logoX: patch.x, logoY: patch.y });
  };

  const totalQty   = Object.values(state.sizeBreakdown).reduce((a, b) => a + b, 0);
  const garment    = GARMENTS.find(g => g.id === state.garment)!;
  const method     = PRINT_METHODS.find(m => m.id === state.printMethod)!;
  const unitPrice  = garment.basePrice + method.surcharge;
  const totalPrice = unitPrice * totalQty;

  const handleAddToCart = () => {
    if (totalQty === 0) return;

    const sizeLabel = Object.entries(state.sizeBreakdown)
      .filter(([, q]) => q > 0)
      .map(([s, q]) => `${s}×${q}`)
      .join(", ");

    const textSummary = state.texts.length > 0
      ? `Teks: ${state.texts.map(t => t.text).join(", ")}. `
      : "";
    const logoSummary = state.logoDataUrl ? "Ada logo. " : "";

    const virtualProduct: Product = {
      id: `custom-${Date.now()}`,
      name: `Custom ${garment.label}`,
      category: "Custom",
      material: `${method.label} — ${sizeLabel}`,
      description: `${textSummary}${logoSummary}Warna: ${FABRIC_COLORS.find(c => c.hex === state.color)?.name ?? state.color}`,
      price: unitPrice,
      min_order: 1,
      status: "aktif",
      sizes: null, size_prices: null, image_url: null, image_urls: null,
    };

    const cartItem: CartItem = {
      id: `custom-${Date.now()}`,
      product: virtualProduct,
      qty: totalQty,
      selectedSize: null,
      unitPrice,
      notes: JSON.stringify({ garment: state.garment, color: state.color, printMethod: state.printMethod, sizeBreakdown: state.sizeBreakdown, texts: state.texts, hasLogo: !!state.logoDataUrl }),
    };

    onAddToCart(cartItem);
    setAdded(true);
    setTimeout(() => { setSection("keranjang"); }, 900);
  };

  const reset = () => { setState(DEFAULT_STATE); setStep(1); setAdded(false); setPreviewSide("front"); };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900">Custom Builder</h2>
          </div>
          <p className="text-sm text-muted-foreground">Desain bajumu sendiri, kami yang bikin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors font-semibold">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button type="button" onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done   = step > s.id;
          const active = step === s.id;
          const Icon   = s.icon;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button type="button"
                onClick={() => { if (done) setStep(s.id); }}
                disabled={!done}
                className={`flex flex-col items-center gap-1 transition-all flex-shrink-0 ${done ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                  done   ? "bg-emerald-500 border-emerald-500 shadow-sm" :
                  active ? "bg-teal-600 border-teal-600 shadow-md shadow-teal-200" :
                           "bg-white border-gray-200"
                }`}>
                  {done ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-400"}`} />}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${
                  active ? "text-teal-700" : done ? "text-emerald-600" : "text-gray-400"
                }`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${step > s.id ? "bg-emerald-300" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
        {/* Left: Preview */}
        <div className="order-2 lg:order-1">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-100 sticky top-4">
            <ShirtPreview state={state} side={previewSide} onChangeSide={setPreviewSide}
              onUpdateText={step === 2 ? updateText : undefined}
              onUpdateLogo={step === 2 ? updateLogo : undefined} />

            {/* Quick summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Jenis</p>
                <p className="font-semibold text-gray-800">{garment.label}</p>
              </div>
              <div>
                <p className="text-gray-400">Cetak</p>
                <p className="font-semibold text-gray-800">{method.label}</p>
              </div>
              {totalQty > 0 && (
                <>
                  <div>
                    <p className="text-gray-400">Total Qty</p>
                    <p className="font-semibold text-gray-800">{totalQty} pcs</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Est. Total</p>
                    <p className="font-semibold text-teal-700">{formatRupiah(totalPrice)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Config */}
        <div className="order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {step === 1 && <Step1 state={state} set={set} />}
              {step === 2 && <Step2 state={state} set={set} previewSide={previewSide} setPreviewSide={setPreviewSide} />}
              {step === 3 && <Step3 state={state} set={set} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 rounded-xl border-gray-200 text-gray-700">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center gap-1.5 px-6">
                Lanjut <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleAddToCart} disabled={totalQty === 0 || added}
                className={`rounded-xl flex items-center gap-2 px-6 font-bold transition-all ${
                  added ? "bg-emerald-500 hover:bg-emerald-500 text-white" :
                  totalQty === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" :
                  "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200"
                }`}>
                {added ? (
                  <><Check className="w-4 h-4" /> Masuk Keranjang!</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" />
                    {totalQty > 0 ? `Tambah ke Keranjang — ${formatRupiah(totalPrice)}` : "Masukkan jumlah dulu"}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Full preview modal */}
      <AnimatePresence>
        {showPreview && (
          <PreviewModal state={state} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
