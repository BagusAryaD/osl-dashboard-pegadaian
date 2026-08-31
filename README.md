# Dashboard Monitoring OSL, NPL & LAR

Dashboard client-side untuk memantau Outstanding Savings & Loans (OSL), Non-Performing Loans (NPL), dan Loan at Risk (LAR) pada Pegadaian. Diproses sepenuhnya di browser — tidak ada data yang dikirim ke server manapun.

## Mulai Cepat

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

### Muat Data Demo

Klik tombol **"Muat Data Demo"** di halaman upload untuk langsung melihat dashboard tanpa perlu file upload. Data dummy mencakup 3 area (Jakarta Pusat, Utara, Selatan) dengan 12 produk simulasi.

### Generate Ulang Data Dummy

```bash
npm run generate-dummy
```

Menghasilkan 26 file Excel ke `data/dummy/` dan `src/data/dummy-data.js`. Berguna jika ingin menambah/mengubah master data (area, cabang, produk) di `scripts/generate-dummy.js`.

## Build & Deploy

```bash
npm run build
```

Output ada di folder `dist/`. Deploy ke Vercel/Netlify/GitHub Pages tanpa konfigurasi tambahan — framework Vite terdeteksi otomatis.

## Sumber Data

Semua field upload **opsional** — minimal 1 file sudah bisa membuat dashboard. Bagian yang ditampilkan menyesuaikan data yang diupload.

| # | Sumber | Tipe Upload | Format Nama File |
|---|--------|-------------|------------------|
| 1 | Omset | Multi (1 per bulan) | `dd-mm-yyyy.xlsx` |
| 2 | OSL Posisi | Multi (1 per bulan) | `dd-mm-yyyy.xlsx` |
| 3 | OSL AVG | Multi (1 per bulan) | `dd-mm-yyyy.xlsx` |
| 4 | LAR | Tunggal | Bebas |
| 5 | Nasabah Aktif | Tunggal | Bebas |

### Multi-upload (Omset / OSL Posisi / OSL AVG)

- Nama file **wajib** mengandung tanggal format `dd-mm-yyyy` (mis. `31-07-2026.xlsx`).
- Data terbaru (tanggal paling akhir) dipakai sebagai snapshot dashboard.
- Seluruh file dipakai untuk grafik tren antar bulan:
  - **OSL Posisi vs OSL AVG**: bar chart gabungan (posisi = bar, avg = garis).
  - **Tren Omset**: bar chart omset antar bulan.

### Kolom yang Diperlukan per Sumber Data

<details>
<summary><b>Omset</b></summary>

| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| AREA | Ya | Format `kode:nama` |
| CABANG | Ya | Format `kode:nama` |
| UNIT | Ya | Format `kode:nama` |
| GRUP PRODUK | - | Dipakai untuk derive segmen |
| SUB PRODUK | Ya | Nama produk |
| REALISASI BLN INI THNINI | Ya | Omset bulan ini |
| REALISASI BLN INI LALU | - | Untuk YoY |
| REALISASI SD BLN INI THNINI | - | Kumulatif tahun berjalan |
| REALISASI SD BLN INI LALU | - | Kumulatif tahun lalu |
| REALISASI BLN LALU THNINI | - | Untuk MTM |

</details>

<details>
<summary><b>OSL Posisi</b></summary>

| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| FLAG | - | KONVEN/SYARIAH (default: KONVEN) |
| AREA | Ya | Format `kode:nama` |
| CABANG | Ya | Format `kode:nama` |
| UNIT | Ya | Format `kode:nama` |
| GRUP PRODUK | - | Untuk derive segmen |
| SUB PRODUK | Ya | Nama produk |
| SEGMEN | - | GADAI/NON GADAI (EMAS di-derive dari grup) |
| KATEGORI OSL | Ya | AKTIF/BERMASALAH/BJDPL-MDPL/DPP |
| OSL BULAN INI THNINI | Ya | Nilai OSL bulan ini |
| OSL BULAN INI THNLALU | - | Untuk YoY |
| OSL AKHIR TAHUN THNLALU | - | Untuk YTD |
| OSL BULAN LALU THNINI | - | Untuk MTM |

</details>

<details>
<summary><b>OSL AVG</b></summary>

| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| FLAG | - | KONVEN/SYARIAH (default: KONVEN) |
| AREA | Ya | Format `kode:nama` |
| CABANG | Ya | Format `kode:nama` |
| UNIT | Ya | Format `kode:nama` |
| GRUP PRODUK | - | Untuk derive segmen |
| SUB PRODUK | Ya | Nama produk |
| SEGMEN | - | GADAI/NON GADAI (EMAS di-derive dari grup) |
| KATEGORI OSL | Ya | AKTIF/BERMASALAH/BJDPL-MDPL/DPP |
| OSLAVG BULAN INI THNINI | Ya | Nilai OSL rata-rata |

</details>

<details>
<summary><b>LAR (Loan at Risk)</b></summary>

| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| FLAG SY | - | KONVEN/SYARIAH |
| AREA | Ya | Format `kode:nama` |
| CABANG | Ya | Format `kode:nama` |
| OUTLET | Ya | Format `kode:nama` |
| GROUP PRODUK | - | GADAI/NON_GADAI |
| SUB PRODUCT NM | Ya | Nama produk (tanpa kode) |
| OSL LANCAR | - | Komponen kualitas |
| LANCAR LAR | - | Komponen kualitas |
| OSL DPK | - | Dalam Perhatian Khusus |
| OSL KL | - | Kurang Lancar |
| OSL DR | - | Diragukan |
| OSL MACET | - | Macet |
| OSL TOTAL | Ya | Total OSL (denominator NPL%) |
| OSL LAR | Ya | Total LAR |

NPL = OSL KL + OSL DR + OSL MACET
LAR = OSL Lancar LAR

</details>

<details>
<summary><b>Nasabah Aktif Pertahun</b></summary>

| Kolom | Wajib | Keterangan |
|-------|-------|------------|
| FLAG | - | KONVEN/SYARIAH (default: KONVEN) |
| AREA | Ya | Nama area (tanpa kode) |
| CABANG | Ya | Nama cabang (tanpa kode) |
| UNIT | Ya | Nama unit (tanpa kode) |
| GRUP PRODUK | Ya | Untuk derive segmen |
| PRODUK | - | Sub produk |
| CUST BULAN INI THNINI | Ya | Jumlah nasabah aktif |
| CUST AKHIR TAHUN LALU | - | Untuk YTD |
| CUST BULAN INI LALU | - | Untuk YoY |
| CUST BULAN LALU THNINI | - | Untuk MTM |

</details>

## Fitur Dashboard

### Filter
- **Area** → **Cabang** (dependent dropdown)
- **Konven / Syariah** (flag)
- **Segmen**: GADAI / NON GADAI / EMAS
- **Kategori OSL**: AKTIF / BERMASALAH / BJDPL-MDPL / DPP
- **Tampilkan Bagian**: toggle visibilitas per-section (Omset / OSL / NPL & LAR / Nasabah)

### KPI Cards
- **Omset**: Total bulan ini, kumulatif YTD, MTM, YoY, YoY kumulatif
- **OSL**: Total Posisi, Total AVG, MTM, YoY, YTD
- **NPL & LAR**: Nominal NPL, % NPL, Nominal LAR, % LAR
- **Nasabah**: Total aktif, MTM, YoY, YTD

### Panel Analitik
- Grafik tren OSL Posisi vs OSL AVG antar bulan
- Grafik tren Omset antar bulan
- Distribusi kategori OSL (donut chart)
- Komposisi segmen (per sumber data)
- Komposisi kualitas LAR (5 kategori)
- Top 5 Produk (per sumber data)
- Top & Bottom Growth Produk (toggle MTM/YoY/YTD)
- Tabel **rincian per cabang (konsolidasi)** — semua outlet dalam tiap cabang ditotalkan (join lintas sumber data)
- Tabel **rincian per outlet** (join lintas sumber data)
  - Kedua tabel punya baris TOTAL, dan saat filter Cabang dipilih, tabel cabang menampilkan cabang terpilih (1 baris) sementara tabel outlet menampilkan seluruh outlet pada cabang tersebut

### Export
- **Download HTML**: file standalone dengan CSS embedded
- **Cetak PDF**: WYSIWYG, A4 landscape, warna dipertahankan

## Tech Stack

- **React 19** + Vite
- **SheetJS (xlsx)** untuk parsing Excel client-side
- **Recharts** untuk visualisasi chart
- **OxLint** untuk linting
- Zero backend — semua proses di browser

## Struktur Projek

```
├── data/                    # Folder sumber data (upload manual)
│   ├── dummy/               # Data dummy hasil generate-dummy
│   ├── omset/               # File omset per bulan
│   ├── osl posisi/          # File OSL posisi per bulan
│   └── osl avg/             # File OSL avg per bulan
├── scripts/
│   └── generate-dummy.js    # Generator data dummy
├── src/
│   ├── components/          # Komponen React
│   ├── utils/               # Parser, aggregator, formatter, export
│   └── data/
│       └── dummy-data.js    # Data dummy (auto-generated)
├── public/
└── package.json
```
