import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pingTarget, setPingTarget] = useState('');
  const [pingResult, setPingResult] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);

  // Function to fetch all live system and device telemetry
  const fetchLiveData = async () => {
    try {
      // 1. Fetch Backend Health
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setHealth(healthData);

      // 2. Fetch Real-time Agent Telemetry (CPU, RAM, Disk)
      const telemetryRes = await fetch('/api/telemetry/agent');
      if (telemetryRes.ok) {
        const telemetryData = await telemetryRes.json();
        setTelemetry(telemetryData);
      }

      // 3. Fetch Registered Devices
      const devicesRes = await fetch('/api/devices');
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        setDevices(devicesData);
      }

      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Telemetry polling error:', err);
      setError('Unable to reach NetPulse backend server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    // Set up real-time polling every 5 seconds
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePing = async (e) => {
    e.preventDefault();
    if (!pingTarget) return;
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: pingTarget }),
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err) {
      setPingResult({ error: 'Ping diagnostic failed.' });
    }
    setPingLoading(false);
  };

  return (
    <div className="netpulse-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#1e293b' }}>
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>NetPulse $\text{Dashboard}$</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Real-Time Network Health Monitoring & Secure Telemetry Platform</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: health ? '#22c55e' : '#ef4444', borderRadius: '50%', marginRight: '8px' }}></span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{health ? 'System Operational' : 'Connecting...'}</span>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Host: Nexgen Group Lab</div>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: '#ffeeee', border: '1px solid #f87171', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#b91c1c' }}>
          <strong>Connection Notice:</strong> {error}
        </div>
      )}

      {/* METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* CPU USAGE CARD */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '1rem' }}>CPU Usage</h3>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a' }}>
            {telemetry ? `${telemetry.cpuUsage}%` : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Live Host Telemetry Polling</div>
        </div>

        {/* RAM USAGE CARD */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '1rem' }}>Memory (RAM) Usage</h3>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a' }}>
            {telemetry ? `${telemetry.ramUsagePercent}%` : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
            {telemetry ? `${(telemetry.ramUsed / 1024 / 1024 / 1024).toFixed(2)} GB / ${(telemetry.ramTotal / 1024 / 1024 / 1024).toFixed(2)} GB` : ''}
          </div>
        </div>

        {/* ACTIVE DEVICES CARD */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '1rem' }}>Monitored Devices</h3>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#2563eb' }}>
            {devices.length}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Persistent PostgreSQL Database</div>
        </div>
      </div>

      {/* TOOLS & PING SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>ICMP Network Diagnostic Tool</h3>
          <form onSubmit={handlePing} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Enter IP or Host (e.g. 8.8.8.8)" 
              value={pingTarget}
              onChange={(e) => setPingTarget(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <button type="submit" disabled={pingLoading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {pingLoading ? 'Testing...' : 'Ping Host'}
            </button>
          </form>
          {pingResult && (
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
              {pingResult.error ? (
                <span style={{ color: '#dc2626' }}>{pingResult.error}</span>
              ) : (
                <div>
                  <div><strong>Target:</strong> {pingResult.host}</div>
                  <div><strong>Status:</strong> <span style={{ color: pingResult.alive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{pingResult.alive ? 'Online (Alive)' : 'Offline'}</span></div>
                  <div><strong>Latency:</strong> {pingResult.latency} ms</div>
                  <div><strong>Packet Loss:</strong> {pingResult.packetLoss}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SYSTEM STATUS & SECURITY */}
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Security & Compliance Status</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <li><strong>AES-256-CBC Encryption:</strong> Active for IPs & SNMP keys</li>
            <li><strong>Database:</strong> Neon PostgreSQL Cloud Pooling (SSL)</li>
            <li><strong>Authentication:</strong> JWT & Bcrypt Password Salting</li>
            <li><strong>Rate Limiting:</strong> Enforced on API endpoints</li>
          </ul>
        </div>
      </div>

      {/* REGISTERED DEVICES TABLE */}
      <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Registered Network Nodes</h3>
        {devices.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No devices registered yet. Use the API or dashboard to add endpoints.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.75rem' }}>Device Name</th>
                  <th style={{ padding: '0.75rem' }}>IP Address</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Location</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{d.ip}</td>
                    <td style={{ padding: '0.75rem' }}>{d.type}</td>
                    <td style={{ padding: '0.75rem' }}>{d.location}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;