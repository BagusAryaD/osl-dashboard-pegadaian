import { useMemo } from 'react';
import { buildAreaOptions, buildCabangOptions, KATEGORI_ORDER, SEGMEN_ORDER } from '../utils/aggregate.js';

export const SECTION_DEFS = [
  { key: 'omset', label: 'Omset' },
  { key: 'osl', label: 'OSL' },
  { key: 'nplLar', label: 'NPL & LAR' },
  { key: 'nasabah', label: 'Nasabah' },
];

export default function FilterBar({ filterSourceRows, filters, setFilters, visibleSections, toggleSection, availableSections }) {
  const areaOptions = useMemo(() => buildAreaOptions(filterSourceRows), [filterSourceRows]);
  const cabangOptions = useMemo(
    () => buildCabangOptions(filterSourceRows, filters.areaName, filters.flag),
    [filterSourceRows, filters.areaName, filters.flag]
  );
  const visibleSectionDefs = SECTION_DEFS.filter((s) => !availableSections || availableSections.includes(s.key));

  return (
    <div className="filter-bar no-print">
      {visibleSectionDefs.length > 0 && (
        <div className="filter-item">
          <label>TAMPILKAN BAGIAN</label>
          <div className="chip-group">
            {visibleSectionDefs.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`chip-toggle ${visibleSections.has(s.key) ? 'active' : ''}`}
                onClick={() => toggleSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-item">
        <label>AREA</label>
        <select
          value={filters.areaName}
          onChange={(e) => setFilters((f) => ({ ...f, areaName: e.target.value, cabangCode: '' }))}
        >
          <option value="">Semua Area</option>
          {areaOptions.map((o) => (
            <option key={o.name} value={o.name}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-item">
        <label>CABANG</label>
        <select
          value={filters.cabangCode}
          onChange={(e) => setFilters((f) => ({ ...f, cabangCode: e.target.value }))}
        >
          <option value="">Semua Cabang</option>
          {cabangOptions.map((o) => (
            <option key={o.code} value={o.code}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-item">
        <label>KONVEN / SYARIAH</label>
        <select
          value={filters.flag}
          onChange={(e) => setFilters((f) => ({ ...f, flag: e.target.value, cabangCode: '' }))}
        >
          <option value="">Semua</option>
          <option value="KONVEN">Konven</option>
          <option value="SYARIAH">Syariah</option>
        </select>
        <div className="filter-note">*cabang & outlet konven/syariah berbeda meski nama area sama</div>
      </div>

      <div className="filter-item">
        <label>SEGMEN</label>
        <select value={filters.segmen} onChange={(e) => setFilters((f) => ({ ...f, segmen: e.target.value }))}>
          <option value="">Semua</option>
          {SEGMEN_ORDER.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="filter-item">
        <label>KATEGORI OSL</label>
        <select
          value={filters.kategoriOsl}
          onChange={(e) => setFilters((f) => ({ ...f, kategoriOsl: e.target.value }))}
        >
          <option value="">Semua</option>
          {KATEGORI_ORDER.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <div className="filter-note">*tidak berlaku ke bagian NPL &amp; LAR</div>
      </div>
    </div>
  );
}
