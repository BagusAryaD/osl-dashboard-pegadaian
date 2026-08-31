export default function Panel({ title, right, children, className }) {
  return (
    <div className={`dash-panel ${className || ''}`}>
      <div className="dash-panel-header">
        <span>{title}</span>
        {right}
      </div>
      <div className="dash-panel-body">{children}</div>
    </div>
  );
}
