/**
 * scripts/generate-dummy.js
 *
 * Menghasilkan file Excel dummy ke data/dummy/ DAN src/data/dummy-data.js
 * untuk keperluan demo dashboard OSL, NPL & LAR.
 *
 * Jalankan: node scripts/generate-dummy.js
 */
import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DUMMY_DIR = join(ROOT, 'data', 'dummy');
const SRC_DATA_DIR = join(ROOT, 'src', 'data');

mkdirSync(DUMMY_DIR, { recursive: true });
mkdirSync(SRC_DATA_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

// ── Master Data ──────────────────────────────────────────────────────────────

const MONTHS = [
  { label: '31-01-2026', dd: 31, mm: 1, yyyy: 2026, monthIdx: 0 },
  { label: '28-02-2026', dd: 28, mm: 2, yyyy: 2026, monthIdx: 1 },
  { label: '31-03-2026', dd: 31, mm: 3, yyyy: 2026, monthIdx: 2 },
  { label: '30-04-2026', dd: 30, mm: 4, yyyy: 2026, monthIdx: 3 },
  { label: '31-05-2026', dd: 31, mm: 5, yyyy: 2026, monthIdx: 4 },
  { label: '30-06-2026', dd: 30, mm: 6, yyyy: 2026, monthIdx: 5 },
  { label: '31-07-2026', dd: 31, mm: 7, yyyy: 2026, monthIdx: 6 },
  { label: '09-08-2026', dd: 9, mm: 8, yyyy: 2026, monthIdx: 7 },
];

const AREAS = [
  { code: '00701', name: 'JAKARTA PUSAT' },
  { code: '00702', name: 'JAKARTA UTARA' },
  { code: '00703', name: 'JAKARTA SELATAN' },
  { code: '00801', name: 'JAKARTA PUSAT' },
  { code: '00802', name: 'JAKARTA UTARA' },
  { code: '00803', name: 'JAKARTA SELATAN' },
];

function flag(areaCode) {
  return String(areaCode).startsWith('007') ? 'KONVEN' : 'SYARIAH';
}

const CABANG_MAP = {
  '00701': [
    { code: '0070101', name: 'CABANG MENTENG' },
    { code: '0070102', name: 'CABANG TANAH ABANG' },
  ],
  '00702': [
    { code: '0070201', name: 'CABANG KELAPA GADING' },
    { code: '0070202', name: 'CABANG KOJA' },
  ],
  '00703': [
    { code: '0070301', name: 'CABANG KEBAYORAN BARU' },
  ],
  '00801': [
    { code: '0080101', name: 'CABANG MENTENG' },
  ],
  '00802': [
    { code: '0080201', name: 'CABANG KELAPA GADING' },
  ],
  '00803': [
    { code: '0080301', name: 'CABANG KEBAYORAN BARU' },
  ],
};

const UNIT_MAP = {
  '0070101': [{ code: '007010101', name: 'UNIT MENTENG PUSAT' }],
  '0070102': [{ code: '007010201', name: 'UNIT TANAH ABANG' }],
  '0070201': [{ code: '007020101', name: 'UNIT KELAPA GADING' }],
  '0070202': [{ code: '007020201', name: 'UNIT KOJA' }],
  '0070301': [{ code: '007030101', name: 'UNIT KEBAYORAN' }],
  '0080101': [{ code: '008010101', name: 'UNIT MENTENG' }],
  '0080201': [{ code: '008020101', name: 'UNIT KELAPA GADING' }],
  '0080301': [{ code: '008030101', name: 'UNIT KEBAYORAN' }],
};

const PRODUK = [
  { grup: 'KCA', sub: 'KCA BIASA', segmen: 'GADAI', oslBase: 850, avgF: 0.97, omsetBase: 320, custBase: 1200, nplR: 0.018, larR: 0.028 },
  { grup: 'KCA', sub: 'KCA PREMIUM', segmen: 'GADAI', oslBase: 1200, avgF: 0.96, omsetBase: 480, custBase: 800, nplR: 0.012, larR: 0.022 },
  { grup: 'KRASIDA', sub: 'KRASIDA', segmen: 'GADAI', oslBase: 420, avgF: 0.98, omsetBase: 150, custBase: 600, nplR: 0.025, larR: 0.035 },
  { grup: 'RAHN', sub: 'RAHN', segmen: 'GADAI', oslBase: 380, avgF: 0.97, omsetBase: 130, custBase: 500, nplR: 0.022, larR: 0.032 },
  { grup: 'ARRUM EMAS', sub: 'ARRUM EMAS', segmen: 'GADAI', oslBase: 550, avgF: 0.96, omsetBase: 200, custBase: 700, nplR: 0.020, larR: 0.030 },
  { grup: 'GADAI EFEK', sub: 'GADAI EFEK', segmen: 'GADAI', oslBase: 200, avgF: 0.98, omsetBase: 75, custBase: 150, nplR: 0.015, larR: 0.025 },
  { grup: 'EMAS', sub: 'MULIA LAMA', segmen: 'EMAS', oslBase: 600, avgF: 0.97, omsetBase: 250, custBase: 900, nplR: 0.008, larR: 0.015 },
  { grup: 'EMAS', sub: 'EMASKU ULTIMATE', segmen: 'EMAS', oslBase: 450, avgF: 0.96, omsetBase: 180, custBase: 650, nplR: 0.010, larR: 0.018 },
  { grup: 'EMAS', sub: 'TABUNGAN EMAS', segmen: 'EMAS', oslBase: 350, avgF: 0.98, omsetBase: 140, custBase: 1100, nplR: 0.005, larR: 0.010 },
  { grup: 'AMANAH', sub: 'AMANAH', segmen: 'NON GADAI', oslBase: 500, avgF: 0.97, omsetBase: 190, custBase: 600, nplR: 0.030, larR: 0.042 },
  { grup: 'KREASI', sub: 'KREASI', segmen: 'NON GADAI', oslBase: 320, avgF: 0.96, omsetBase: 120, custBase: 400, nplR: 0.035, larR: 0.048 },
  { grup: 'KUPEDES', sub: 'KUPEDES', segmen: 'NON GADAI', oslBase: 400, avgF: 0.98, omsetBase: 150, custBase: 500, nplR: 0.028, larR: 0.040 },
];

const KATEGORI = ['AKTIF', 'BERMASALAH', 'BJDPL/MDPL', 'DPP'];

// ── Build outlet list ────────────────────────────────────────────────────────

const OUTLETS = [];
for (const area of AREAS) {
  for (const cab of CABANG_MAP[area.code] || []) {
    for (const unit of UNIT_MAP[cab.code] || []) {
      OUTLETS.push({ area, cabang: cab, unit });
    }
  }
}

// ── Helpers for value generation ─────────────────────────────────────────────

function monthMul(monthIdx) {
  const growth = 1 + monthIdx * 0.005;
  const noise = 1 + (mulberry32(hashStr('t' + monthIdx))() - 0.5) * 0.08;
  return growth * noise;
}

function syariahScale(areaCode) {
  return String(areaCode).startsWith('008') ? 0.55 : 1;
}

function unitNoise(seed) {
  return 0.88 + mulberry32(seed)() * 0.24;
}

function breakdownOsl(total, seed) {
  const rng = mulberry32(seed);
  const a = 0.82 + rng() * 0.06;
  const b = 0.06 + rng() * 0.04;
  const c = 0.04 + rng() * 0.02;
  const d = Math.max(0.01, 1 - a - b - c);
  const s = a + b + c + d;
  return {
    AKTIF: Math.round(total * a / s),
    BERMASALAH: Math.round(total * b / s),
    'BJDPL/MDPL': Math.round(total * c / s),
    DPP: Math.round(total - Math.round(total * a / s) - Math.round(total * b / s) - Math.round(total * c / s)),
  };
}

function breakdownLar(oslTotal, nplRatio, larRatio, seed) {
  const rng = mulberry32(seed);
  const nn = Math.round(oslTotal * nplRatio);
  const ol = Math.round(oslTotal * larRatio);
  const dp = Math.round(nn * (0.35 + rng() * 0.15));
  const kl = Math.round(nn * (0.25 + rng() * 0.1));
  const dr = Math.round(nn * (0.15 + rng() * 0.1));
  const mc = nn - dp - kl - dr;
  const lc = Math.round(ol * (0.75 + rng() * 0.1));
  return { oslLancar: lc, lancarLar: ol - lc, oslDpk: dp, oslKl: kl, oslDr: dr, oslMacet: mc };
}

// ── Generate raw data for all outlet × product × month ───────────────────────

function genAll() {
  const rows = [];
  for (const o of OUTLETS) {
    for (let pi = 0; pi < PRODUK.length; pi++) {
      const p = PRODUK[pi];
      const baseSeed = hashStr(`${o.area.code}-${o.unit.code}-${pi}`);
      const scale = syariahScale(o.area.code);

      for (const m of MONTHS) {
        const mm = monthMul(m.monthIdx);
        const n = unitNoise(baseSeed + m.monthIdx * 997);
        const osl = Math.round(p.oslBase * mm * scale * n);
        const om = Math.round(p.omsetBase * mm * scale * n);
        const cu = Math.round(p.custBase * mm * scale * n);

        const rng2 = mulberry32(baseSeed + m.monthIdx * 500 + 7);
        const yoyF = 0.93 + rng2() * 0.04;
        const ytdF = 0.88 + rng2() * 0.06;
        const mtmF = 0.96 + rng2() * 0.06;
        const cumRatio = 0.12;

        rows.push({
          a: o.area, c: o.cabang, u: o.unit, p, m,
          osl, oslYoy: Math.round(osl * yoyF), oslYtd: Math.round(osl * ytdF), oslMtm: Math.round(osl * mtmF),
          om, omYoy: Math.round(om * yoyF), omMtm: Math.round(om * mtmF),
          omSd: Math.round(om * (m.monthIdx * cumRatio + 1)),
          omSdYoy: Math.round(om * yoyF * (m.monthIdx * cumRatio + 1)),
          cu, cuYoy: Math.round(cu * yoyF), cuYtd: Math.round(cu * ytdF), cuMtm: Math.round(cu * mtmF),
        });
      }
    }
  }
  return rows;
}

// ── Write Excel files ────────────────────────────────────────────────────────

function writeExcel(all) {
  for (const m of MONTHS) {
    const rows = all.filter((r) => r.m.label === m.label);

    // OSL POSISI
    const posisiData = [['FLAG', 'AREA', 'CABANG', 'UNIT', 'GRUP PRODUK', 'SUB PRODUK', 'SEGMEN', 'KATEGORI OSL',
      'OSL BULAN INI THNINI', 'OSL BULAN INI THNLALU', 'OSL AKHIR TAHUN THNLALU', 'OSL BULAN LALU THNINI']];
    for (const r of rows) {
      const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${m.label}`));
      const total = r.osl;
      for (const k of KATEGORI) {
        const v = bd[k]; if (v === 0) continue;
        const ratio = v / total;
        posisiData.push([
          flag(r.a.code), `${r.a.code}:${r.a.name}`, `${r.c.code}:${r.c.name}`, `${r.u.code}:${r.u.name}`,
          r.p.grup, r.p.sub, r.p.segmen, k,
          v, Math.round(r.oslYoy * ratio), Math.round(r.oslYtd * ratio), Math.round(r.oslMtm * ratio),
        ]);
      }
    }
    writeSheet(posisiData, `${m.label}.xlsx`);

    // OSL AVG
    const avgData = [['FLAG', 'AREA', 'CABANG', 'UNIT', 'GRUP PRODUK', 'SUB PRODUK', 'SEGMEN', 'KATEGORI OSL',
      'OSLAVG BULAN INI THNINI']];
    for (const r of rows) {
      const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${m.label}`));
      for (const k of KATEGORI) {
        const v = bd[k]; if (v === 0) continue;
        avgData.push([
          flag(r.a.code), `${r.a.code}:${r.a.name}`, `${r.c.code}:${r.c.name}`, `${r.u.code}:${r.u.name}`,
          r.p.grup, r.p.sub, r.p.segmen, k, Math.round(v * r.p.avgF),
        ]);
      }
    }
    writeSheet(avgData, `${m.label}.xlsx`);

    // OMSET
    const omsetData = [['AREA', 'CABANG', 'UNIT', 'GRUP PRODUK', 'SUB PRODUK',
      'REALISASI BLN INI THNINI', 'REALISASI BLN INI LALU', 'REALISASI SD BLN INI THNINI',
      'REALISASI SD BLN INI LALU', 'REALISASI BLN LALU THNINI']];
    for (const r of rows) {
      omsetData.push([
        `${r.a.code}:${r.a.name}`, `${r.c.code}:${r.c.name}`, `${r.u.code}:${r.u.name}`,
        r.p.grup, r.p.sub, r.om, r.omYoy, r.omSd, r.omSdYoy, r.omMtm,
      ]);
    }
    writeSheet(omsetData, `${m.label}.xlsx`);
  }

  // LAR
  const latest = all.filter((r) => r.m.label === MONTHS[MONTHS.length - 1].label);
  const larData = [['FLAG SY', 'AREA', 'CABANG', 'OUTLET', 'GROUP PRODUK', 'SUB PRODUCT NM',
    'OSL LANCAR', 'LANCAR LAR', 'OSL DPK', 'OSL KL', 'OSL DR', 'OSL MACET', 'OSL TOTAL', 'OSL LAR']];
  for (const r of latest) {
    const nplR = r.p.nplR * (0.85 + mulberry32(hashStr(r.p.sub))() * 0.3);
    const larR = r.p.larR * (0.85 + mulberry32(hashStr(r.p.sub + 'x'))() * 0.3);
    const bd = breakdownLar(r.osl, nplR, larR, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-lar`));
    larData.push([
      flag(r.a.code), `${r.a.code}:${r.a.name}`, `${r.c.code}:${r.c.name}`, `${r.u.code}:${r.u.name}`,
      r.p.segmen === 'GADAI' ? 'GADAI' : 'NON_GADAI', r.p.sub,
      bd.oslLancar, bd.lancarLar, bd.oslDpk, bd.oslKl, bd.oslDr, bd.oslMacet, r.osl, r.osl,
    ]);
  }
  const lm = MONTHS[MONTHS.length - 1];
  writeSheet(larData, `${lm.yyyy}-${pad(lm.mm)}-${pad(lm.dd)} Detail Laporan LOAN AT RISK PRODUK.xlsx`);

  // NASABAH
  const nasData = [['FLAG', 'AREA', 'CABANG', 'UNIT', 'GRUP PRODUK', 'PRODUK',
    'CUST BULAN INI THNINI', 'CUST AKHIR TAHUN LALU', 'CUST BULAN INI LALU', 'CUST BULAN LALU THNINI']];
  for (const r of latest) {
    nasData.push([
      flag(r.a.code), `${r.a.code}:${r.a.name}`, `${r.c.code}:${r.c.name}`, `${r.u.code}:${r.u.name}`,
      r.p.grup, r.p.sub, r.cu, r.cuYtd, r.cuYoy, r.cuMtm,
    ]);
  }
  writeSheet(nasData, `${lm.yyyy}-${pad(lm.mm)}-${pad(lm.dd)} Nasabah Aktif Pertahun All.xlsx`);
}

function writeSheet(data, fname) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, join(DUMMY_DIR, fname));
}

function pad(n) { return String(n).padStart(2, '0'); }

// ── Build dummy-data.js ──────────────────────────────────────────────────────

function buildDummyJs(all) {
  const lm = MONTHS[MONTHS.length - 1];
  const latest = all.filter((r) => r.m.label === lm.label);

  // ── posisi (latest) ──
  const posisi = [];
  for (const r of latest) {
    const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${lm.label}`));
    const total = r.osl;
    for (const k of KATEGORI) {
      const v = bd[k]; if (v === 0) continue;
      const ratio = v / total;
      posisi.push({
        flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name,
        cabangCode: r.c.code, cabangName: r.c.name, unitCode: r.u.code, unitName: r.u.name,
        grupProduk: r.p.grup, subProduk: r.p.sub, segmen: r.p.segmen, kategoriOsl: k,
        oslBulanIniThnIni: v,
        oslBulanIniThnLalu: Math.round(r.oslYoy * ratio),
        oslAkhirTahunThnLalu: Math.round(r.oslYtd * ratio),
        oslBulanLaluThnIni: Math.round(r.oslMtm * ratio),
      });
    }
  }

  // ── avg (latest) ──
  const avg = [];
  for (const r of latest) {
    const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${lm.label}`));
    for (const k of KATEGORI) {
      const v = bd[k]; if (v === 0) continue;
      avg.push({
        flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name,
        cabangCode: r.c.code, cabangName: r.c.name, unitCode: r.u.code, unitName: r.u.name,
        grupProduk: r.p.grup, subProduk: r.p.sub, segmen: r.p.segmen, kategoriOsl: k,
        oslAvgBulanIniThnIni: Math.round(v * r.p.avgF),
      });
    }
  }

  // ── omset (latest) ──
  const omset = latest.map((r) => ({
    flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name,
    cabangCode: r.c.code, cabangName: r.c.name, unitCode: r.u.code, unitName: r.u.name,
    grupProduk: r.p.grup, subProduk: r.p.sub, segmen: r.p.segmen,
    realisasiBlnIniThnIni: r.om, realisasiBlnIniLalu: r.omYoy,
    realisasiSdBlnIniThnIni: r.omSd, realisasiSdBlnIniLalu: r.omSdYoy,
    realisasiBlnLaluThnIni: r.omMtm,
  }));

  // ── lar (latest) ──
  const lar = latest.map((r) => {
    const nplR = r.p.nplR * (0.85 + mulberry32(hashStr(r.p.sub))() * 0.3);
    const larR = r.p.larR * (0.85 + mulberry32(hashStr(r.p.sub + 'x'))() * 0.3);
    const bd = breakdownLar(r.osl, nplR, larR, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-lar`));
    return {
      flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name,
      cabangCode: r.c.code, cabangName: r.c.name, outletCode: r.u.code, outletName: r.u.name,
      groupProduk: r.p.segmen === 'GADAI' ? 'GADAI' : 'NON_GADAI', subProductNm: r.p.sub,
      segmen: r.p.segmen,
      oslLancar: bd.oslLancar, lancarLar: bd.lancarLar, oslDpk: bd.oslDpk,
      oslKl: bd.oslKl, oslDr: bd.oslDr, oslMacet: bd.oslMacet,
      nominalNpl: bd.oslKl + bd.oslDr + bd.oslMacet,
      oslTotal: r.osl, oslLar: bd.oslLancar + bd.lancarLar,
    };
  });

  // ── nasabah (latest) ──
  const nasabah = latest.map((r) => ({
    flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name,
    cabangCode: r.c.code, cabangName: r.c.name, unitCode: r.u.code, unitName: r.u.name,
    grupProduk: r.p.grup, subProduk: r.p.sub, segmen: r.p.segmen,
    custBulanIniThnIni: r.cu, custAkhirTahunLalu: r.cuYtd,
    custBulanIniLalu: r.cuYoy, custBulanLaluThnIni: r.cuMtm,
  }));

  // ── Trends (aggregated per area×segmen×kategori per month for compact size) ──
  const posisiTrend = MONTHS.map((m) => {
    const mRows = all.filter((r) => r.m.label === m.label);
    const map = new Map();
    for (const r of mRows) {
      const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${m.label}`));
      for (const k of KATEGORI) {
        const v = bd[k]; if (v === 0) continue;
        const key = `${r.a.code}|${r.a.name}|${r.p.segmen}|${k}`;
        if (!map.has(key)) map.set(key, { flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name, segmen: r.p.segmen, kategoriOsl: k, v: 0 });
        const e = map.get(key);
        e.v += v;
      }
    }
    return {
      label: m.label,
      date: new Date(m.yyyy, m.mm - 1, m.dd),
      rows: Array.from(map.values()).map((e) => ({
        flag: e.flag, areaCode: e.areaCode, areaName: e.areaName,
        cabangCode: '', cabangName: '', unitCode: '', unitName: '',
        grupProduk: '', subProduk: '', segmen: e.segmen, kategoriOsl: e.kategoriOsl,
        oslBulanIniThnIni: e.v,
      })),
    };
  });

  const avgTrend = MONTHS.map((m) => {
    const mRows = all.filter((r) => r.m.label === m.label);
    const map = new Map();
    for (const r of mRows) {
      const bd = breakdownOsl(r.osl, hashStr(`${r.a.code}-${r.u.code}-${r.p.sub}-${m.label}`));
      for (const k of KATEGORI) {
        const v = bd[k]; if (v === 0) continue;
        const key = `${r.a.code}|${r.a.name}|${r.p.segmen}|${k}`;
        if (!map.has(key)) map.set(key, { flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name, segmen: r.p.segmen, kategoriOsl: k, v: 0 });
        map.get(key).v += Math.round(v * r.p.avgF);
      }
    }
    return {
      label: m.label,
      date: new Date(m.yyyy, m.mm - 1, m.dd),
      rows: Array.from(map.values()).map((e) => ({
        flag: e.flag, areaCode: e.areaCode, areaName: e.areaName,
        cabangCode: '', cabangName: '', unitCode: '', unitName: '',
        grupProduk: '', subProduk: '', segmen: e.segmen, kategoriOsl: e.kategoriOsl,
        oslAvgBulanIniThnIni: e.v,
      })),
    };
  });

  const omsetTrend = MONTHS.map((m) => {
    const mRows = all.filter((r) => r.m.label === m.label);
    const map = new Map();
    for (const r of mRows) {
      const key = `${r.a.code}|${r.a.name}|${r.p.segmen}`;
      if (!map.has(key)) map.set(key, { flag: flag(r.a.code), areaCode: r.a.code, areaName: r.a.name, segmen: r.p.segmen, v: 0 });
      map.get(key).v += r.om;
    }
    return {
      label: m.label,
      date: new Date(m.yyyy, m.mm - 1, m.dd),
      rows: Array.from(map.values()).map((e) => ({
        flag: e.flag, areaCode: e.areaCode, areaName: e.areaName,
        cabangCode: '', cabangName: '', unitCode: '', unitName: '',
        grupProduk: '', subProduk: '', segmen: e.segmen,
        realisasiBlnIniThnIni: e.v,
      })),
    };
  });

  const dateReplacer = (_k, v) => (v instanceof Date ? v.toISOString() : v);

  const js = `// Auto-generated oleh scripts/generate-dummy.js — JANGAN EDIT MANUAL
// Data dummy untuk demo dashboard OSL, NPL & LAR.

export const DUMMY_POSISI = ${JSON.stringify(posisi)};

export const DUMMY_AVG = ${JSON.stringify(avg)};

export const DUMMY_OMSET = ${JSON.stringify(omset)};

export const DUMMY_LAR = ${JSON.stringify(lar)};

export const DUMMY_NASABAH = ${JSON.stringify(nasabah)};

export const DUMMY_POSISI_TREND = ${JSON.stringify(posisiTrend, dateReplacer)};

export const DUMMY_AVG_TREND = ${JSON.stringify(avgTrend, dateReplacer)};

export const DUMMY_OMSET_TREND = ${JSON.stringify(omsetTrend, dateReplacer)};

export function getDummyData() {
  return {
    posisi: DUMMY_POSISI,
    avg: DUMMY_AVG,
    omset: DUMMY_OMSET,
    lar: DUMMY_LAR,
    nasabah: DUMMY_NASABAH,
    posisiTrend: DUMMY_POSISI_TREND.map((t) => ({ ...t, date: new Date(t.date) })),
    avgTrend: DUMMY_AVG_TREND.map((t) => ({ ...t, date: new Date(t.date) })),
    omsetTrend: DUMMY_OMSET_TREND.map((t) => ({ ...t, date: new Date(t.date) })),
  };
}
`;

  writeFileSync(join(SRC_DATA_DIR, 'dummy-data.js'), js, 'utf-8');
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Menghasilkan data dummy...');
const all = genAll();
console.log(`  ${OUTLETS.length} outlet × ${PRODUK.length} produk × ${MONTHS.length} bulan = ${all.length} data points`);

console.log('Membuat file Excel...');
writeExcel(all);
console.log(`  ✓ 26 file Excel ditulis ke data/dummy/`);

console.log('Membuat src/data/dummy-data.js...');
buildDummyJs(all);
const { statSync } = await import('fs');
const fsize = statSync(join(SRC_DATA_DIR, 'dummy-data.js')).size;
console.log(`  ✓ dummy-data.js ditulis (${(fsize / 1024).toFixed(0)} KB)`);

console.log('\nSelesai!');
