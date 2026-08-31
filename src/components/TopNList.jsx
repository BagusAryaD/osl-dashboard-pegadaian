import { formatCompactRupiah, formatCompactNumber, formatPercent } from '../utils/format.js';

// items: [{ produk, nominal, persen? }]
// mode 'nominal' -> format rupiah, 'count' -> format angka biasa (mis. jumlah nasabah), 'growth' -> persen + nominal kecil
export default function TopNList({ items, mode = 'nominal', variant = 'default', emptyText = 'Tidak ada data.' }) {
  if (!items.length) return <div className="topn-empty">{emptyText}</div>;
  const max = Math.max(...items.map((d) => (mode === 'growth' ? Math.abs(d.persen) : d.nominal)), 1);
  const fillClass = variant === 'danger' ? 'topn-fill danger' : variant === 'gold' ? 'topn-fill gold' : 'topn-fill';
  const formatVal = (d) => {
    if (mode === 'growth') return formatPercent(d.persen);
    if (mode === 'count') return formatCompactNumber(d.nominal);
    return formatCompactRupiah(d.nominal);
  };

  return (
    <div>
      {items.map((d, i) => (
        <div className="topn-row" key={d.produk + i}>
          <div className="topn-label">
            <span className="name">{i + 1}. {d.produk}</span>
            <span className="val">{formatVal(d)}</span>
          </div>
          <div className="topn-track">
            <div
              className={fillClass}
              style={{ width: `${(Math.min(mode === 'growth' ? Math.abs(d.persen) : d.nominal, max) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
