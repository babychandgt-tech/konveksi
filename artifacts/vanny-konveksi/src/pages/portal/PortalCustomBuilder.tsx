import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Check, Plus, Minus, Upload,
  ShoppingCart, RotateCcw, Type, ImageIcon, X, Wand2,
  Palette, Layers, Scissors, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem, Product, formatRupiah } from "./types";

/* ─── Types ──────────────────────────────────────────────── */
type GarmentId    = "kaos" | "polo" | "hoodie" | "jaket";
type PrintMethod  = "tanpa" | "sablon" | "dtf" | "bordir";
type PreviewSide  = "front" | "back";
type TextPos      = "chest-left" | "chest-center" | "back-center" | "back-top";

interface TextEl {
  id: string; text: string; color: string;
  size: number; bold: boolean; side: PreviewSide; position: TextPos;
}
interface BuilderState {
  garment: GarmentId; color: string; printMethod: PrintMethod;
  texts: TextEl[]; logoDataUrl: string | null; logoSide: PreviewSide;
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
const TEXT_POSITIONS: { id: TextPos; label: string; side: PreviewSide }[] = [
  { id: "chest-left",   label: "Dada Kiri (Depan)",    side: "front" },
  { id: "chest-center", label: "Tengah Depan",          side: "front" },
  { id: "back-center",  label: "Tengah Belakang",       side: "back"  },
  { id: "back-top",     label: "Leher Belakang (Kecil)",side: "back"  },
];

const DEFAULT_STATE: BuilderState = {
  garment: "kaos", color: "#1e3a5f", printMethod: "sablon",
  texts: [], logoDataUrl: null, logoSide: "front",
  sizeBreakdown: { S: 0, M: 0, L: 0, XL: 0 },
};

/* ─── SVG Garment Components ─────────────────────────────── */
function isLight(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

function KaosSVG({ fill, uid = "k" }: { fill: string; uid?: string }) {
  const light = isLight(fill);
  const borderColor = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const collarShade = light ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.32)";
  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
          <stop offset="22%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="78%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
        <linearGradient id={`${uid}hg`} x1="0.3" y1="0" x2="0.7" y2="0.4">
          <stop offset="0%"  stopColor={light ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.07)"} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={`${uid}sh`} x="-15%" y="-8%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.22)" />
        </filter>
      </defs>
      {/* Ground shadow */}
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      {/* Main shirt body */}
      <path filter={`url(#${uid}sh)`}
        d="M88,50 C70,50 46,60 32,78 L8,100 L38,120 C48,108 60,106 62,105
           C62,105 60,175 59,258 Q130,272 201,258 C200,175 198,105 198,105
           C200,106 212,108 222,120 L252,100 L228,78
           C214,60 190,50 172,50 C162,40 148,35 130,34 C112,35 98,40 88,50 Z"
        fill={fill} stroke={borderColor} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Side shading */}
      <path d="M88,50 C70,50 46,60 32,78 L8,100 L38,120 C48,108 60,106 62,105
               C62,105 60,175 59,258 Q130,272 201,258 C200,175 198,105 198,105
               C200,106 212,108 222,120 L252,100 L228,78
               C214,60 190,50 172,50 C162,40 148,35 130,34 C112,35 98,40 88,50 Z"
        fill={`url(#${uid}sg)`} />
      {/* Highlight */}
      <path d="M88,50 C70,50 46,60 32,78 L8,100 L38,120 C48,108 60,106 62,105
               C62,105 60,175 59,258 Q130,272 201,258 C200,175 198,105 198,105
               C200,106 212,108 222,120 L252,100 L228,78
               C214,60 190,50 172,50 C162,40 148,35 130,34 C112,35 98,40 88,50 Z"
        fill={`url(#${uid}hg)`} />
      {/* Collar */}
      <path d="M88,50 C98,40 112,35 130,34 C148,35 162,40 172,50
               C162,60 148,66 130,68 C112,66 98,60 88,50 Z"
        fill={collarShade} stroke={borderColor} strokeWidth="1" />
      {/* Sleeve crease lines */}
      <path d="M32,78 C38,90 40,100 38,120" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" strokeLinecap="round" />
      <path d="M228,78 C222,90 220,100 222,120" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom hem stitch */}
      <path d="M68,257 Q130,270 192,257" fill="none" stroke={borderColor} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function PoloSVG({ fill, uid = "p" }: { fill: string; uid?: string }) {
  const light = isLight(fill);
  const borderColor = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const collarFill  = light ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.22)";
  const collarStroke = light ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.4)";
  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
          <stop offset="22%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="78%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
        <linearGradient id={`${uid}hg`} x1="0.3" y1="0" x2="0.7" y2="0.4">
          <stop offset="0%"  stopColor={light ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.06)"} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={`${uid}sh`} x="-15%" y="-8%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.22)" />
        </filter>
      </defs>
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      {/* Body */}
      <path filter={`url(#${uid}sh)`}
        d="M96,65 C76,58 48,62 32,80 L8,102 L38,122 C48,110 62,108 64,107
           C64,107 62,175 61,258 Q130,272 199,258 C198,175 196,107 196,107
           C198,108 212,110 222,122 L252,102 L228,80
           C212,62 184,58 164,65 L152,80 L130,88 L108,80 Z"
        fill={fill} stroke={borderColor} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M96,65 C76,58 48,62 32,80 L8,102 L38,122 C48,110 62,108 64,107
               C64,107 62,175 61,258 Q130,272 199,258 C198,175 196,107 196,107
               C198,108 212,110 222,122 L252,102 L228,80
               C212,62 184,58 164,65 L152,80 L130,88 L108,80 Z"
        fill={`url(#${uid}sg)`} />
      <path d="M96,65 C76,58 48,62 32,80 L8,102 L38,122 C48,110 62,108 64,107
               C64,107 62,175 61,258 Q130,272 199,258 C198,175 196,107 196,107
               C198,108 212,110 222,122 L252,102 L228,80
               C212,62 184,58 164,65 L152,80 L130,88 L108,80 Z"
        fill={`url(#${uid}hg)`} />
      {/* Left collar panel */}
      <path d="M96,65 L108,80 L130,88 L120,115 L98,108 L96,65 Z"
        fill={collarFill} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
      {/* Right collar panel */}
      <path d="M164,65 L152,80 L130,88 L140,115 L162,108 L164,65 Z"
        fill={collarFill} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
      {/* Collar fold highlight */}
      <path d="M108,80 C116,76 122,74 130,72" fill="none" stroke={light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M152,80 C144,76 138,74 130,72" fill="none" stroke={light ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" strokeLinecap="round" />
      {/* Placket + buttons */}
      <line x1="130" y1="88" x2="130" y2="138" stroke={borderColor} strokeWidth="1.2" />
      {[98, 110, 122].map(y => (
        <circle key={y} cx="130" cy={y} r="2.8" fill={light ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)"} />
      ))}
      {/* Hem */}
      <path d="M70,257 Q130,270 190,257" fill="none" stroke={borderColor} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function HoodieSVG({ fill, uid = "h" }: { fill: string; uid?: string }) {
  const light = isLight(fill);
  const borderColor = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const pocketFill  = light ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.25)";
  const stringColor = light ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)";
  return (
    <svg viewBox="0 0 260 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.18)" />
          <stop offset="25%"  stopColor="rgba(0,0,0,0.02)" />
          <stop offset="75%"  stopColor="rgba(0,0,0,0.02)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>
        <linearGradient id={`${uid}hg`} x1="0.3" y1="0" x2="0.7" y2="0.4">
          <stop offset="0%"  stopColor={light ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.06)"} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={`${uid}sh`} x="-15%" y="-8%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.22)" />
        </filter>
      </defs>
      <ellipse cx="130" cy="295" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      {/* Hood */}
      <path filter={`url(#${uid}sh)`}
        d="M92,54 C76,36 42,38 26,68 L26,86 L50,94
           C58,66 78,56 102,62 L130,68 L158,62
           C182,56 202,66 210,94 L234,86 L234,68
           C218,38 184,36 168,54
           C158,40 146,30 130,28 C114,30 102,40 92,54 Z"
        fill={fill} stroke={borderColor} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Body */}
      <path
        d="M102,62 C82,64 46,76 28,88 L8,116 L40,134
           C50,120 62,112 64,111 C64,111 62,180 61,263
           Q130,276 199,263 C198,180 196,111 196,111
           C198,112 210,120 220,134 L252,116 L232,88
           C214,76 178,64 158,62 L130,68 Z"
        fill={fill} stroke={borderColor} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Shading */}
      <path d="M92,54 C76,36 42,38 26,68 L26,86 L50,94
               C58,66 78,56 102,62 L130,68 L158,62
               C182,56 202,66 210,94 L234,86 L234,68
               C218,38 184,36 168,54
               C158,40 146,30 130,28 C114,30 102,40 92,54 Z"
        fill={`url(#${uid}sg)`} />
      <path d="M102,62 C82,64 46,76 28,88 L8,116 L40,134
               C50,120 62,112 64,111 C64,111 62,180 61,263
               Q130,276 199,263 C198,180 196,111 196,111
               C198,112 210,120 220,134 L252,116 L232,88
               C214,76 178,64 158,62 L130,68 Z"
        fill={`url(#${uid}sg)`} />
      <path d="M102,62 C82,64 46,76 28,88 L8,116 L40,134
               C50,120 62,112 64,111 C64,111 62,180 61,263
               Q130,276 199,263 C198,180 196,111 196,111
               C198,112 210,120 220,134 L252,116 L232,88
               C214,76 178,64 158,62 L130,68 Z"
        fill={`url(#${uid}hg)`} />
      {/* Hood-body seam line */}
      <path d="M102,62 C112,64 120,66 130,68 C140,66 148,64 158,62"
        fill="none" stroke={borderColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Hood inner curve */}
      <path d="M50,94 C68,70 94,62 130,68 C166,62 192,70 210,94"
        fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" strokeLinecap="round" />
      {/* Drawstrings */}
      <path d="M118,68 C116,80 113,90 110,104" stroke={stringColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M142,68 C144,80 147,90 150,104" stroke={stringColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="110" cy="104" r="3.5" fill={stringColor} />
      <circle cx="150" cy="104" r="3.5" fill={stringColor} />
      {/* Kangaroo pocket */}
      <path d="M84,198 C84,192 88,188 94,188 L166,188 C172,188 176,192 176,198 L176,244 C176,250 172,254 166,254 L94,254 C88,254 84,250 84,244 Z"
        fill={pocketFill} stroke={borderColor} strokeWidth="1" />
      <line x1="130" y1="188" x2="130" y2="254" stroke={borderColor} strokeWidth="0.8" />
      {/* Hem */}
      <path d="M70,262 Q130,275 190,262" fill="none" stroke={borderColor} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

function JaketSVG({ fill, uid = "j" }: { fill: string; uid?: string }) {
  const light = isLight(fill);
  const borderColor = light ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.35)";
  const lapelFill   = light ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.28)";
  const pocketFill  = light ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.22)";
  const zipperColor = light ? "rgba(0,0,0,0.2)"  : "rgba(255,255,255,0.2)";
  return (
    <svg viewBox="0 0 260 295" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}sg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.20)" />
          <stop offset="25%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="75%"  stopColor="rgba(0,0,0,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.20)" />
        </linearGradient>
        <linearGradient id={`${uid}hg`} x1="0.3" y1="0" x2="0.7" y2="0.4">
          <stop offset="0%"  stopColor={light ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.06)"} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id={`${uid}sh`} x="-15%" y="-8%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.22)" />
        </filter>
      </defs>
      <ellipse cx="130" cy="290" rx="62" ry="5" fill="rgba(0,0,0,0.07)" />
      {/* Body */}
      <path filter={`url(#${uid}sh)`}
        d="M90,50 C70,52 44,62 28,82 L6,112 L40,132
           C50,118 62,110 64,109 C64,109 62,178 61,258
           Q130,270 199,258 C198,178 196,109 196,109
           C198,110 210,118 220,132 L254,112 L232,82
           C216,62 190,52 170,50 L158,72 L130,82 L102,72 Z"
        fill={fill} stroke={borderColor} strokeWidth="1.2" strokeLinejoin="round" />
      {/* Shading */}
      <path d="M90,50 C70,52 44,62 28,82 L6,112 L40,132
               C50,118 62,110 64,109 C64,109 62,178 61,258
               Q130,270 199,258 C198,178 196,109 196,109
               C198,110 210,118 220,132 L254,112 L232,82
               C216,62 190,52 170,50 L158,72 L130,82 L102,72 Z"
        fill={`url(#${uid}sg)`} />
      <path d="M90,50 C70,52 44,62 28,82 L6,112 L40,132
               C50,118 62,110 64,109 C64,109 62,178 61,258
               Q130,270 199,258 C198,178 196,109 196,109
               C198,110 210,118 220,132 L254,112 L232,82
               C216,62 190,52 170,50 L158,72 L130,82 L102,72 Z"
        fill={`url(#${uid}hg)`} />
      {/* Left lapel */}
      <path d="M90,50 L102,72 L130,82 L116,114 L96,106 C92,90 86,68 90,50 Z"
        fill={lapelFill} stroke={borderColor} strokeWidth="1" strokeLinejoin="round" />
      {/* Right lapel */}
      <path d="M170,50 L158,72 L130,82 L144,114 L164,106 C168,90 174,68 170,50 Z"
        fill={lapelFill} stroke={borderColor} strokeWidth="1" strokeLinejoin="round" />
      {/* Lapel fold highlight */}
      <path d="M102,72 C112,70 120,74 130,78" fill="none" stroke={light ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M158,72 C148,70 140,74 130,78" fill="none" stroke={light ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"} strokeWidth="1.2" strokeLinecap="round" />
      {/* Center zipper */}
      <line x1="130" y1="82" x2="130" y2="258" stroke={zipperColor} strokeWidth="1.5" />
      {[96,110,124,138,152,166,180,194,208,222,236,250].map(y => (
        <line key={y} x1="127" y1={y} x2="133" y2={y} stroke={zipperColor} strokeWidth="1.2" />
      ))}
      {/* Chest pockets */}
      <rect x="72" y="126" width="42" height="26" rx="4" fill={pocketFill} stroke={borderColor} strokeWidth="0.9" />
      <rect x="146" y="126" width="42" height="26" rx="4" fill={pocketFill} stroke={borderColor} strokeWidth="0.9" />
      <line x1="72" y1="134" x2="114" y2="134" stroke={borderColor} strokeWidth="0.7" />
      <line x1="146" y1="134" x2="188" y2="134" stroke={borderColor} strokeWidth="0.7" />
      {/* Hip pockets */}
      <path d="M66,196 C66,190 70,186 76,186 L120,186 C126,186 130,190 130,196 L130,225 C130,231 126,235 120,235 L72,235 C68,235 66,233 66,229 Z"
        fill={pocketFill} stroke={borderColor} strokeWidth="0.9" />
      <path d="M130,196 C130,190 134,186 140,186 L184,186 C190,186 194,190 194,196 L194,225 C194,231 190,235 184,235 L136,235 C132,235 130,233 130,229 Z"
        fill={pocketFill} stroke={borderColor} strokeWidth="0.9" />
      {/* Hem */}
      <path d="M70,257 Q130,268 190,257" fill="none" stroke={borderColor} strokeWidth="0.8" strokeDasharray="4,3" />
    </svg>
  );
}

const GARMENT_SVG: Record<GarmentId, React.FC<{ fill: string; uid?: string }>> = {
  kaos: KaosSVG, polo: PoloSVG, hoodie: HoodieSVG, jaket: JaketSVG,
};

/* ─── Text position CSS ──────────────────────────────────── */
const TEXT_POS_STYLE: Record<TextPos, React.CSSProperties> = {
  "chest-left":   { top: "40%", left: "36%", transform: "translate(-50%, -50%)" },
  "chest-center": { top: "44%", left: "50%", transform: "translate(-50%, -50%)" },
  "back-center":  { top: "46%", left: "50%", transform: "translate(-50%, -50%)" },
  "back-top":     { top: "24%", left: "50%", transform: "translate(-50%, -50%)" },
};

/* ─── Preview Panel ──────────────────────────────────────── */
function ShirtPreview({
  state, side, onChangeSide,
}: { state: BuilderState; side: PreviewSide; onChangeSide: (s: PreviewSide) => void }) {
  const GarmentComp = GARMENT_SVG[state.garment];
  const visibleTexts = state.texts.filter(t => t.side === side);
  const showLogo     = state.logoDataUrl && state.logoSide === side;
  const colorName    = FABRIC_COLORS.find(c => c.hex === state.color)?.name ?? "Custom";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Side toggle */}
      <div className="flex bg-white/60 border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
        {(["front","back"] as PreviewSide[]).map(s => (
          <button key={s} type="button" onClick={() => onChangeSide(s)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              side === s ? "bg-white shadow text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}>
            {s === "front" ? "Depan" : "Belakang"}
          </button>
        ))}
      </div>

      {/* Shirt canvas */}
      <div className="relative w-full" style={{ maxWidth: 290 }}>
        {/* Studio background */}
        <div className="rounded-2xl overflow-hidden" style={{
          background: "radial-gradient(ellipse at 50% 40%, #e8ecf0 0%, #d4d8de 100%)",
          padding: "28px 24px 20px",
        }}>
          {/* Inner spotlight */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "70%", height: "55%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="relative">
            <GarmentComp fill={state.color} uid={`prev-${state.garment}`} />

            {/* Text overlays */}
            {visibleTexts.map(t => (
              <div key={t.id} className="absolute pointer-events-none select-none"
                style={{ ...TEXT_POS_STYLE[t.position], color: t.color,
                  fontSize: t.size, fontWeight: t.bold ? 700 : 500,
                  fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center",
                  whiteSpace: "nowrap", letterSpacing: "0.04em",
                  textShadow: isLight(state.color) ? "0 1px 2px rgba(0,0,0,0.25)" : "0 1px 3px rgba(0,0,0,0.5)" }}>
                {t.text}
              </div>
            ))}

            {/* Logo overlay */}
            {showLogo && (
              <div className="absolute" style={{ top: "42%", left: "50%", transform: "translate(-50%,-50%)" }}>
                <img src={state.logoDataUrl!} alt="logo"
                  className="w-20 h-20 object-contain" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
              </div>
            )}

            {/* Empty state hint */}
            {visibleTexts.length === 0 && !showLogo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-medium text-gray-400 bg-white/60 px-3 py-1 rounded-full shadow-sm border border-white/80">
                  Desain muncul di sini
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ background: state.color }} />
        <span>{FABRIC_COLORS.find(c => c.hex === state.color)?.name ?? "Custom"}</span>
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
                  <GComp fill={active ? "#0d9488" : "#9ca3af"} />
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
}: { state: BuilderState; set: (s: Partial<BuilderState>) => void; previewSide: PreviewSide; setPreviewSide: (s: PreviewSide) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState("#ffffff");
  const [newSize, setNewSize] = useState(14);
  const [newBold, setNewBold] = useState(true);
  const [newPos, setNewPos] = useState<TextPos>("chest-center");

  const handleAddText = () => {
    if (!newText.trim()) return;
    const pos = TEXT_POSITIONS.find(p => p.id === newPos)!;
    const el: TextEl = {
      id: Date.now().toString(), text: newText.trim(),
      color: newColor, size: newSize, bold: newBold,
      side: pos.side, position: newPos,
    };
    set({ texts: [...state.texts, el] });
    setNewText("");
    // Switch preview side to match where text was added
    setPreviewSide(pos.side);
  };

  const handleRemoveText = (id: string) => {
    set({ texts: state.texts.filter(t => t.id !== id) });
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
            placeholder="Contoh: TEAM VANNY 2025"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 bg-white"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Posisi</label>
              <select value={newPos} onChange={e => setNewPos(e.target.value as TextPos)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white">
                {TEXT_POSITIONS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Ukuran font</label>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setNewSize(s => Math.max(8, s - 2))}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <Minus className="w-3 h-3" /></button>
                <span className="text-xs font-semibold w-6 text-center">{newSize}</span>
                <button type="button" onClick={() => setNewSize(s => Math.min(32, s + 2))}
                  className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <Plus className="w-3 h-3" /></button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-gray-500">Warna teks</label>
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

          {/* Existing texts */}
          {state.texts.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              {state.texts.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ background: t.color }} />
                    <span className="text-xs font-medium text-gray-800 truncate">{t.text}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {TEXT_POSITIONS.find(p => p.id === t.position)?.label}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleRemoveText(t.id)}
                    className="w-5 h-5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center shrink-0 ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
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
            <div className="flex items-center gap-3">
              <img src={state.logoDataUrl} alt="logo" className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-1" />
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  {(["front","back"] as PreviewSide[]).map(s => (
                    <button key={s} type="button" onClick={() => set({ logoSide: s })}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        state.logoSide === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200"
                      }`}>
                      {s === "front" ? "Depan" : "Belakang"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => set({ logoDataUrl: null })}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Hapus logo
                </button>
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
  const [previewSide, setPreviewSide] = useState<PreviewSide>("front");
  const [added, setAdded] = useState(false);

  const set = (partial: Partial<BuilderState>) => setState(prev => ({ ...prev, ...partial }));

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
        <button type="button" onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
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
            <ShirtPreview state={state} side={previewSide} onChangeSide={setPreviewSide} />

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
    </div>
  );
}
