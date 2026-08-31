import { formatCompactRupiah, formatPlainPercent } from '../utils/format.js';

const COLOR_MAP = {
  'AKTIF': 'var(--kat-1)',
  'BERMASALAH': 'var(--kat-3)',
  'BJDPL/MDPL': 'var(--kat-4)',
  'DPP': 'var(--kat-2)',
  'GADAI': 'var(--kat-1)',
  'NON GADAI': 'var(--kat-2)',
  'EMAS': 'var(--gold)',
  'Lancar': 'var(--kat-2)',
  'Dalam Perhatian Khusus': 'var(--kat-5, #f2b400)',
  'Kurang Lancar': 'var(--kat-3)',
  'Diragukan': 'var(--kat-6, #2f6fb0)',
  'Macet': 'var(--kat-4)',
};
const STACK_COLORS = ['var(--kat-2)', 'var(--mid-green)'];

// data: [{ kategori, nominal, persen? }] atau dengan field `stacked: [{label, nominal}]` untuk 1+ baris stacked.
export default function DistribusiKategori({ data }) {
  if (!data.length) return <div className="topn-empty">Tidak ada data untuk filter ini.</div>;
  const max = Math.max(...data.map((d) => d.nominal), 1);
  return (
    <div>
      {data.map((d) => (
        <div className="bar-dist-row" key={d.kategori}>
          <div className="bar-dist-label">
            <span className="name">{d.kategori}</span>
            <span className="val">
              {formatCompactRupiah(d.nominal)}
              {d.persen !== undefined ? ` (${formatPlainPercent(d.persen, 1)})` : ''}
            </span>
          </div>
          {d.stacked ? (
            <div className="bar-dist-track" style={{ display: 'flex' }}>
              {d.stacked.map((s, i) => (
                <div
                  key={s.label}
                  title={`${s.label}: ${formatCompactRupiah(s.nominal)}`}
                  style={{
                    width: `${(s.nominal / max) * 100}%`,
                    background: STACK_COLORS[i % STACK_COLORS.length],
                    height: '100%',
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bar-dist-track">
              <div
                className="bar-dist-fill"
                style={{ width: `${(d.nominal / max) * 100}%`, background: COLOR_MAP[d.kategori] || 'var(--kat-1)' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
