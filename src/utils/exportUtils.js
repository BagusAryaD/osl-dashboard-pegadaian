import cssText from '../styles.css?raw';

export function exportHtml(containerEl, fileName = 'dashboard-osl-npl-lar.html') {
  if (!containerEl) return;
  const inner = containerEl.innerHTML;
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>Dashboard Monitoring OSL, NPL & LAR</title>
<style>
${cssText}
.no-print { display: none !important; }
.scrollable-container { max-height: none !important; overflow: visible !important; }
body { background: #fff; }
</style>
</head>
<body>
<div class="app-shell">${inner}</div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printDashboard() {
  window.print();
}
