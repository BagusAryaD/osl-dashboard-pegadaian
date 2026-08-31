import { formatCompactRupiah } from '../utils/format.js';

// Grafik gabungan: OSL Posisi (area chart) + OSL AVG (line), satu chart dengan skala sama.
// Posisi & AVG nilainya berdekatan (AVG ≈ 97% posisi), jadi Posisi digambar sebagai area
// hijau semi-transparan supaya tetap terlihat sebagai satu wilayah, sementara AVG melintas
// sebagai garis emas di atasnya. Label nilai di-staggered (posisi di bawah titik, avg di atas
// titik) supaya tidak saling tumpang tindih. Kalau tidak ada data AVG (showAvg=false),
// hanya area+garis Posisi yang ditampilkan.
export default function OslTrendChart({ data, showAvg = true }) {
  if (!data.length) return <div className="topn-empty">Belum ada data untuk grafik tren ini.</div>;

  const width = Math.max(480, data.length * 110);
  const height = 280;
  const padTop = 34;
  const padBottom = 46;
  const padLeft = 12;
  const padRight = 12;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.posisi || 0, showAvg ? d.avg || 0 : 0)), 1);
  const step = (width - padLeft - padRight) / data.length;
  const baseline = padTop + plotH;

  const yFor = (v) => padTop + plotH - (v / maxVal) * plotH;

  const posisiPoints = data.map((d, i) => {
    const cx = padLeft + step * i + step / 2;
    return { cx, cy: yFor(d.posisi || 0), d };
  });
  const posisiLinePath = posisiPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');
  const posisiAreaPath = `${posisiLinePath} L ${posisiPoints[posisiPoints.length - 1].cx} ${baseline} L ${posisiPoints[0].cx} ${baseline} Z`;

  const avgPoints = data.map((d, i) => {
    const cx = padLeft + step * i + step / 2;
    return { cx, cy: yFor(d.avg || 0), d };
  });
  const avgLinePath = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');

  return (
    <div className="trend-chart-wrap">
      <div className="trend-legend">
        <span className="trend-legend-item"><i className="dot dot-bar" /> OSL Posisi</span>
        {showAvg && <span className="trend-legend-item"><i className="dot dot-line" /> OSL AVG</span>}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart-svg" preserveAspectRatio="xMinYMid meet">
        <line x1={padLeft} y1={baseline} x2={width - padRight} y2={baseline} stroke="var(--border)" strokeWidth="1" />
        <path d={posisiAreaPath} fill="var(--accent-green)" fillOpacity="0.35" stroke="none" />
        <path d={posisiLinePath} fill="none" stroke="var(--accent-green)" strokeWidth="2.5" />
        {showAvg && <path d={avgLinePath} fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" />}
        {posisiPoints.map((p) => (
          <g key={`pos-${p.d.label}`}>
            <circle cx={p.cx} cy={p.cy} r="4.5" fill="var(--accent-green)" stroke="#fff" strokeWidth="1.5">
              <title>{`${p.d.label} — OSL Posisi: ${formatCompactRupiah(p.d.posisi || 0)}`}</title>
            </circle>
            <text x={p.cx} y={p.cy + 14} textAnchor="middle" className="trend-area-label">
              {formatCompactRupiah(p.d.posisi || 0)}
            </text>
            <text x={p.cx} y={height - 10} textAnchor="middle" className="trend-x-label">
              {p.d.label}
            </text>
          </g>
        ))}
        {showAvg && avgPoints.map((p) => (
          <g key={`avg-${p.d.label}`}>
            <circle cx={p.cx} cy={p.cy} r="4.5" fill="var(--gold-dark)" stroke="#fff" strokeWidth="1.5">
              <title>{`${p.d.label} — OSL AVG: ${formatCompactRupiah(p.d.avg || 0)}`}</title>
            </circle>
            <text x={p.cx} y={p.cy - 10} textAnchor="middle" className="trend-line-label">
              {formatCompactRupiah(p.d.avg || 0)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
