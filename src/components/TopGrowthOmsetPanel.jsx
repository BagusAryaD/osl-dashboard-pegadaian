import { useMemo, useState } from 'react';
import Panel from './Panel.jsx';
import TopNList from './TopNList.jsx';
import { computeGrowthOmsetByProduk } from '../utils/aggregate.js';

export default function TopGrowthOmsetPanel({ omsetRowsFiltered }) {
  const [mode, setMode] = useState('mtm');
  const growth = useMemo(() => computeGrowthOmsetByProduk(omsetRowsFiltered, mode), [omsetRowsFiltered, mode]);

  return (
    <Panel
      title="TOP &amp; BOTTOM GROWTH PRODUK OMSET"
      right={
        <div className="toggle-pill">
          <button className={mode === 'mtm' ? 'active' : ''} onClick={() => setMode('mtm')}>MTM</button>
          <button className={mode === 'yoy' ? 'active' : ''} onClick={() => setMode('yoy')}>YoY</button>
          <button className={mode === 'yoy-sd' ? 'active' : ''} onClick={() => setMode('yoy-sd')}>YoY S.D.</button>
        </div>
      }
    >
      <div className="dash-grid cols-2" style={{ marginBottom: 0 }}>
        <div>
          <div className="kpi-row-label">TOP 5 PERTUMBUHAN TERTINGGI</div>
          <TopNList items={growth.top} mode="growth" variant="default" />
        </div>
        <div>
          <div className="kpi-row-label">BOTTOM 5 PERTUMBUHAN TERENDAH</div>
          <TopNList items={growth.bottom} mode="growth" variant="danger" />
        </div>
      </div>
      {growth.baru.length > 0 && (
        <div className="baru-note">
          + {growth.baru.length} produk baru muncul (baseline sebelumnya 0), dikecualikan dari ranking di atas:{' '}
          {growth.baru.map((b) => b.produk).join(', ')}
        </div>
      )}
    </Panel>
  );
}
