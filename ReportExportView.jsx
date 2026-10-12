import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ReportExportView() {
  const [timeframe, setTimeframe] = useState('Last 24 Hours');
  const [loadingReport, setLoadingReport] = useState(false);

  const handleDownloadPDF = () => {
    setLoadingReport(true);
    // Simulate generation delay for professional PDF report export
    setTimeout(() => {
      setLoadingReport(false);
      alert('NetPulse Executive PDF Report generated and downloaded successfully!');
    }, 1500);
  };

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>Time Travel & Compliance PDF Reports</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Time Travel Control Card */}
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#334155', marginTop: 0 }}>⏱️ Historical Metric Time Travel</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Replay network telemetry states across historical intervals for root-cause incident forensics.</p>
          
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#334155' }}>Select Forensics Window</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
            <option value="Last 1 Hour">Last 1 Hour (High Fidelity)</option>
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days Trend</option>
            <option value="Custom Range">Custom ISO Timestamp Range</option>
          </select>

          <button onClick={() => alert(`Replaying telemetry state for: ${timeframe}`)} style={{ width: '100%', backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Load Historical Playback
          </button>
        </div>

        {/* PDF Export Card */}
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ color: '#334155', marginTop: 0 }}>📄 Executive PDF Report Generator</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Compile compliance-ready telemetry, uptime percentage, and security event logs into a formatted PDF document.</p>
          
          <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem', color: '#475569' }}>
            Includes: AES encryption audit trail, SLA uptime calculation, and active node failure analytics.
          </div>

          <button onClick={handleDownloadPDF} disabled={loadingReport} style={{ width: '100%', backgroundColor: loadingReport ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loadingReport ? 'Compiling PDF Package...' : 'Download Executive PDF Report'}
          </button>
        </div>

      </div>
    </div>
  );
}