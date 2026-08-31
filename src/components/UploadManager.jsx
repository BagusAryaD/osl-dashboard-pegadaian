import { useState } from 'react';
import Dropzone from './Dropzone.jsx';
import MultiDropzone from './MultiDropzone.jsx';
import { parsePosisi, parseAvg, parseLar, parseOmset, parseNasabah, extractDateFromFilename } from '../utils/parser.js';
import { getDummyData } from '../data/dummy-data.js';
import logo from '../assets/logo.svg';

// Field yang bisa upload banyak file (1 file per akhir bulan) untuk grafik tren.
const MULTI_SLOTS = [
  { key: 'omset', label: 'Omset', hint: 'File Omset Per Produk S.D Hari (.xlsx/.csv) — nama file: dd-mm-yyyy', parser: parseOmset },
  { key: 'posisi', label: 'OSL Posisi', hint: 'File Detail OSL Posisi (.xlsx/.csv) — nama file: dd-mm-yyyy', parser: parsePosisi },
  { key: 'avg', label: 'OSL AVG', hint: 'File Detail OSL Rata-rata (.xlsx/.csv) — nama file: dd-mm-yyyy', parser: parseAvg },
];

// Field upload tunggal (tidak dibandingkan antar bulan).
const SINGLE_SLOTS = [
  { key: 'lar', label: 'LAR', hint: 'File Detail Laporan Loan at Risk (.xlsx)', parser: parseLar },
  { key: 'nasabah', label: 'Nasabah', hint: 'File Nasabah Aktif Pertahun (.xlsx)', parser: parseNasabah },
];

let entrySeq = 0;

export default function UploadManager({ onReady }) {
  const [multiState, setMultiState] = useState({ omset: [], posisi: [], avg: [] });
  const [singleState, setSingleState] = useState({});
  const [busy, setBusy] = useState(false);

  const handleMultiFiles = async (key, parser, files) => {
    const newEntries = files.map((file) => {
      const dateInfo = extractDateFromFilename(file.name);
      return {
        entryKey: `e${++entrySeq}`,
        fileName: file.name,
        date: dateInfo?.date || null,
        label: dateInfo?.label || null,
        loading: true,
      };
    });

    setMultiState((s) => {
      // Ganti entry lama yang tanggalnya sama (upload ulang file bulan yang sama).
      const existing = s[key].filter(
        (e) => !newEntries.some((n) => n.label && n.label === e.label)
      );
      return { ...s, [key]: [...existing, ...newEntries] };
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const entry = newEntries[i];
      try {
        const rows = await parser(file);
        setMultiState((s) => ({
          ...s,
          [key]: s[key].map((e) => (e.entryKey === entry.entryKey ? { ...e, rows, rowCount: rows.length, loading: false } : e)),
        }));
      } catch (err) {
        setMultiState((s) => ({
          ...s,
          [key]: s[key].map((e) => (e.entryKey === entry.entryKey ? { ...e, error: err.message || String(err), loading: false } : e)),
        }));
      }
    }
  };

  const removeMultiEntry = (key, entryKey) => {
    setMultiState((s) => ({ ...s, [key]: s[key].filter((e) => e.entryKey !== entryKey) }));
  };

  const handleSingleFile = async (key, parser, file) => {
    setSingleState((s) => ({ ...s, [key]: { fileName: file.name, loading: true } }));
    try {
      const rows = await parser(file);
      setSingleState((s) => ({ ...s, [key]: { fileName: file.name, rows, rowCount: rows.length } }));
    } catch (e) {
      setSingleState((s) => ({ ...s, [key]: { fileName: file.name, error: e.message || String(e) } }));
    }
  };

  const sortedEntries = (key) =>
    multiState[key]
      .filter((e) => e.rows)
      .slice()
      .sort((a, b) => {
        if (a.date && b.date) return a.date - b.date;
        if (a.date) return -1;
        if (b.date) return 1;
        return a.fileName.localeCompare(b.fileName, 'id');
      });

  const anyLoading =
    MULTI_SLOTS.some((s) => multiState[s.key].some((e) => e.loading)) ||
    SINGLE_SLOTS.some((s) => singleState[s.key]?.loading);

  const hasAnyData =
    MULTI_SLOTS.some((s) => sortedEntries(s.key).length > 0) ||
    SINGLE_SLOTS.some((s) => singleState[s.key]?.rows);

  const hasAnyError =
    MULTI_SLOTS.some((s) => multiState[s.key].some((e) => e.error)) ||
    SINGLE_SLOTS.some((s) => singleState[s.key]?.error);

  const process = () => {
    setBusy(true);
    const posisiEntries = sortedEntries('posisi');
    const avgEntries = sortedEntries('avg');
    const omsetEntries = sortedEntries('omset');

    const latestRows = (entries) => (entries.length ? entries[entries.length - 1].rows : []);
    const toTrend = (entries) => entries.map((e) => ({ label: e.label || e.fileName, date: e.date, rows: e.rows }));

    onReady({
      posisi: latestRows(posisiEntries),
      avg: latestRows(avgEntries),
      omset: latestRows(omsetEntries),
      lar: singleState.lar?.rows || [],
      nasabah: singleState.nasabah?.rows || [],
      posisiTrend: toTrend(posisiEntries),
      avgTrend: toTrend(avgEntries),
      omsetTrend: toTrend(omsetEntries),
    });
  };

  return (
    <div className="upload-wrap">
      <img src={logo} alt="Logo" style={{ height: 64, display: 'block', margin: '0 auto 18px' }} />
      <div className="upload-title">Dashboard Monitoring OSL, NPL &amp; LAR</div>
      <div className="upload-sub">
        Upload minimal 1 file sumber data untuk mulai membuat dashboard. Semua field bersifat opsional —
        bagian dashboard yang ditampilkan menyesuaikan data yang diupload.
      </div>

      <div className="upload-grid">
        {MULTI_SLOTS.map((s) => (
          <MultiDropzone
            key={s.key}
            label={s.label}
            hint={s.hint}
            entries={multiState[s.key]}
            onFiles={(files) => handleMultiFiles(s.key, s.parser, files)}
            onRemove={(entryKey) => removeMultiEntry(s.key, entryKey)}
          />
        ))}
        {SINGLE_SLOTS.map((s) => (
          <Dropzone
            key={s.key}
            label={s.label}
            hint={s.hint}
            fileName={singleState[s.key]?.fileName}
            rowCount={singleState[s.key]?.rowCount}
            error={singleState[s.key]?.error}
            onFile={(file) => handleSingleFile(s.key, s.parser, file)}
          />
        ))}
      </div>

      {hasAnyError && (
        <div className="banner banner-error">
          Ada file yang gagal diproses. Periksa kembali apakah file yang diupload sudah benar.
        </div>
      )}

      <div className="upload-actions">
        <button className="btn btn-primary" disabled={!hasAnyData || anyLoading || busy} onClick={process}>
          Proses Dashboard
        </button>
        <button className="btn btn-secondary" disabled={anyLoading || busy} onClick={() => onReady(getDummyData())}>
          Muat Data Demo
        </button>
      </div>
    </div>
  );
}
