import { useState, useRef } from 'react';

// Dropzone yang menerima banyak file sekaligus (satu file per akhir bulan) untuk
// keperluan grafik tren antar bulan. Setiap file WAJIB punya tanggal di nama filenya
// dengan format dd-mm-yyyy (contoh: "31-07-2026.xlsx" atau "OSL Posisi 30-06-2026.csv").
export default function MultiDropzone({ label, hint, entries, busyKeys, onFiles, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    if (files && files.length) onFiles(Array.from(files));
  };

  const cls = ['dropzone', 'dropzone-multi'];
  if (dragOver) cls.push('drag-over');
  if (entries.length) cls.push('has-file');
  const hasError = entries.some((e) => e.error);
  if (hasError) cls.push('has-error');

  return (
    <div className="multi-dropzone-wrap">
      <div
        className={cls.join(' ')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="dz-icon">📁</span>
        <div className="dz-label">{label}</div>
        <div className="dz-hint">{hint}</div>
        <div className="dz-hint dz-hint-muted">Bisa upload lebih dari 1 file (klik atau drag beberapa file sekaligus) untuk dibandingkan antar bulan.</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {entries.length > 0 && (
        <div className="multi-file-list">
          {entries.slice().sort((a, b) => {
            if (a.date && b.date) return a.date - b.date;
            if (a.date) return -1;
            if (b.date) return 1;
            return a.fileName.localeCompare(b.fileName, 'id');
          }).map((e) => (
            <div className={`multi-file-row ${e.error ? 'has-error' : ''}`} key={e.entryKey}>
              <div className="multi-file-info">
                <span className="multi-file-date">{e.label || 'Tanpa tanggal'}</span>
                <span className="multi-file-name" title={e.fileName}>{e.fileName}</span>
                {e.loading && <span className="multi-file-status">Memproses...</span>}
                {!e.loading && !e.error && e.rowCount !== undefined && (
                  <span className="multi-file-status">{e.rowCount.toLocaleString('id-ID')} baris</span>
                )}
                {e.error && <span className="multi-file-error">✗ {e.error}</span>}
              </div>
              <button
                type="button"
                className="multi-file-remove"
                title="Hapus file ini"
                onClick={(ev) => { ev.stopPropagation(); onRemove(e.entryKey); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {entries.some((e) => !e.date && !e.error) && (
        <div className="dz-hint dz-hint-warning">
          ⚠ Ada file tanpa tanggal terdeteksi di nama filenya (format harus dd-mm-yyyy). File ini tidak akan ikut ditampilkan di grafik tren bulanan.
        </div>
      )}
    </div>
  );
}
