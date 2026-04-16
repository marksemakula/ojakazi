# ESign — E-Signature & E-Stamp Web App

A domain-verified organization platform for creating transparent e-signatures, applying them to documents, and designing custom e-stamps.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Canvas / Stamp editor | Fabric.js v6 |
| PDF handling | pdf-lib (embed) + pdfjs-dist (render) |
| Signature processing | Vanilla Canvas API |
| State management | Zustand (persisted auth) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh token rotation) |
| Domain verification | DNS TXT record + email token |
| Container | Docker + Docker Compose |

---

## Project Structure

```
ojakazi/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── api/           # Axios API wrappers
│   │   ├── components/
│   │   │   ├── auth/      # Login, Register, ProtectedRoute
│   │   │   ├── layout/    # Navbar, Layout
│   │   │   ├── organization/  # DomainVerification, Members
│   │   │   ├── signature/     # Upload, Processor, ColorPicker, DocumentSigner
│   │   │   ├── stamp/         # StampEditor (Fabric.js), Toolbar, Layers, List
│   │   │   └── ui/            # Button, Input, Modal, Badge
│   │   ├── pages/         # HomePage, LoginPage, SignaturePage, StampPage, OrgPage
│   │   ├── store/         # authStore, signatureStore, stampStore (Zustand)
│   │   ├── types/         # Shared TypeScript interfaces
│   │   └── utils/         # signatureProcessing.ts, pdfUtils.ts
│   └── Dockerfile
├── backend/           # Express REST API
│   ├── src/
│   │   ├── config/        # database.ts, jwt.ts
│   │   ├── middleware/    # auth, orgScope, errorHandler, rateLimiter
│   │   ├── models/        # Organization, User, Stamp
│   │   ├── routes/        # auth, stamp, domain, users
│   │   ├── utils/         # crypto, domainVerification, email, audit
│   │   ├── db/schema.sql  # PostgreSQL schema
│   │   ├── app.ts
│   │   └── index.ts
│   └── Dockerfile
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
cp .env.example .env          # fill in JWT secrets, SMTP credentials, etc.
docker compose up --build

# Frontend: http://localhost:80
# Backend:  http://localhost:4000/api/health
```

## Local Development

### Backend
```bash
cd backend && cp .env.example .env
npm install
psql $DATABASE_URL < src/db/schema.sql
npm run dev    # → http://localhost:4000
```

### Frontend
```bash
cd frontend && cp .env.example .env
npm install
npm run dev    # → http://localhost:5173
```

---

## Features

### Signature Module
1. **Upload** — drag-and-drop; PNG, JPG, JPEG, WebP (max 10 MB).
2. **Background removal** — soft chroma-key with adjustable threshold slider.
3. **Colour customisation** — HexColorPicker + preset swatches; live preview.
4. **Document overlay** — canvas-based drag/resize placement on image or PDF.
5. **Export** — download signature as PNG or full signed document as PDF/image.

### Stamp Editor (Fabric.js v6)
- Add text, rectangles, circles, ellipses, lines, and uploaded images.
- Layer panel — select, reorder, delete.
- 40-step undo/redo stack.
- Keyboard: `Ctrl+Z`, `Ctrl+Y`, `Delete`, `Ctrl+D`, Arrow keys.
- Save as JSON (org-scoped); export as 2× resolution PNG.

### Domain Verification
- **DNS TXT** — generates `esign-verify=<token>` record; polls DNS on demand.
- **Email** — sends code to `admin@<domain>`; user submits code in UI.
- Re-verify every 90 days (configurable).

### Security
- Helmet.js headers · Rate limiting · JWT rotation · bcrypt passwords (12 rounds).
- All stamp/org endpoints validate `orgId` from JWT.
- Audit log table with IP address for all sensitive actions.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Obtain token pair |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET  | `/api/auth/me` | Current user |
| GET  | `/api/domain/status` | Org verification status |
| POST | `/api/domain/start` | Generate verification token (admin) |
| POST | `/api/domain/verify` | Confirm DNS/email token (admin) |
| GET  | `/api/stamp` | List org stamps |
| POST | `/api/stamp` | Create stamp |
| PUT  | `/api/stamp/:id` | Update stamp |
| DELETE | `/api/stamp/:id` | Delete stamp |
| GET  | `/api/users/org/members` | List org members (admin) |

> Signature processing and PDF embedding runs **entirely client-side** — no documents are uploaded to the server.