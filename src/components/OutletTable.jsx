import { useMemo, useState } from 'react';
import { formatCompactRupiah, formatCompactNumber, formatPlainPercent } from '../utils/format.js';

const BASE_COLUMNS = [
  { key: 'outletName', label: 'Nama Outlet', className: 'col-name' },
  { key: 'omsetBulanIni', label: 'Omset Bulan Ini', type: 'money', section: 'omset' },
  { key: 'omsetSdBulanIni', label: 'Omset S.D. Bulan Ini', type: 'money', section: 'omset' },
  { key: 'aktif', label: 'OSL Aktif', type: 'money', section: 'osl' },
  { key: 'bermasalah', label: 'OSL Bermasalah', type: 'money', section: 'osl' },
  { key: 'bjdplMdpl', label: 'OSL BJDPL/MDPL', type: 'money', section: 'osl' },
  { key: 'dpp', label: 'OSL DPP', type: 'money', section: 'osl' },
  { key: 'totalOsl', label: 'Total OSL', type: 'money', section: 'osl' },
  { key: 'nominalNpl', label: 'Nominal NPL', type: 'money', section: 'nplLar' },
  { key: 'persenNpl', label: '% NPL', type: 'percent', section: 'nplLar' },
  { key: 'nominalLar', label: 'Nominal LAR', type: 'money', section: 'nplLar' },
  { key: 'persenLar', label: '% LAR', type: 'percent', section: 'nplLar' },
  { key: 'nasabah', label: 'Nasabah', type: 'count', section: 'nasabah' },
];

export default function OutletTable({ rows, totalRow, visibleSections, nameColumnLabel = 'Nama Outlet' }) {
  const [sort, setSort] = useState({ key: 'totalOsl', dir: 'desc' });

  const COLUMNS = useMemo(
    () => BASE_COLUMNS.map((c, i) => (i === 0 ? { ...c, label: nameColumnLabel } : c)),
    [nameColumnLabel]
  );

  // Sembunyikan kolom: (a) di luar section yang aktif difilter, (b) kategori OSL yang datanya kosong total.
  const visibleColumns = useMemo(() => {
    const numericCategoryKeys = ['aktif', 'bermasalah', 'bjdplMdpl', 'dpp'];
    return COLUMNS.filter((c) => {
      if (c.section && !visibleSections.has(c.section)) return false;
      if (!numericCategoryKeys.includes(c.key)) return true;
      return totalRow[c.key] !== 0;
    });
  }, [COLUMNS, totalRow, visibleSections]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    const sortKey = visibleColumns.some((c) => c.key === sort.key) ? sort.key : 'outletName';
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === 'outletName') {
        return sort.dir === 'asc' ? String(av).localeCompare(bv, 'id') : String(bv).localeCompare(av, 'id');
      }
      const an = av === null ? -Infinity : av;
      const bn = bv === null ? -Infinity : bv;
      return sort.dir === 'asc' ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sort, visibleColumns]);

  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  };

  const renderValue = (col, val) => {
    if (col.type === 'money') return formatCompactRupiah(val);
    if (col.type === 'percent') return val === null ? '-' : formatPlainPercent(val);
    if (col.type === 'count') return formatCompactNumber(val);
    return val;
  };

  if (!rows.length) return <div className="topn-empty">Tidak ada data outlet untuk filter ini.</div>;

  return (
    <div className="scrollable-container">
      <table className="dash-table">
        <thead>
          <tr>
            {visibleColumns.map((c) => (
              <th
                key={c.key}
                className={`${c.className || ''} sortable`}
                onClick={() => handleSort(c.key)}
              >
                {c.label}
                {sort.key === c.key && <span className="sort-arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r) => (
            <tr key={r.outletCode}>
              {visibleColumns.map((c) => (
                <td key={c.key} className={c.className || ''}>
                  {c.key === 'outletName' ? r.outletName || r.outletCode : renderValue(c, r[c.key])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="row-total">
            {visibleColumns.map((c, i) => (
              <td key={c.key} className={c.className || ''}>
                {i === 0 ? 'TOTAL' : renderValue(c, totalRow[c.key])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
