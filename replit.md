# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Vanny Konveksi (artifacts/vanny-konveksi)
- **Type**: react-vite web app
- **Preview path**: `/`
- **Description**: Admin panel web app for Vanny Konveksi garment/konveksi business
- **Features**: Login, Dashboard, Katalog Produk, Pesanan, Pegawai, Produksi (Kanban), Keuangan, Pelanggan, Pengaturan
- **Language**: 100% Indonesian
- **Stack**: React + Vite + Tailwind CSS + Recharts + Lucide React + Wouter
- **Data**: All UI/design only — no backend, dummy data hardcoded
- **Colors**: Navy primary (#1A3C5E), Amber accent (#E8A838), dark sidebar (#0F1C2E)
- **Fonts**: Plus Jakarta Sans (headings), DM Sans (body)
