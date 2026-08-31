import { useState } from 'react';
import UploadManager from './components/UploadManager.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [data, setData] = useState(null);

  if (!data) {
    return (
      <div className="app-shell uploading">
        <UploadManager onReady={setData} />
      </div>
    );
  }

  return <Dashboard data={data} onReset={() => setData(null)} />;
}
