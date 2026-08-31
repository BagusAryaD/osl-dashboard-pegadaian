import * as XLSX from 'xlsx';
import { toNumber, splitCodeName } from './format.js';

// Ambil tanggal dari nama file dengan format dd-mm-yyyy (mis. "15-07-2026.xlsx" atau
// "OSL Posisi 31-07-2026.csv"). Dipakai untuk fitur multi-upload (OSL Posisi/AVG/Omset)
// supaya tiap file bisa dikelompokkan per-bulan untuk grafik tren antar bulan.
// Return null kalau pola tanggal tidak ditemukan di nama file.
export function extractDateFromFilename(fileName) {
  const m = String(fileName || '').match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime()) || date.getMonth() !== month - 1) return null;
  return { date, label: `${dd}-${mm}-${yyyy}` };
}

// Sub produk (GRUP_PRODUK = EMAS / ARRUM EMAS di OSL Posisi) yang dianggap segmen "EMAS"
// meskipun kolom SEGMEN aslinya menulis "GADAI". Kode diambil dari daftar yang diberikan user.
const EMAS_SUBPRODUK_CODES = new Set([
  '0901', '1601', '2701', '2702', '2704', '2801', '3201', '3501', '3701', '3702', '3704', '3801', '4201', '6701',
]);

// Nama (tanpa kode) untuk matching di data LAR, karena SUB PRODUCT NM di file LAR tidak berkode.
// KOREKSI (revisi ke-4): "ARRUM EMAS BARU" dikeluarkan dari daftar ini (masuk GADAI, bukan EMAS)
// karena namanya berasal dari grup "ARRUM EMAS", bukan grup "EMAS" murni.
// CATATAN: file LAR tidak punya kolom grup produk terpisah (hanya GADAI/NON_GADAI), jadi daftar
// nama di bawah ini adalah asumsi berdasar penamaan produk (MULIA/EMASKU/Tabungan Emas = lini
// produk EMAS Pegadaian). Mohon dikonfirmasi/koreksi jika ada nama yang salah kelompok.
const EMAS_SUBPRODUK_NAMES = new Set([
  'MULIA LAMA', 'MULIA ULTIMATE SYARIAH', 'MULIA ULTIMATE SYARIAH PEGAWAI',
  'MULIA ULTIMATE SYARIAH ARISAN', 'EMASKU ULTIMATE SYARIAH', 'GADAI TABUNGAN EMAS', 'KRASIDA TABUNGAN EMAS',
  'MULIA ULTIMATE KONVEN', 'MULIA ULTIMATE KONVEN PEGAWAI', 'MULIA ULTIMATE KONVEN ARISAN', 'EMASKU ULTIMATE KONVEN',
  'GADAI TABUNGAN EMAS PRIMA', 'MULIA TABUNGAN EMAS',
]);

// KOREKSI (revisi ke-4): grup produk "ARRUM EMAS" masuk segmen GADAI, BUKAN EMAS.
// Hanya grup produk "EMAS" murni yang masuk segmen EMAS.
const GRUP_PRODUK_EMAS = new Set(['EMAS']);

// Segmen final: GADAI / NON GADAI / EMAS — dipakai OSL Posisi & OSL AVG.
// Aturan: segmen mentah GADAI + grupProduk masuk EMAS/ARRUM EMAS -> EMAS. Selain itu ikut segmen mentah.
function deriveSegmenOsl(segmenMentah, grupProduk) {
  const seg = String(segmenMentah || '').trim().toUpperCase();
  const grup = String(grupProduk || '').trim().toUpperCase();
  if (seg === 'GADAI' && GRUP_PRODUK_EMAS.has(grup)) return 'EMAS';
  return seg;
}

// Segmen final untuk data LAR: GADAI / NON_GADAI dari GROUP PRODUK, EMAS kalau SUB PRODUCT NM
// (tanpa kode, dicocokkan by nama) ada di daftar EMAS_SUBPRODUK_NAMES.
function deriveSegmenLar(groupProduk, subProductNm) {
  const grupRaw = String(groupProduk || '').trim().toUpperCase();
  const grup = grupRaw.replace(/_/g, ' ');
  const nama = String(subProductNm || '').trim().toUpperCase();
  if (grupRaw === 'GADAI' && EMAS_SUBPRODUK_NAMES.has(nama)) return 'EMAS';
  return grup;
}

// Data Omset tidak punya kolom SEGMEN maupun GRUP_PRODUK bernilai GADAI/NON GADAI langsung —
// segmen diturunkan langsung dari Grup Produk sesuai daftar yang diberikan user.
// KOREKSI (revisi ke-4): ARRUM EMAS masuk GADAI, bukan EMAS.
const OMSET_SEGMEN_GADAI = new Set(['ARRUM HAJI', 'ARRUM SAFAR', 'GADAI EFEK', 'KCA', 'KRASIDA', 'RAHN', 'ARRUM EMAS']);
const OMSET_SEGMEN_EMAS = new Set(['EMAS']);
const OMSET_SEGMEN_NON_GADAI = new Set([
  'AMANAH', 'ARRUM MIKRO', 'DIGITAL LENDING', 'KREASI', 'KRESNA', 'KUPEDES', 'RAHN TASJILY TANAH',
]);
function deriveSegmenOmset(grupProduk) {
  const g = String(grupProduk || '').trim().toUpperCase();
  if (OMSET_SEGMEN_GADAI.has(g)) return 'GADAI';
  if (OMSET_SEGMEN_EMAS.has(g)) return 'EMAS';
  if (OMSET_SEGMEN_NON_GADAI.has(g)) return 'NON GADAI';
  return g; // grup produk di luar daftar tetap ditampilkan apa adanya
}

// Data Omset tidak punya kolom flag Konven/Syariah — diturunkan dari kode Area
// (kode 007xx = Konvensional, 008xx = Syariah, sesuai pola yang diberikan user).
function deriveFlagFromAreaCode(areaCode) {
  const c = String(areaCode || '').trim();
  if (c.startsWith('007')) return 'KONVEN';
  if (c.startsWith('008')) return 'SYARIAH';
  return '';
}

// Data Nasabah: segmen diturunkan penuh dari GRUP PRODUK (bukan dari kolom SEGMEN PRODUK asli,
// yang sebagian datanya kosong) — ini otomatis juga menutup kasus baris dengan SEGMEN PRODUK blank.
const NASABAH_SEGMEN_GADAI = new Set([
  'ARRUM EMAS', 'ARRUM HAJI', 'ARRUM SAFAR', 'GADAI EFEK', 'KCA', 'KRASIDA', 'RAHN',
]);
const NASABAH_SEGMEN_EMAS = new Set(['EMAS']);
const NASABAH_SEGMEN_NON_GADAI = new Set([
  'AMANAH', 'ARRUM MIKRO', 'KREASI', 'KRESNA', 'KUPEDES', 'RAHN TASJILY TANAH', 'TABUNGAN EMAS',
]);
function deriveSegmenNasabah(grupProduk) {
  const g = String(grupProduk || '').trim().toUpperCase();
  if (NASABAH_SEGMEN_GADAI.has(g)) return 'GADAI';
  if (NASABAH_SEGMEN_EMAS.has(g)) return 'EMAS';
  if (NASABAH_SEGMEN_NON_GADAI.has(g)) return 'NON GADAI';
  return g;
}

// Ambil header row + data rows dari sheet pertama workbook.
// Header row dideteksi otomatis: baris pertama yang mengandung kolom "AREA" (case-insensitive) —
// supaya file dengan baris judul di atas (spt Omset, baris 1-4 cuma judul) tetap terbaca benar.
function sheetToRows(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  if (!raw.length) return { headers: [], rows: [] };
  let headerIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    const cells = raw[i].map((c) => (c === null ? '' : String(c).trim().toUpperCase()));
    if (cells.includes('AREA')) {
      headerIdx = i;
      break;
    }
  }
  const headers = raw[headerIdx].map((h) => (h === null ? '' : String(h).trim()));
  const rows = raw.slice(headerIdx + 1).filter((r) => r.some((c) => c !== null && c !== ''));
  return { headers, rows };
}

// Normalisasi nama kolom: uppercase, ganti spasi berulang & underscore jadi 1 spasi.
function normKey(h) {
  return String(h).trim().toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
}

function buildRecord(headers, row) {
  const rec = {};
  headers.forEach((h, i) => {
    rec[normKey(h)] = row[i];
  });
  return rec;
}

async function readWorkbook(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return sheetToRows(ws);
}

function requireCols(headers, required, label) {
  const normed = headers.map(normKey);
  const missing = required.filter((r) => !normed.includes(r));
  if (missing.length) {
    throw new Error(
      `File ${label}: kolom wajib tidak ditemukan → ${missing.join(', ')}. Pastikan file yang diupload benar.`
    );
  }
}

// ---------- OSL POSISI ----------
export async function parsePosisi(file) {
  const { headers, rows } = await readWorkbook(file);
  requireCols(
    headers,
    ['AREA', 'CABANG', 'UNIT', 'SUB PRODUK', 'KATEGORI OSL', 'OSL BULAN INI THNINI'],
    'OSL Posisi'
  );
  return rows.map((row) => {
    const rec = buildRecord(headers, row);
    const area = splitCodeName(rec['AREA']);
    const cabang = splitCodeName(rec['CABANG']);
    const unit = splitCodeName(rec['UNIT']);
    return {
      flag: rec['FLAG'] ? String(rec['FLAG']).trim().toUpperCase() : 'KONVEN',
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      unitCode: unit.code,
      unitName: unit.name,
      grupProduk: rec['GRUP PRODUK'] || '',
      subProduk: rec['SUB PRODUK'] || '',
      segmen: deriveSegmenOsl(rec['SEGMEN'], rec['GRUP PRODUK']),
      kategoriOsl: rec['KATEGORI OSL'] ? String(rec['KATEGORI OSL']).trim().toUpperCase() : '',
      oslBulanIniThnLalu: toNumber(rec['OSL BULAN INI THNLALU']),
      oslAkhirTahunThnLalu: toNumber(rec['OSL AKHIR TAHUN THNLALU']),
      oslBulanLaluThnIni: toNumber(rec['OSL BULAN LALU THNINI']),
      oslBulanIniThnIni: toNumber(rec['OSL BULAN INI THNINI']),
    };
  });
}

// ---------- OSL AVG ----------
export async function parseAvg(file) {
  const { headers, rows } = await readWorkbook(file);
  requireCols(
    headers,
    ['AREA', 'CABANG', 'UNIT', 'SUB PRODUK', 'KATEGORI OSL', 'OSLAVG BULAN INI THNINI'],
    'OSL AVG'
  );
  return rows.map((row) => {
    const rec = buildRecord(headers, row);
    const area = splitCodeName(rec['AREA']);
    const cabang = splitCodeName(rec['CABANG']);
    const unit = splitCodeName(rec['UNIT']);
    return {
      flag: rec['FLAG'] ? String(rec['FLAG']).trim().toUpperCase() : 'KONVEN',
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      unitCode: unit.code,
      unitName: unit.name,
      grupProduk: rec['GRUP PRODUK'] || '',
      subProduk: rec['SUB PRODUK'] || '',
      segmen: deriveSegmenOsl(rec['SEGMEN'], rec['GRUP PRODUK']),
      kategoriOsl: rec['KATEGORI OSL'] ? String(rec['KATEGORI OSL']).trim().toUpperCase() : '',
      oslAvgBulanIniThnIni: toNumber(rec['OSLAVG BULAN INI THNINI']),
    };
  });
}

// ---------- LAR (juga sumber NPL) ----------
export async function parseLar(file) {
  const { headers, rows } = await readWorkbook(file);
  requireCols(
    headers,
    ['AREA', 'CABANG', 'OUTLET', 'SUB PRODUCT NM', 'OSL TOTAL', 'OSL LAR'],
    'LAR'
  );
  return rows.map((row) => {
    const rec = buildRecord(headers, row);
    const area = splitCodeName(rec['AREA']);
    const cabang = splitCodeName(rec['CABANG']);
    const outlet = splitCodeName(rec['OUTLET']);
    const oslKl = toNumber(rec['OSL KL']) || 0;
    const oslDr = toNumber(rec['OSL DR']) || 0;
    const oslMacet = toNumber(rec['OSL MACET']) || 0;
    const oslLancar = toNumber(rec['OSL LANCAR']) || 0;
    const lancarLar = toNumber(rec['LANCAR LAR']) || 0;
    const oslDpk = toNumber(rec['OSL DPK']) || 0;
    return {
      flag: rec['FLAG SY'] ? String(rec['FLAG SY']).trim().toUpperCase() : 'KONVEN',
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      outletCode: outlet.code,
      outletName: outlet.name,
      groupProduk: rec['GROUP PRODUK'] || '',
      subProductNm: rec['SUB PRODUCT NM'] || '',
      segmen: deriveSegmenLar(rec['GROUP PRODUK'], rec['SUB PRODUCT NM']),
      oslLancar,
      lancarLar,
      oslDpk,
      oslKl,
      oslDr,
      oslMacet,
      nominalNpl: oslKl + oslDr + oslMacet,
      oslTotal: toNumber(rec['OSL TOTAL']) || 0,
      oslLar: toNumber(rec['OSL LAR']) || 0,
    };
  });
}

// ---------- OMSET ----------
export async function parseOmset(file) {
  const { headers, rows } = await readWorkbook(file);
  requireCols(
    headers,
    ['AREA', 'CABANG', 'UNIT', 'SUB PRODUK', 'REALISASI BLN INI THNINI'],
    'Omset'
  );
  return rows.map((row) => {
    const rec = buildRecord(headers, row);
    const area = splitCodeName(rec['AREA']);
    const cabang = splitCodeName(rec['CABANG']);
    const unit = splitCodeName(rec['UNIT']);
    return {
      flag: deriveFlagFromAreaCode(area.code),
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      unitCode: unit.code,
      unitName: unit.name,
      grupProduk: rec['GRUP PRODUK'] || '',
      subProduk: rec['SUB PRODUK'] || '',
      segmen: deriveSegmenOmset(rec['GRUP PRODUK']),
      realisasiBlnIniLalu: toNumber(rec['REALISASI BLN INI LALU']),
      realisasiSdBlnIniLalu: toNumber(rec['REALISASI SD BLN INI LALU']),
      realisasiBlnLaluThnIni: toNumber(rec['REALISASI BLN LALU THNINI']),
      realisasiBlnIniThnIni: toNumber(rec['REALISASI BLN INI THNINI']),
      realisasiSdBlnIniThnIni: toNumber(rec['REALISASI SD BLN INI THNINI']),
    };
  });
}

// ---------- NASABAH AKTIF PERTAHUN ----------
export async function parseNasabah(file) {
  const { headers, rows } = await readWorkbook(file);
  requireCols(
    headers,
    ['AREA', 'CABANG', 'UNIT', 'GRUP PRODUK', 'CUST BULAN INI THNINI'],
    'Nasabah'
  );
  return rows.map((row) => {
    const rec = buildRecord(headers, row);
    // Kolom AREA di file ini tidak berkode (cuma "AREA KALIDERES"), splitCodeName tetap aman.
    const area = splitCodeName(rec['AREA']);
    const cabang = splitCodeName(rec['CABANG']);
    const unit = splitCodeName(rec['UNIT']);
    const produk = splitCodeName(rec['PRODUK']);
    return {
      flag: rec['FLAG'] ? String(rec['FLAG']).trim().toUpperCase() : 'KONVEN',
      areaCode: area.code,
      areaName: area.name,
      cabangCode: cabang.code,
      cabangName: cabang.name,
      unitCode: unit.code,
      unitName: unit.name,
      grupProduk: rec['GRUP PRODUK'] || '',
      subProduk: produk.name || rec['PRODUK'] || '',
      segmen: deriveSegmenNasabah(rec['GRUP PRODUK']),
      custAkhirTahunLalu: toNumber(rec['CUST AKHIR TAHUN LALU']),
      custBulanIniLalu: toNumber(rec['CUST BULAN INI LALU']),
      custBulanLaluThnIni: toNumber(rec['CUST BULAN LALU THNINI']),
      custBulanIniThnIni: toNumber(rec['CUST BULAN INI THNINI']),
    };
  });
}
