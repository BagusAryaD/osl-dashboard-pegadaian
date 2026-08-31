import { useMemo, useRef, useState } from 'react';
import DashHeader from './DashHeader.jsx';
import FilterBar from './FilterBar.jsx';
import KpiGrid from './KpiGrid.jsx';
import Panel from './Panel.jsx';
import DistribusiKategori from './DistribusiKategori.jsx';
import TopNList from './TopNList.jsx';
import TopGrowthPanel from './TopGrowthPanel.jsx';
import TopGrowthOmsetPanel from './TopGrowthOmsetPanel.jsx';
import TopGrowthNasabahPanel from './TopGrowthNasabahPanel.jsx';
import OutletTable from './OutletTable.jsx';
import OslTrendChart from './OslTrendChart.jsx';
import OmsetTrendChart from './OmsetTrendChart.jsx';
import PelunasanTrendChart from './PelunasanTrendChart.jsx';
import { exportHtml, printDashboard } from '../utils/exportUtils.js';
import {
  applyLocationFlagFilter,
  applyKategoriFilter,
  applySegmenFilter,
  computeOslKpi,
  computeOslAvgKpi,
  computeNplLarKpi,
  computeOmsetKpi,
  computeNasabahKpi,
  computeKategoriDistribution,
  computeSegmenDistribution,
  computeKualitasLarComposition,
  computeTopProdukOsl,
  computeTopProdukNpl,
  computeTopProdukLar,
  computeTopProdukOmset,
  computeTopProdukNasabah,
  computeOutletTable,
  computeCabangTable,
  computeOslTrendSeries,
  computeOmsetTrendSeries,
  computePelunasanSeries,
} from '../utils/aggregate.js';

export default function Dashboard({ data, onReset }) {
  // Data bersifat opsional — pakai default array kosong untuk field yang tidak diupload.
  const posisi = data.posisi || [];
  const avg = data.avg || [];
  const lar = data.lar || [];
  const omset = data.omset || [];
  const nasabah = data.nasabah || [];
  const posisiTrend = data.posisiTrend || [];
  const avgTrend = data.avgTrend || [];
  const omsetTrend = data.omsetTrend || [];

  const hasPosisi = posisi.length > 0;
  const hasAvg = avg.length > 0;
  const hasLar = lar.length > 0;
  const hasOmset = omset.length > 0;
  const hasNasabah = nasabah.length > 0;

  // Section dianggap tersedia kalau minimal salah satu sumber datanya ada.
  const availableSections = useMemo(() => {
    const list = [];
    if (hasOmset) list.push('omset');
    if (hasPosisi || hasAvg) list.push('osl');
    if (hasLar) list.push('nplLar');
    if (hasNasabah) list.push('nasabah');
    return list;
  }, [hasOmset, hasPosisi, hasAvg, hasLar, hasNasabah]);

  const [filters, setFilters] = useState({ areaName: '', cabangCode: '', flag: '', kategoriOsl: '', segmen: '' });
  const [visibleSections, setVisibleSections] = useState(() => new Set(availableSections));
  const containerRef = useRef(null);

  const toggleSection = (key) => {
    setVisibleSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Dataset dipakai untuk membangun opsi filter Area/Cabang — pakai yang pertama tersedia,
  // karena semua parser menghasilkan field areaName/cabangCode/cabangName/flag yang konsisten.
  const filterSourceRows = hasPosisi ? posisi : hasAvg ? avg : hasLar ? lar : hasOmset ? omset : nasabah;

  const larLocFiltered = useMemo(
    () => applySegmenFilter(applyLocationFlagFilter(lar, filters), filters.segmen),
    [lar, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );
  const larForKualitas = larLocFiltered;

  const posisiLocFiltered = useMemo(
    () => applySegmenFilter(applyLocationFlagFilter(posisi, filters), filters.segmen),
    [posisi, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );
  const posisiKategoriFiltered = useMemo(
    () => applyKategoriFilter(posisiLocFiltered, filters.kategoriOsl),
    [posisiLocFiltered, filters.kategoriOsl]
  );
  const avgLocFiltered = useMemo(
    () => applyKategoriFilter(applySegmenFilter(applyLocationFlagFilter(avg, filters), filters.segmen), filters.kategoriOsl),
    [avg, filters.areaName, filters.cabangCode, filters.flag, filters.segmen, filters.kategoriOsl]
  );

  const omsetLocFiltered = useMemo(
    () => applySegmenFilter(applyLocationFlagFilter(omset, filters), filters.segmen),
    [omset, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );

  const nasabahLocFiltered = useMemo(
    () => applySegmenFilter(applyLocationFlagFilter(nasabah, filters), filters.segmen),
    [nasabah, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );

  const omsetKpi = useMemo(() => computeOmsetKpi(omsetLocFiltered), [omsetLocFiltered]);
  const oslKpi = useMemo(() => computeOslKpi(posisiKategoriFiltered), [posisiKategoriFiltered]);
  const oslAvgKpi = useMemo(() => computeOslAvgKpi(avgLocFiltered), [avgLocFiltered]);
  const nplLarKpi = useMemo(() => computeNplLarKpi(larLocFiltered), [larLocFiltered]);
  const nasabahKpi = useMemo(() => computeNasabahKpi(nasabahLocFiltered), [nasabahLocFiltered]);

  const distribusi = useMemo(() => computeKategoriDistribution(posisiLocFiltered), [posisiLocFiltered]);
  const segmenOsl = useMemo(() => computeSegmenDistribution(posisiLocFiltered, 'oslBulanIniThnIni'), [posisiLocFiltered]);
  const segmenNpl = useMemo(() => computeSegmenDistribution(larLocFiltered, 'nominalNpl'), [larLocFiltered]);
  const segmenLar = useMemo(() => computeSegmenDistribution(larLocFiltered, 'oslLar'), [larLocFiltered]);
  const segmenOmset = useMemo(() => computeSegmenDistribution(omsetLocFiltered, 'realisasiBlnIniThnIni'), [omsetLocFiltered]);
  const segmenNasabah = useMemo(() => computeSegmenDistribution(nasabahLocFiltered, 'custBulanIniThnIni'), [nasabahLocFiltered]);
  const kualitasLar = useMemo(() => computeKualitasLarComposition(larForKualitas), [larForKualitas]);

  const topProdukOsl = useMemo(() => computeTopProdukOsl(posisiKategoriFiltered), [posisiKategoriFiltered]);
  const topProdukNpl = useMemo(() => computeTopProdukNpl(larLocFiltered), [larLocFiltered]);
  const topProdukLar = useMemo(() => computeTopProdukLar(larLocFiltered), [larLocFiltered]);
  const topProdukOmset = useMemo(() => computeTopProdukOmset(omsetLocFiltered), [omsetLocFiltered]);
  const topProdukNasabah = useMemo(() => computeTopProdukNasabah(nasabahLocFiltered), [nasabahLocFiltered]);

  const oslTrendSeries = useMemo(
    () => computeOslTrendSeries(posisiTrend, avgTrend, filters),
    [posisiTrend, avgTrend, filters.areaName, filters.cabangCode, filters.flag, filters.segmen, filters.kategoriOsl]
  );
  const omsetTrendSeries = useMemo(
    () => computeOmsetTrendSeries(omsetTrend, filters),
    [omsetTrend, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );

  const pelunasanSeries = useMemo(
    () => computePelunasanSeries(posisiTrend, omsetTrend, filters),
    [posisiTrend, omsetTrend, filters.areaName, filters.cabangCode, filters.flag, filters.segmen]
  );

  const outletTable = useMemo(
    () => computeOutletTable(posisiLocFiltered, larLocFiltered, omsetLocFiltered, nasabahLocFiltered),
    [posisiLocFiltered, larLocFiltered, omsetLocFiltered, nasabahLocFiltered]
  );

  const cabangTable = useMemo(
    () => computeCabangTable(posisiLocFiltered, larLocFiltered, omsetLocFiltered, nasabahLocFiltered),
    [posisiLocFiltered, larLocFiltered, omsetLocFiltered, nasabahLocFiltered]
  );

  const contextLabel = filters.cabangCode
    ? (posisiLocFiltered[0]?.cabangName || larLocFiltered[0]?.cabangName || 'Cabang Terpilih')
    : filters.areaName || 'Semua Area';

  const hasOslSection = visibleSections.has('osl');
  const hasNplLar = visibleSections.has('nplLar');
  const hasOmsetSection = visibleSections.has('omset');
  const hasNasabahSection = visibleSections.has('nasabah');
  const top5Count = [hasOmsetSection && hasOmset, hasOslSection && hasPosisi, hasNplLar, hasNplLar, hasNasabahSection].filter(Boolean).length;
  const segmenCount = [hasOmsetSection && hasOmset, hasOslSection && hasPosisi, hasNplLar, hasNplLar, hasNasabahSection].filter(Boolean).length;

  const showOslTrend = hasOslSection && oslTrendSeries.length > 0;
  const showOmsetTrend = hasOmsetSection && omsetTrendSeries.length > 0;
  const showPelunasanTrend = hasOslSection && hasOmsetSection && hasPosisi && hasOmset && pelunasanSeries.length > 0;

  return (
    <div className="app-shell">
      <div className="dash-root" id="dash-print-area" ref={containerRef}>
        <DashHeader contextLabel={contextLabel} />

        <div className="toolbar no-print">
          <button className="btn btn-secondary" onClick={onReset}>Upload Ulang</button>
          <button className="btn btn-gold" onClick={() => exportHtml(containerRef.current)}>Download HTML</button>
          <button className="btn btn-primary" onClick={printDashboard}>Cetak PDF</button>
        </div>

        <FilterBar
          filterSourceRows={filterSourceRows}
          filters={filters}
          setFilters={setFilters}
          visibleSections={visibleSections}
          toggleSection={toggleSection}
          availableSections={availableSections}
        />

        <KpiGrid
          visibleSections={visibleSections}
          omsetKpi={omsetKpi}
          oslKpi={oslKpi}
          oslAvgKpi={oslAvgKpi}
          nplLarKpi={nplLarKpi}
          nasabahKpi={nasabahKpi}
          hasPosisi={hasPosisi}
          hasAvg={hasAvg}
        />

        {showOslTrend && (
          <div className="dash-grid">
            <Panel title="TREN OSL POSISI VS OSL AVG ANTAR BULAN">
              <OslTrendChart data={oslTrendSeries} showAvg={hasAvg} />
            </Panel>
          </div>
        )}

        {showOmsetTrend && (
          <div className="dash-grid">
            <Panel title="TREN OMSET ANTAR BULAN">
              <OmsetTrendChart data={omsetTrendSeries} />
            </Panel>
          </div>
        )}

        {showPelunasanTrend && (
          <div className="dash-grid">
            <Panel title="TREN PELUNASAN ANTAR BULAN">
              <PelunasanTrendChart data={pelunasanSeries} />
            </Panel>
          </div>
        )}

        {hasOslSection && hasPosisi && (
          <div className="dash-grid">
            <Panel title="DISTRIBUSI KATEGORI OSL">
              <DistribusiKategori data={distribusi} />
            </Panel>
          </div>
        )}

        {top5Count > 0 && (
          <div className={`dash-grid cols-${Math.min(top5Count, 5)}`}>
            {hasOmsetSection && hasOmset && (
              <Panel title="TOP 5 PRODUK OMSET">
                <TopNList items={topProdukOmset} mode="nominal" variant="gold" />
              </Panel>
            )}
            {hasOslSection && hasPosisi && (
              <Panel title="TOP 5 PRODUK OSL">
                <TopNList items={topProdukOsl} mode="nominal" />
              </Panel>
            )}
            {hasNplLar && (
              <Panel title="TOP 5 PRODUK NPL">
                <TopNList items={topProdukNpl} mode="nominal" variant="danger" />
              </Panel>
            )}
            {hasNplLar && (
              <Panel title="TOP 5 PRODUK LAR">
                <TopNList items={topProdukLar} mode="nominal" variant="gold" />
              </Panel>
            )}
            {hasNasabahSection && (
              <Panel title="TOP 5 PRODUK NASABAH">
                <TopNList items={topProdukNasabah} mode="count" />
              </Panel>
            )}
          </div>
        )}

        {hasOslSection && hasPosisi && (
          <div className="dash-grid">
            <TopGrowthPanel posisiRowsFiltered={posisiKategoriFiltered} />
          </div>
        )}

        {hasOmsetSection && hasOmset && (
          <div className="dash-grid">
            <TopGrowthOmsetPanel omsetRowsFiltered={omsetLocFiltered} />
          </div>
        )}

        {hasNasabahSection && (
          <div className="dash-grid">
            <TopGrowthNasabahPanel nasabahRowsFiltered={nasabahLocFiltered} />
          </div>
        )}

        {segmenCount > 0 && (
          <div className={`dash-grid cols-${Math.min(segmenCount, 5)}`}>
            {hasOmsetSection && hasOmset && (
              <Panel title="KOMPOSISI SEGMEN — OMSET">
                <DistribusiKategori data={segmenOmset} />
              </Panel>
            )}
            {hasOslSection && hasPosisi && (
              <Panel title="KOMPOSISI SEGMEN — OSL">
                <DistribusiKategori data={segmenOsl} />
              </Panel>
            )}
            {hasNplLar && (
              <Panel title="KOMPOSISI SEGMEN — NPL">
                <DistribusiKategori data={segmenNpl} />
              </Panel>
            )}
            {hasNplLar && (
              <Panel title="KOMPOSISI SEGMEN — LAR">
                <DistribusiKategori data={segmenLar} />
              </Panel>
            )}
            {hasNasabahSection && (
              <Panel title="KOMPOSISI SEGMEN — NASABAH">
                <DistribusiKategori data={segmenNasabah} />
              </Panel>
            )}
          </div>
        )}

        {hasNplLar && (
          <div className="dash-grid">
            <Panel title="KOMPOSISI KUALITAS LAR">
              <DistribusiKategori data={kualitasLar} />
            </Panel>
          </div>
        )}

        <div className="dash-grid">
          <Panel title="RINCIAN PER CABANG (KONSOLIDASI)" className="dash-panel-table print-section-start">
            <OutletTable rows={cabangTable.rows} totalRow={cabangTable.totalRow} visibleSections={visibleSections} nameColumnLabel="Nama Cabang" />
          </Panel>
        </div>

        <div className="dash-grid">
          <Panel title="RINCIAN PER OUTLET" className="dash-panel-table print-section-start">
            <OutletTable rows={outletTable.rows} totalRow={outletTable.totalRow} visibleSections={visibleSections} />
          </Panel>
        </div>

        <div className="dash-footer">
          Dashboard Monitoring OSL, NPL &amp; LAR (v1.4) — diproses sepenuhnya di browser, data tidak dikirim ke server manapun.
        </div>
      </div>
    </div>
  );
}
