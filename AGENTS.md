# AGENTS.md

Client-side React 19 + Vite dashboard (OSL/NPL/LAR) for Pegadaian. Zero backend; all parsing/aggregation runs in the browser. Comments are in Indonesian.

## Commands

```bash
npm install
npm run dev        # Vite dev server on :5173
npm run build      # output in dist/
npm run preview    # serve the built dist/
npm run generate-dummy   # regenerate dummy data + dummy-data.js
npx oxlint src     # focused lint (see Lint pitfall)
```

- **Lint pitfall:** `npm run lint` = `oxlint` with no config file, so it scans `node_modules/` and floods output with react-dom warnings that are NOT your code. Use `npx oxlint src` to check only the app.
- No test framework. Verify via `npm run build` (catches syntax/import errors) and manual check in `npm run dev`.
- Full upload column requirements are documented in `README.md` — check there before touching `parser.js`.

## Codegen — do NOT hand-edit

- `src/data/dummy-data.js` is generated. Change master data (areas/cabangs/products) in `scripts/generate-dummy.js`, then run `npm run generate-dummy`. It also rewrites `data/dummy/*.xlsx`.
- `data/` holds sample upload files; it is not used by the app at runtime (uploads are via the browser Dropzone). "Muat Data Demo" button (`UploadManager.jsx`) calls `getDummyData()` directly.

## Architecture

- **Entry:** `index.html` → `src/main.jsx` → `src/App.jsx` (upload gate) → `src/components/Dashboard.jsx` (main layout, all filters/sections).
- **Parsing** (`src/utils/parser.js`): one `parse*` per file type (Posisi, Avg, Lar, Omset, Nasabah). Normalizes AREA/CABANG/UNIT/OUTLET `kode:nama` via `splitCodeName`.
- **Aggregation** (`src/utils/aggregate.js`): pure functions — KPI, distributions, trends, top-N, and the outlet/cabang tables.
- **Print/export** (`src/utils/exportUtils.js`): imports `styles.css` via `?raw` and inlines it into the downloaded `.html`. Any change to `styles.css` automatically affects the "Download HTML" output — keep print rules in `@media print` there.

### Segment derivation is subtle (parser.js)

Segmen final = `GADAI` / `NON GADAI` / `EMAS`, derived separately per source with special-cased product lists (e.g. `ARRUM EMAS` → GADAI, not EMAS; LAR matches EMAS by product *name* without codes; Omset derives Konven/Syariah flag from area code `007xx`/`008xx`). There are documented "revisi ke-N" corrections in the comments — read them before changing segment logic, as the four sources use slightly different rules.

## Dashboard conventions

- Section visibility is toggled via `visibleSections` (Set of `omset|osl|nplLar|nasabah`); columns/panels hide accordingly.
- **Outlet table** (`computeOutletTable`) and **cabang table** (`computeCabangTable`) both wrap the generic `computeAggregatedTable` in `aggregate.js`, differing only in the key/name extractors (unit vs cabang code). Cabang table consolidates all outlets per cabang; when a cabang filter is set it shows 1 row.
- `OutletTable.jsx` is reused for both tables; the first column label comes from the `nameColumnLabel` prop.
- Kategori OSL labels are normalized with `normKategori` (BJDPL-MDPL/BJDPL_MDPL → `BJDPL/MDPL`) — use it when comparing/matching kategori.
- Bump the version string in the footer of `Dashboard.jsx` (currently `v1.4`) when shipping a notable change. It is not auto-derived.

## Print gotchas

- Multi-page printing relies on `#dash-print-area { position: static !important; }` in `@media print` — do not revert to `position: absolute` (that clips rows after page 1).
- Table panels carry `.dash-panel-table` (rows may break across pages, header repeats) and `.print-section-start` (force start on a new page).
