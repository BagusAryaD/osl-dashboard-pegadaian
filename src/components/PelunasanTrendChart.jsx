import { formatCompactRupiah } from '../utils/format.js';

// Grafik garis tren Pelunasan antar bulan.
// Pelunasan(bulan N) = OSL Posisi(N-1) + Omset(N) - OSL Posisi(N).
export default function PelunasanTrendChart({ data }) {
  if (!data.length) return <div className="topn-empty">Belum ada data untuk grafik pelunasan ini.</div>;

  const width = Math.max(480, data.length * 110);
  const height = 260;
  const padTop = 34;
  const padBottom = 46;
  const padLeft = 12;
  const padRight = 12;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.pelunasan || 0), 1);
  const step = (width - padLeft - padRight) / data.length;

  const yFor = (v) => padTop + plotH - (v / maxVal) * plotH;
  const points = data.map((d, i) => {
    const cx = padLeft + step * i + step / 2;
    return { cx, cy: yFor(d.pelunasan || 0), d };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');

  return (
    <div className="trend-chart-wrap">
      <div className="trend-legend">
        <span className="trend-legend-item"><i className="dot dot-line dot-line-pun" /> Pelunasan</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg" preserveAspectRatio="xMinYMid meet">
        <line x1={padLeft} y1={padTop + plotH} x2={width - padRight} y2={padTop + plotH} stroke="var(--border)" strokeWidth="1" />
        <path d={linePath} fill="none" stroke="var(--accent-green)" strokeWidth="2.5" />
        {points.map((p) => (
          <g key={`pt-${p.d.label}`}>
            <circle cx={p.cx} cy={p.cy} r="4.5" fill="var(--accent-green)" stroke="#fff" strokeWidth="1.5">
              <title>{`${p.d.label} — Pelunasan: ${formatCompactRupiah(p.d.pelunasan || 0)}`}</title>
            </circle>
            <text x={p.cx} y={p.cy - 10} textAnchor="middle" className="trend-line-label">
              {formatCompactRupiah(p.d.pelunasan || 0)}
            </text>
            <text x={p.cx} y={height - 10} textAnchor="middle" className="trend-x-label">
              {p.d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
