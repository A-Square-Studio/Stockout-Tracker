# Stockout Tracker — Changelog

## 2026-07-03

### UI & UX Improvements

- **Show password toggle** — Added a reusable `PasswordInput` component with an eye icon. Applied to all password fields on the Login and Admin views so users can reveal what they are typing.

- **Favicon** — Added `public/favicon.svg`: a teal pulse/activity line on a dark rounded square background, matching the header icon. Appears in browser tabs and bookmarks.

- **Graph view — node colouring**
  - Gating items with no external top-level connections render **green**
  - Self-referencing items that also have real external connections render **coral**
  - Purple is reserved for top-level SKU nodes only

- **Cards view — TOP LEVEL section** — The section is now hidden when a part only references itself (no external assemblies). The count label correctly accounts for the self-reference when it is present.

- **Cards view — removed future stockouts legend** — Removed the bullet-point "Part Number / Estimated Weeks on Hand" legend that appeared at the bottom of the page.

---

### Graph View — Tooltip Improvements

- **Cursor-following tooltip** — The node detail tooltip now follows the mouse cursor while hovering, keeping it close to the hovered node and out of the way of connection lines.

- **Pinned mode** — Clicking a node pins the tooltip to the top-right corner with pointer events fully enabled, so the **Clear** button is easy to click. Hovering a different node resumes cursor-following mode.

---

### File Upload — Multi-Format Support

The upload zones now accept three file formats in addition to the original CSV:

| Format | How it works |
|---|---|
| **CSV** | Parsed directly in the browser (unchanged) |
| **Excel** `.xlsx` / `.xls` | Converted to CSV client-side via SheetJS, then parsed normally |
| **PDF** | Text extracted server-side via `pdf-parse` at `POST /api/parse-file`, then parsed |

Both the Current Stockouts and Future Stockouts upload zones support all three formats.

---

### PDF Download

- **Cards view — Download PDF button** — Added a printer icon button to the toolbar. When clicked, triggers the browser print dialog with only the card content visible:
  - Header, search bar, filters, and Definitions panel are hidden
  - A **"Current Stockouts"** section header appears above the cards grid
  - The **"Potential Future Stockouts"** table is included with its existing header, starting on a new page

- **Graph view — Download PDF button** — Added a printer icon button to the toolbar. When clicked:
  - Redraws the canvas with a **white background** and **dark text** so part numbers and labels are fully solid on paper
  - Captures the canvas as a PNG and opens it in a new tab
  - Triggers the browser print dialog automatically
  - The on-screen graph is restored to its normal dark-mode colours immediately after capture

---

### Deployment & Build Fixes

- **Deployment configuration fix** — Removed invalid `publicDir = "dist"` from `.replit` `[deployment]` block, which was causing autoscale health-check failures on every promote step.

- **TypeScript build fix** — Removed unused `FUTURE_LEGEND_ITEMS` declaration that was causing a `TS6133` error and blocking production builds.
