import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DeviceManager() {
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({ name: '', ip: '', type: 'Router', location: '', monitoringMethod: 'Ping' });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/devices`);
      setDevices(res.data);
    } catch (err) {
      console.error('Error fetching devices', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/devices`, form);
      setForm({ name: '', ip: '', type: 'Router', location: '', monitoringMethod: 'Ping' });
      fetchDevices();
    } catch (err) {
      alert('Error adding device');
    }
  };

  return (
    <div style={{ padding: '25px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2>Device Management & Inventory</h2>
      
      {/* Add Device Form */}
      <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <input type="text" placeholder="Device Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="IP Address (e.g. 192.168.1.1)" value={form.ip} onChange={e => setForm({...form, ip: e.target.value})} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="Router">Router</option>
          <option value="Switch">Switch</option>
          <option value="Server">Server</option>
          <option value="Firewall">Firewall</option>
          <option value="Smartphone">Smartphone</option>
          <option value="IoT Device">IoT Device</option>
        </select>
        <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Device</button>
      </form>

      {/* Device Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>IP Address</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Location</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{d.name}</td>
                <td style={{ padding: '12px', color: '#64748b' }}>{d.ip}</td>
                <td style={{ padding: '12px' }}>{d.type}</td>
                <td style={{ padding: '12px' }}>{d.location}</td>
                <td style={{ padding: '12px', color: '#16a34a', fontWeight: 600 }}>{d.status}</td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No devices registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}