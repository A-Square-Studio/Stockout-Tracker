# Stockout Tracker

An internal supply-chain tool for tracking current and potential future stockouts. Built with React + TypeScript (Vite) on the frontend and Express + PostgreSQL on the backend.

## Stack

- **Frontend:** React 19 + TypeScript, Vite 8, PapaParse (CSV), lucide-react (icons)
- **Backend:** Express 5 (Node.js / tsx), running on port 3000 in development
- **Database:** PostgreSQL (Replit managed) — all data persists server-side
- **Auth:** bcrypt-hashed passwords, express-session with HTTP-only cookies
- **Email:** Nodemailer (SMTP) for welcome emails when creating admin accounts

## How to run

```bash
npm run dev       # starts Express (port 3000) + Vite (port 5000) concurrently
npm run build     # builds the React app into dist/
npm start         # production: Express on port 5000 serving dist/
```

The workflow **Start application** (`npm run dev`) handles dev startup automatically on Replit.

## Environment secrets required

| Secret | Purpose |
|---|---|
| `SESSION_SECRET` | Signs session cookies — required, app refuses to start without it |
| `EMAIL_HOST` | SMTP server, e.g. `smtp.gmail.com` |
| `EMAIL_PORT` | Usually `587` (TLS) or `465` (SSL) |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASS` | Email password or app password |
| `EMAIL_FROM` | Display name + address, e.g. `Stockout Tracker <you@company.com>` |

## API routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, sets session cookie |
| POST | `/api/auth/logout` | — | Destroys session |
| GET | `/api/auth/me` | — | Returns current session username |
| GET | `/api/admins` | ✓ | List all admin accounts |
| POST | `/api/admins` | ✓ | Create admin + send welcome email |
| DELETE | `/api/admins/:username` | ✓ | Remove an admin |
| PUT | `/api/admins/:username/password` | ✓ | Change own password |
| GET | `/api/stockouts` | — | Get all stockout items |
| PUT | `/api/stockouts` | ✓ | Replace all stockout items (transactional) |
| DELETE | `/api/stockouts` | ✓ | Reset both tables to seed data |
| GET | `/api/future-stockouts` | — | Get potential future stockout items |
| PUT | `/api/future-stockouts` | ✓ | Replace future stockout items (transactional) |

## Data upload workflow

1. Export stockout report from Smartsheet/AX as CSV
2. **Current stockouts** columns: `Gating Item, Name, Product Line, Lead Time, Approximate Shipping Date, Escalation Owner, Top Level`
   - Top Level: comma-separated within a quoted cell, e.g. `"043-816,CTC-0002,DM-007"`
3. **Future stockouts** columns: `Part Number, Name, Product Line, Estimated Weeks on Hand`
4. Log in as Admin → Data upload → drop CSV → preview → Load

## Default admin credentials

- Username: `admin` / Password: `Admin1234!`
- **Change immediately** after first login via Admin → Manage Admins → Change your password

## Deployment

- Site: [stockout-tracker.com](https://stockout-tracker.com)
- Hosted on Replit (Autoscale deployment)
- Run `npm run build` then publish — Express serves the built `dist/` folder in production

## Future features

- **Spring Boot backend** — planned migration of the Express/Node.js backend to a Java Spring Boot service. The REST API surface (`/api/*` routes) and PostgreSQL schema should be preserved so the React frontend requires minimal changes. Session handling will need to be re-implemented (e.g. Spring Session with JDBC).

- **Ask AI** — conversational interface for querying stockout data using Claude (Anthropic).
  - Backend route already implemented: `POST /api/ask` in `server/routes/ai.ts`
  - Frontend component ready but hidden: `src/components/AskAI.tsx`
  - To re-enable: add `ANTHROPIC_API_KEY` to Secrets, then re-add `<AskAI items={items} />` inside the toolbar in `src/views/CardsView.tsx`

## Changelog

### 2026-07-03
- **Show password toggle** — added reusable `PasswordInput` component with eye icon; applied to all password fields on Login and Admin views.
- **Favicon** — added `public/favicon.svg` (teal pulse line on dark rounded square, matches header icon).
- **Deployment fix** — removed invalid `publicDir = "dist"` from `.replit` `[deployment]` block, which was causing autoscale health-check failures on promote.
- **Graph view — node colouring** — gating items with no external top-level connections now render green; self-referencing items that also have real external connections render coral; purple reserved for top-level SKU nodes.
- **Cards view — TOP LEVEL section** — section is now hidden when a part only references itself (no external assemblies). Count label accounts for the self-reference when present.
- **Multi-format file upload** — upload zones now accept CSV, Excel (`.xlsx` / `.xls`), and PDF in addition to CSV. Excel is parsed client-side via SheetJS; PDF text is extracted server-side via `pdf-parse` at `POST /api/parse-file`.
- **Graph tooltip — cursor-following** — tooltip now follows the mouse cursor while hovering rather than sitting in a fixed corner, keeping it close to the hovered node without blocking connection lines.
- **Graph tooltip — pinned mode** — clicking a node pins the tooltip to the top-right corner with pointer events enabled so the Clear button is fully clickable; hovering a different node resumes cursor-following mode.

## User preferences

_None recorded yet._
