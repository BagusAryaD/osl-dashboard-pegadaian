import { useState, useRef } from 'react';

export default function Dropzone({ label, hint, fileName, rowCount, error, onFile }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    if (files && files[0]) onFile(files[0]);
  };

  const cls = ['dropzone'];
  if (dragOver) cls.push('drag-over');
  if (fileName && !error) cls.push('has-file');
  if (error) cls.push('has-error');

  return (
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
      {fileName && !error && (
        <>
          <div className="dz-file">✓ {fileName}</div>
          {rowCount !== undefined && <div className="dz-rows">{rowCount.toLocaleString('id-ID')} baris terbaca</div>}
        </>
      )}
      {error && <div className="dz-error">✗ {error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
