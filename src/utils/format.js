// Fungsi format angka & teks — murni JS, tidak ada JSX di sini.

export function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (!isFinite(val)) return null; // Infinity/-Infinity dianggap "tidak valid"
    return val;
  }
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'infinity' || s.toLowerCase() === '-infinity' || s.toLowerCase() === 'nan') {
    return s.toLowerCase().includes('infinity') ? null : 0;
  }
  const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function formatRupiah(n) {
  if (n === null || n === undefined) return '-';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + 'Rp' + Math.round(abs).toLocaleString('id-ID');
}

export function formatCompactRupiah(n) {
  if (n === null || n === undefined) return '-';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e12) return sign + 'Rp' + (abs / 1e12).toFixed(2).replace(/\.00$/, '') + 'T';
  if (abs >= 1e9) return sign + 'Rp' + (abs / 1e9).toFixed(2).replace(/\.00$/, '') + 'M';
  if (abs >= 1e6) return sign + 'Rp' + (abs / 1e6).toFixed(2).replace(/\.00$/, '') + 'Jt';
  return formatRupiah(n);
}

export function formatCompactNumber(n) {
  if (n === null || n === undefined) return '-';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(2).replace(/\.00$/, '') + ' M';
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(2).replace(/\.00$/, '') + ' Jt';
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, '') + ' rb';
  return sign + Math.round(abs).toLocaleString('id-ID');
}

export function formatPercent(n, digits = 2) {
  if (n === null || n === undefined) return '-';
  return (n > 0 ? '+' : '') + n.toFixed(digits) + '%';
}

export function formatPlainPercent(n, digits = 2) {
  if (n === null || n === undefined) return '-';
  return n.toFixed(digits) + '%';
}

// Split "kode:nama" -> { code, name }. Kalau tidak ada ':', code = seluruh string.
export function splitCodeName(raw) {
  if (raw === null || raw === undefined) return { code: '', name: '' };
  const s = String(raw).trim();
  const idx = s.indexOf(':');
  if (idx === -1) return { code: s, name: s };
  return { code: s.slice(0, idx).trim(), name: s.slice(idx + 1).trim() };
}

// Hitung growth % dari baseline -> current.
// return { value: number|null, isNew: boolean } — isNew=true kalau baseline 0 & current > 0 (growth tak terhingga)
export function safeGrowth(current, baseline) {
  if (baseline === null || current === null) return { value: null, isNew: false, invalid: true };
  if (baseline === 0) {
    if (current === 0) return { value: 0, isNew: false };
    return { value: null, isNew: true };
  }
  return { value: ((current - baseline) / Math.abs(baseline)) * 100, isNew: false };
}
