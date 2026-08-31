import { formatCompactRupiah, formatCompactNumber, formatPercent, formatPlainPercent } from '../utils/format.js';

// Kartu KPI growth (MTM/YoY/YTD dsb): angka utama diwarnai hijau (positif) / merah (negatif),
// baris kecil di bawah cuma label pembanding tanpa mengulang angka persennya.
function GrowthCard({ title, growth, baseLabel }) {
  let valueEl;
  if (growth.isNew) {
    valueEl = <div className="kpi-value pos">Baru</div>;
  } else if (growth.value === null) {
    valueEl = <div className="kpi-value">-</div>;
  } else {
    const cls = growth.value > 0 ? 'pos' : growth.value < 0 ? 'neg' : '';
    valueEl = <div className={`kpi-value ${cls}`}>{formatPercent(growth.value)}</div>;
  }
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      {valueEl}
      <div className="kpi-sub">{growth.isNew ? `${baseLabel} (sebelumnya 0)` : baseLabel}</div>
    </div>
  );
}

export default function KpiGrid({ visibleSections, omsetKpi, oslKpi, oslAvgKpi, nplLarKpi, nasabahKpi, hasPosisi, hasAvg }) {
  return (
    <>
      {visibleSections.has('omset') && (
        <>
          <div className="kpi-row-label">RINGKASAN OMSET</div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">TOTAL OMSET BULAN INI</div>
              <div className="kpi-value">{formatCompactRupiah(omsetKpi.totalOmsetBulanIni)}</div>
              <div className="kpi-sub">Realisasi bulan ini</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">TOTAL OMSET S.D. BULAN INI</div>
              <div className="kpi-value">{formatCompactRupiah(omsetKpi.totalOmsetSdBulanIni)}</div>
              <div className="kpi-sub">Kumulatif tahun berjalan</div>
            </div>
            <GrowthCard title="OMSET MTM" growth={omsetKpi.mtm} baseLabel="vs bulan lalu" />
            <GrowthCard title="OMSET YoY" growth={omsetKpi.yoy} baseLabel="vs bulan ini tahun lalu" />
            <GrowthCard title="OMSET S.D. BULAN INI (YoY)" growth={omsetKpi.yoySd} baseLabel="vs s.d. bulan ini tahun lalu" />
          </div>
        </>
      )}

      {visibleSections.has('osl') && (
        <>
          <div className="kpi-row-label">RINGKASAN OSL</div>
          <div className="kpi-grid">
            {hasPosisi && (
              <div className="kpi-card">
                <div className="kpi-title">TOTAL OSL POSISI</div>
                <div className="kpi-value">{formatCompactRupiah(oslKpi.totalOsl)}</div>
                <div className="kpi-sub">Bulan ini</div>
              </div>
            )}
            {hasAvg && (
              <div className="kpi-card">
                <div className="kpi-title">TOTAL OSL AVG</div>
                <div className="kpi-value">{formatCompactRupiah(oslAvgKpi.totalOslAvg)}</div>
                <div className="kpi-sub">Rata-rata bulan ini</div>
              </div>
            )}
            {hasPosisi && (
              <>
                <GrowthCard title="OSL MTM" growth={oslKpi.mtm} baseLabel="vs bulan lalu" />
                <GrowthCard title="OSL YoY" growth={oslKpi.yoy} baseLabel="vs tahun lalu" />
                <GrowthCard title="OSL YTD" growth={oslKpi.ytd} baseLabel="vs akhir tahun lalu" />
              </>
            )}
          </div>
        </>
      )}

      {visibleSections.has('nplLar') && (
        <>
          <div className="kpi-row-label">KUALITAS PINJAMAN (NPL &amp; LAR)</div>
          <div className="kpi-grid">
            <div className="kpi-card kpi-risk">
              <div className="kpi-title">NOMINAL NPL</div>
              <div className="kpi-value">{formatCompactRupiah(nplLarKpi.nominalNpl)}</div>
              <div className="kpi-sub">KL + DR + Macet</div>
            </div>
            <div className="kpi-card kpi-risk">
              <div className="kpi-title">% NPL</div>
              <div className="kpi-value">{nplLarKpi.persenNpl === null ? '-' : formatPlainPercent(nplLarKpi.persenNpl)}</div>
              <div className="kpi-sub">Nominal NPL / OSL Total</div>
            </div>
            <div className="kpi-card kpi-risk">
              <div className="kpi-title">NOMINAL LAR</div>
              <div className="kpi-value">{formatCompactRupiah(nplLarKpi.nominalLar)}</div>
              <div className="kpi-sub">OSL LAR</div>
            </div>
            <div className="kpi-card kpi-risk">
              <div className="kpi-title">% LAR</div>
              <div className="kpi-value">{nplLarKpi.persenLar === null ? '-' : formatPlainPercent(nplLarKpi.persenLar)}</div>
              <div className="kpi-sub">OSL LAR / OSL Total</div>
            </div>
          </div>
        </>
      )}

      {visibleSections.has('nasabah') && (
        <>
          <div className="kpi-row-label">RINGKASAN NASABAH</div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">TOTAL NASABAH BULAN INI</div>
              <div className="kpi-value">{formatCompactNumber(nasabahKpi.totalNasabah)}</div>
              <div className="kpi-sub">Nasabah aktif bulan ini</div>
            </div>
            <GrowthCard title="NASABAH MTM" growth={nasabahKpi.mtm} baseLabel="vs bulan lalu" />
            <GrowthCard title="NASABAH YoY" growth={nasabahKpi.yoy} baseLabel="vs bulan ini tahun lalu" />
            <GrowthCard title="NASABAH YTD" growth={nasabahKpi.ytd} baseLabel="vs akhir tahun lalu" />
          </div>
        </>
      )}
    </>
  );
}
