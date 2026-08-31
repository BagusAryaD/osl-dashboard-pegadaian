import { safeGrowth } from './format.js';

export const KATEGORI_ORDER = ['AKTIF', 'BERMASALAH', 'BJDPL/MDPL', 'DPP'];
export const SEGMEN_ORDER = ['GADAI', 'NON GADAI', 'EMAS'];

// Normalisasi label kategori OSL supaya varian penulisan (BJDPL-MDPL / BJDPL_MDPL / dst) tetap ketemu.
export function normKategori(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s.includes('BJDPL') || s.includes('MDPL')) return 'BJDPL/MDPL';
  return s;
}

export function uniqueSorted(values) {
  return Array.from(new Set(values.filter((v) => v !== '' && v !== null && v !== undefined))).sort((a, b) =>
    a.localeCompare(b, 'id')
  );
}

// ---------- Opsi filter dependent ----------
// Area digabung berdasarkan NAMA (bukan kode) — karena 1 nama area punya 2 kode berbeda
// (satu untuk cabang/outlet konvensional, satu untuk syariah).
export function buildAreaOptions(posisiRows) {
  const set = new Set();
  posisiRows.forEach((r) => {
    if (r.areaName) set.add(r.areaName);
  });
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b, 'id'))
    .map((name) => ({ name }));
}

// Cabang tergantung Area (by nama) DAN flag Konven/Syariah yang aktif — supaya tidak muncul
// cabang syariah saat filter Konven aktif (atau sebaliknya), yang datanya pasti nol.
export function buildCabangOptions(posisiRows, areaName, flag) {
  const map = new Map();
  posisiRows.forEach((r) => {
    if (areaName && r.areaName !== areaName) return;
    if (flag && r.flag !== flag) return;
    if (!r.cabangCode) return;
    if (!map.has(r.cabangCode)) map.set(r.cabangCode, r.cabangName);
  });
  return Array.from(map.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

// ---------- Filter generik ----------
export function applyLocationFlagFilter(rows, filters) {
  const { areaName, cabangCode, flag } = filters;
  return rows.filter((r) => {
    if (areaName && r.areaName !== areaName) return false;
    if (cabangCode && r.cabangCode !== cabangCode) return false;
    if (flag && r.flag !== flag) return false;
    return true;
  });
}

export function applyKategoriFilter(rows, kategoriOsl) {
  if (!kategoriOsl) return rows;
  return rows.filter((r) => normKategori(r.kategoriOsl) === kategoriOsl);
}

export function applySegmenFilter(rows, segmen) {
  if (!segmen) return rows;
  return rows.filter((r) => r.segmen === segmen);
}

// ---------- Sum helper ----------
function sum(rows, key) {
  return rows.reduce((acc, r) => acc + (r[key] || 0), 0);
}

// ---------- KPI OSL (Posisi) ----------
export function computeOslKpi(posisiRowsFiltered) {
  const thnIni = sum(posisiRowsFiltered, 'oslBulanIniThnIni');
  const bulanLalu = sum(posisiRowsFiltered, 'oslBulanLaluThnIni');
  const thnLalu = sum(posisiRowsFiltered, 'oslBulanIniThnLalu');
  const akhirTahunLalu = sum(posisiRowsFiltered, 'oslAkhirTahunThnLalu');
  return {
    totalOsl: thnIni,
    mtm: safeGrowth(thnIni, bulanLalu),
    yoy: safeGrowth(thnIni, thnLalu),
    ytd: safeGrowth(thnIni, akhirTahunLalu),
  };
}

export function computeOslAvgKpi(avgRowsFiltered) {
  return { totalOslAvg: sum(avgRowsFiltered, 'oslAvgBulanIniThnIni') };
}

// ---------- KPI Omset ----------
export function computeOmsetKpi(omsetRowsFiltered) {
  const bulanIni = sum(omsetRowsFiltered, 'realisasiBlnIniThnIni');
  const sdBulanIni = sum(omsetRowsFiltered, 'realisasiSdBlnIniThnIni');
  const bulanLalu = sum(omsetRowsFiltered, 'realisasiBlnLaluThnIni');
  const bulanIniLalu = sum(omsetRowsFiltered, 'realisasiBlnIniLalu');
  const sdBulanIniLalu = sum(omsetRowsFiltered, 'realisasiSdBlnIniLalu');
  return {
    totalOmsetBulanIni: bulanIni,
    totalOmsetSdBulanIni: sdBulanIni,
    mtm: safeGrowth(bulanIni, bulanLalu),
    yoy: safeGrowth(bulanIni, bulanIniLalu),
    yoySd: safeGrowth(sdBulanIni, sdBulanIniLalu),
  };
}

// ---------- KPI NPL & LAR ----------
export function computeNplLarKpi(larRowsFiltered) {
  const nominalNpl = sum(larRowsFiltered, 'nominalNpl');
  const oslTotal = sum(larRowsFiltered, 'oslTotal');
  const oslLar = sum(larRowsFiltered, 'oslLar');
  return {
    nominalNpl,
    persenNpl: oslTotal ? (nominalNpl / oslTotal) * 100 : null,
    nominalLar: oslLar,
    persenLar: oslTotal ? (oslLar / oslTotal) * 100 : null,
  };
}

// ---------- Distribusi kategori OSL ----------
export function computeKategoriDistribution(posisiRowsFiltered) {
  const map = new Map();
  posisiRowsFiltered.forEach((r) => {
    const kat = normKategori(r.kategoriOsl);
    if (!kat) return;
    map.set(kat, (map.get(kat) || 0) + (r.oslBulanIniThnIni || 0));
  });
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
  const known = KATEGORI_ORDER.filter((k) => map.has(k));
  const extra = Array.from(map.keys()).filter((k) => !KATEGORI_ORDER.includes(k));
  return [...known, ...extra]
    .map((kat) => ({ kategori: kat, nominal: map.get(kat), persen: total ? (map.get(kat) / total) * 100 : 0 }))
    .filter((d) => d.nominal !== 0);
}

// ---------- Distribusi segmen (GADAI / NON GADAI / EMAS) ----------
export function computeSegmenDistribution(rowsFiltered, valueKey) {
  const map = new Map();
  rowsFiltered.forEach((r) => {
    const seg = r.segmen;
    if (!seg) return;
    map.set(seg, (map.get(seg) || 0) + (r[valueKey] || 0));
  });
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
  const known = SEGMEN_ORDER.filter((k) => map.has(k));
  const extra = Array.from(map.keys()).filter((k) => !SEGMEN_ORDER.includes(k));
  return [...known, ...extra]
    .map((seg) => ({ kategori: seg, nominal: map.get(seg), persen: total ? (map.get(seg) / total) * 100 : 0 }))
    .filter((d) => d.nominal !== 0);
}

// ---------- Komposisi kualitas LAR (5 kategori, Lancar = stacked OSL LANCAR + LANCAR LAR) ----------
export function computeKualitasLarComposition(larRowsFiltered) {
  const oslLancar = sum(larRowsFiltered, 'oslLancar');
  const lancarLar = sum(larRowsFiltered, 'lancarLar');
  const dpk = sum(larRowsFiltered, 'oslDpk');
  const kl = sum(larRowsFiltered, 'oslKl');
  const dr = sum(larRowsFiltered, 'oslDr');
  const macet = sum(larRowsFiltered, 'oslMacet');
  return [
    {
      kategori: 'Lancar',
      nominal: oslLancar + lancarLar,
      stacked: [
        { label: 'OSL Lancar', nominal: oslLancar },
        { label: 'Lancar LAR', nominal: lancarLar },
      ],
    },
    { kategori: 'Dalam Perhatian Khusus', nominal: dpk },
    { kategori: 'Kurang Lancar', nominal: kl },
    { kategori: 'Diragukan', nominal: dr },
    { kategori: 'Macet', nominal: macet },
  ];
}

// ---------- Top-N produk OSL (nominal) ----------
export function computeTopProdukOsl(posisiRowsFiltered, n = 5) {
  const map = new Map();
  posisiRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    map.set(r.subProduk, (map.get(r.subProduk) || 0) + (r.oslBulanIniThnIni || 0));
  });
  return Array.from(map.entries())
    .map(([produk, nominal]) => ({ produk, nominal }))
    .filter((d) => d.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n);
}

// ---------- Top/Bottom growth per produk (MTM, YoY, atau YTD) ----------
export function computeGrowthByProduk(posisiRowsFiltered, mode = 'mtm') {
  const map = new Map();
  posisiRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    if (!map.has(r.subProduk)) map.set(r.subProduk, { current: 0, baseline: 0 });
    const entry = map.get(r.subProduk);
    entry.current += r.oslBulanIniThnIni || 0;
    if (mode === 'yoy') entry.baseline += r.oslBulanIniThnLalu || 0;
    else if (mode === 'ytd') entry.baseline += r.oslAkhirTahunThnLalu || 0;
    else entry.baseline += r.oslBulanLaluThnIni || 0;
  });
  const list = [];
  const baru = [];
  map.forEach((v, produk) => {
    const g = safeGrowth(v.current, v.baseline);
    if (g.isNew) {
      baru.push({ produk, nominal: v.current });
    } else if (g.value !== null) {
      list.push({ produk, persen: g.value, nominal: v.current });
    }
  });
  list.sort((a, b) => b.persen - a.persen);
  return {
    top: list.slice(0, 5),
    bottom: list.slice(-5).reverse().filter((x) => !list.slice(0, 5).includes(x)),
    baru,
  };
}

// ---------- Top-N produk NPL / LAR ----------
export function computeTopProdukNpl(larRowsFiltered, n = 5) {
  const map = new Map();
  larRowsFiltered.forEach((r) => {
    if (!r.subProductNm) return;
    map.set(r.subProductNm, (map.get(r.subProductNm) || 0) + (r.nominalNpl || 0));
  });
  return Array.from(map.entries())
    .map(([produk, nominal]) => ({ produk, nominal }))
    .filter((d) => d.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n);
}

export function computeTopProdukLar(larRowsFiltered, n = 5) {
  const map = new Map();
  larRowsFiltered.forEach((r) => {
    if (!r.subProductNm) return;
    map.set(r.subProductNm, (map.get(r.subProductNm) || 0) + (r.oslLar || 0));
  });
  return Array.from(map.entries())
    .map(([produk, nominal]) => ({ produk, nominal }))
    .filter((d) => d.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n);
}

// ---------- Top-N produk Omset (nominal) ----------
export function computeTopProdukOmset(omsetRowsFiltered, n = 5) {
  const map = new Map();
  omsetRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    map.set(r.subProduk, (map.get(r.subProduk) || 0) + (r.realisasiBlnIniThnIni || 0));
  });
  return Array.from(map.entries())
    .map(([produk, nominal]) => ({ produk, nominal }))
    .filter((d) => d.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n);
}

// ---------- Top/Bottom growth Omset per produk (mtm, yoy, atau yoy-sd) ----------
export function computeGrowthOmsetByProduk(omsetRowsFiltered, mode = 'mtm') {
  const map = new Map();
  omsetRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    if (!map.has(r.subProduk)) map.set(r.subProduk, { current: 0, baseline: 0 });
    const entry = map.get(r.subProduk);
    if (mode === 'yoy') {
      entry.current += r.realisasiBlnIniThnIni || 0;
      entry.baseline += r.realisasiBlnIniLalu || 0;
    } else if (mode === 'yoy-sd') {
      entry.current += r.realisasiSdBlnIniThnIni || 0;
      entry.baseline += r.realisasiSdBlnIniLalu || 0;
    } else {
      entry.current += r.realisasiBlnIniThnIni || 0;
      entry.baseline += r.realisasiBlnLaluThnIni || 0;
    }
  });
  const list = [];
  const baru = [];
  map.forEach((v, produk) => {
    const g = safeGrowth(v.current, v.baseline);
    if (g.isNew) {
      baru.push({ produk, nominal: v.current });
    } else if (g.value !== null) {
      list.push({ produk, persen: g.value, nominal: v.current });
    }
  });
  list.sort((a, b) => b.persen - a.persen);
  return {
    top: list.slice(0, 5),
    bottom: list.slice(-5).reverse().filter((x) => !list.slice(0, 5).includes(x)),
    baru,
  };
}

// ---------- KPI Nasabah ----------
export function computeNasabahKpi(nasabahRowsFiltered) {
  const bulanIni = sum(nasabahRowsFiltered, 'custBulanIniThnIni');
  const bulanLalu = sum(nasabahRowsFiltered, 'custBulanLaluThnIni');
  const bulanIniLalu = sum(nasabahRowsFiltered, 'custBulanIniLalu');
  const akhirTahunLalu = sum(nasabahRowsFiltered, 'custAkhirTahunLalu');
  return {
    totalNasabah: bulanIni,
    mtm: safeGrowth(bulanIni, bulanLalu),
    yoy: safeGrowth(bulanIni, bulanIniLalu),
    ytd: safeGrowth(bulanIni, akhirTahunLalu),
  };
}

// ---------- Top-N produk Nasabah (nominal) ----------
export function computeTopProdukNasabah(nasabahRowsFiltered, n = 5) {
  const map = new Map();
  nasabahRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    map.set(r.subProduk, (map.get(r.subProduk) || 0) + (r.custBulanIniThnIni || 0));
  });
  return Array.from(map.entries())
    .map(([produk, nominal]) => ({ produk, nominal }))
    .filter((d) => d.nominal > 0)
    .sort((a, b) => b.nominal - a.nominal)
    .slice(0, n);
}

// ---------- Top/Bottom growth Nasabah per produk (mtm, yoy, ytd) ----------
export function computeGrowthNasabahByProduk(nasabahRowsFiltered, mode = 'mtm') {
  const map = new Map();
  nasabahRowsFiltered.forEach((r) => {
    if (!r.subProduk) return;
    if (!map.has(r.subProduk)) map.set(r.subProduk, { current: 0, baseline: 0 });
    const entry = map.get(r.subProduk);
    entry.current += r.custBulanIniThnIni || 0;
    if (mode === 'yoy') entry.baseline += r.custBulanIniLalu || 0;
    else if (mode === 'ytd') entry.baseline += r.custAkhirTahunLalu || 0;
    else entry.baseline += r.custBulanLaluThnIni || 0;
  });
  const list = [];
  const baru = [];
  map.forEach((v, produk) => {
    const g = safeGrowth(v.current, v.baseline);
    if (g.isNew) {
      baru.push({ produk, nominal: v.current });
    } else if (g.value !== null) {
      list.push({ produk, persen: g.value, nominal: v.current });
    }
  });
  list.sort((a, b) => b.persen - a.persen);
  return {
    top: list.slice(0, 5),
    bottom: list.slice(-5).reverse().filter((x) => !list.slice(0, 5).includes(x)),
    baru,
  };
}

// ---------- Tren antar bulan: OSL Posisi (bar) vs OSL AVG (line) ----------
// posisiTrend / avgTrend: [{ label, date, rows }] — satu entri per file yang diupload.
// Digabung berdasarkan label (nama bulan/tanggal dari nama file) supaya posisi & avg bulan
// yang sama muncul dalam 1 titik data, lalu diurutkan berdasarkan tanggal.
export function computeOslTrendSeries(posisiTrend, avgTrend, filters) {
  const map = new Map();
  const getEntry = (label, date) => {
    if (!map.has(label)) map.set(label, { label, date, posisi: 0, avg: 0 });
    return map.get(label);
  };
  (posisiTrend || []).forEach(({ label, date, rows }) => {
    const filtered = applyKategoriFilter(
      applySegmenFilter(applyLocationFlagFilter(rows, filters), filters.segmen),
      filters.kategoriOsl
    );
    getEntry(label, date).posisi = sum(filtered, 'oslBulanIniThnIni');
  });
  (avgTrend || []).forEach(({ label, date, rows }) => {
    const filtered = applyKategoriFilter(
      applySegmenFilter(applyLocationFlagFilter(rows, filters), filters.segmen),
      filters.kategoriOsl
    );
    getEntry(label, date).avg = sum(filtered, 'oslAvgBulanIniThnIni');
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.date && b.date) return a.date - b.date;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.label.localeCompare(b.label, 'id');
  });
}

// ---------- Tren antar bulan: Omset ----------
export function computeOmsetTrendSeries(omsetTrend, filters) {
  return (omsetTrend || [])
    .map(({ label, date, rows }) => {
      const filtered = applySegmenFilter(applyLocationFlagFilter(rows, filters), filters.segmen);
      return { label, date, omset: sum(filtered, 'realisasiBlnIniThnIni') };
    })
    .sort((a, b) => {
      if (a.date && b.date) return a.date - b.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.label.localeCompare(b.label, 'id');
    });
}

// ---------- Tabel agregasi per satuan (join Posisi + LAR + Omset + Nasabah) ----------
// Generik: dipakai untuk agregasi per OUTLET (by unit/outlet code) maupun per CABANG
// (by cabang code) dengan menyuntikkan pengekstrak kode+nama untuk masing-masing sumber.
function computeAggregatedTable(
  posisiRowsFiltered,
  larRowsFiltered,
  omsetRowsFiltered = [],
  nasabahRowsFiltered = [],
  keyFromPosisi,
  nameFromPosisi,
  keyFromLar,
  nameFromLar
) {
  const map = new Map();

  const ensure = (code, name) => {
    if (!map.has(code)) {
      map.set(code, {
        outletCode: code,
        outletName: name,
        aktif: 0,
        bermasalah: 0,
        bjdplMdpl: 0,
        dpp: 0,
        nominalNpl: 0,
        oslTotalLar: 0,
        nominalLar: 0,
        omsetBulanIni: 0,
        omsetSdBulanIni: 0,
        nasabah: 0,
      });
    }
    return map.get(code);
  };

  posisiRowsFiltered.forEach((r) => {
    const code = keyFromPosisi(r);
    if (!code) return;
    const entry = ensure(code, nameFromPosisi(r));
    const kat = normKategori(r.kategoriOsl);
    const val = r.oslBulanIniThnIni || 0;
    if (kat === 'AKTIF') entry.aktif += val;
    else if (kat === 'BERMASALAH') entry.bermasalah += val;
    else if (kat === 'BJDPL/MDPL') entry.bjdplMdpl += val;
    else if (kat === 'DPP') entry.dpp += val;
  });

  larRowsFiltered.forEach((r) => {
    const code = keyFromLar(r);
    if (!code) return;
    const entry = ensure(code, nameFromLar(r));
    entry.nominalNpl += r.nominalNpl || 0;
    entry.oslTotalLar += r.oslTotal || 0;
    entry.nominalLar += r.oslLar || 0;
    if (!entry.outletName) entry.outletName = nameFromLar(r);
  });

  omsetRowsFiltered.forEach((r) => {
    const code = keyFromPosisi(r);
    if (!code) return;
    const entry = ensure(code, nameFromPosisi(r));
    entry.omsetBulanIni += r.realisasiBlnIniThnIni || 0;
    entry.omsetSdBulanIni += r.realisasiSdBlnIniThnIni || 0;
    if (!entry.outletName) entry.outletName = nameFromPosisi(r);
  });

  nasabahRowsFiltered.forEach((r) => {
    const code = keyFromPosisi(r);
    if (!code) return;
    const entry = ensure(code, nameFromPosisi(r));
    entry.nasabah += r.custBulanIniThnIni || 0;
    if (!entry.outletName) entry.outletName = nameFromPosisi(r);
  });

  const rows = Array.from(map.values()).map((e) => {
    const totalOsl = e.aktif + e.bermasalah + e.bjdplMdpl + e.dpp;
    return {
      ...e,
      totalOsl,
      persenNpl: e.oslTotalLar ? (e.nominalNpl / e.oslTotalLar) * 100 : null,
      persenLar: e.oslTotalLar ? (e.nominalLar / e.oslTotalLar) * 100 : null,
    };
  });

  const totalRow = rows.reduce(
    (acc, r) => {
      acc.aktif += r.aktif;
      acc.bermasalah += r.bermasalah;
      acc.bjdplMdpl += r.bjdplMdpl;
      acc.dpp += r.dpp;
      acc.totalOsl += r.totalOsl;
      acc.nominalNpl += r.nominalNpl;
      acc.nominalLar += r.nominalLar;
      acc.oslTotalLar += r.oslTotalLar;
      acc.omsetBulanIni += r.omsetBulanIni;
      acc.omsetSdBulanIni += r.omsetSdBulanIni;
      acc.nasabah += r.nasabah;
      return acc;
    },
    {
      aktif: 0, bermasalah: 0, bjdplMdpl: 0, dpp: 0, totalOsl: 0, nominalNpl: 0, nominalLar: 0, oslTotalLar: 0,
      omsetBulanIni: 0, omsetSdBulanIni: 0, nasabah: 0,
    }
  );
  totalRow.persenNpl = totalRow.oslTotalLar ? (totalRow.nominalNpl / totalRow.oslTotalLar) * 100 : null;
  totalRow.persenLar = totalRow.oslTotalLar ? (totalRow.nominalLar / totalRow.oslTotalLar) * 100 : null;

  return { rows, totalRow };
}

// ---------- Tabel Outlet (agregasi per outlet/unit, join Posisi + LAR + Omset + Nasabah) ----------
export function computeOutletTable(posisiRowsFiltered, larRowsFiltered, omsetRowsFiltered = [], nasabahRowsFiltered = []) {
  return computeAggregatedTable(
    posisiRowsFiltered,
    larRowsFiltered,
    omsetRowsFiltered,
    nasabahRowsFiltered,
    (r) => r.unitCode,
    (r) => r.unitName,
    (r) => r.outletCode,
    (r) => r.outletName
  );
}

// ---------- Tabel Cabang (konsolidasi: agregasi per cabang dari semua outlet-nya) ----------
export function computeCabangTable(posisiRowsFiltered, larRowsFiltered, omsetRowsFiltered = [], nasabahRowsFiltered = []) {
  return computeAggregatedTable(
    posisiRowsFiltered,
    larRowsFiltered,
    omsetRowsFiltered,
    nasabahRowsFiltered,
    (r) => r.cabangCode,
    (r) => r.cabangName,
    (r) => r.cabangCode,
    (r) => r.cabangName
  );
}

// ---------- Grafik Pelunasan ----------
// Pelunasan(bulan N) = OSL Posisi(bulan N-1) + Omset(bulan N) - OSL Posisi(bulan N).
// Hanya dihitung bila posisi & omset bulan yang sama tersedia DAN posisi bulan sebelumnya ada.
// Filter yang dipakai hanya lokasi + Konven/Syariah + segmen (TANPA kategori OSL) supaya nilai
// posisi & omset tetap sebanding (file Omset tidak punya kolom kategori).
export function computePelunasanSeries(posisiTrend, omsetTrend, filters) {
  const sumByLabel = (trend, valueKey, rowFilter) => {
    const map = new Map();
    (trend || []).forEach(({ label, date, rows }) => {
      const filtered = rowFilter(rows);
      map.set(label, { label, date, value: sum(filtered, valueKey) });
    });
    return map;
  };

  const sortCmp = (a, b) => {
    if (a.date && b.date) return a.date - b.date;
    if (a.date) return -1;
    if (b.date) return 1;
    return a.label.localeCompare(b.label, 'id');
  };

  const locationSegmen = (rows) => applySegmenFilter(applyLocationFlagFilter(rows, filters), filters.segmen);
  const posisiMap = sumByLabel(posisiTrend, 'oslBulanIniThnIni', locationSegmen);
  const omsetMap = sumByLabel(omsetTrend, 'realisasiBlnIniThnIni', locationSegmen);

  const omsetList = Array.from(omsetMap.values()).sort(sortCmp);
  const result = [];
  let prevPosisi = null;

  for (const o of omsetList) {
    const currentPosisi = posisiMap.get(o.label);
    if (!currentPosisi) continue;
    if (prevPosisi == null) {
      prevPosisi = currentPosisi.value;
      continue;
    }
    result.push({
      label: o.label,
      date: o.date,
      pelunasan: prevPosisi + o.value - currentPosisi.value,
    });
    prevPosisi = currentPosisi.value;
  }

  return result;
}
