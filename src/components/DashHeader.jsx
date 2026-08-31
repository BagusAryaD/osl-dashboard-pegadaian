import logo from '../assets/logo.svg';

export default function DashHeader({ contextLabel, kanwilLabel }) {
  return (
    <div className="dash-header">
      <img src={logo} alt="Logo" className="dash-header-logo" />
      <div className="dash-header-center">
        <div className="dash-pill">{kanwilLabel || 'Rekap Data'}</div>
        <h1>Dashboard Monitoring OSL, NPL &amp; LAR</h1>
        <div className="dash-header-sub">Outstanding Loan, Non Performing Loan &amp; Loan at Risk</div>
      </div>
      <div className="dash-header-badge">
        <div className="badge-label">CAKUPAN</div>
        <div className="badge-value">{contextLabel}</div>
      </div>
    </div>
  );
}
