import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function DeviceMetricsView({ deviceId, onBack }) {
  const [device, setDevice] = useState(null);
  
  // Chart refs for individual metrics
  const cpuChartRef = useRef(null);
  const latencyChartRef = useRef(null);
  const bandwidthChartRef = useRef(null);
  const packetLossChartRef = useRef(null);

  const cpuInstance = useRef(null);
  const latencyInstance = useRef(null);
  const bandwidthInstance = useRef(null);
  const packetLossInstance = useRef(null);

  useEffect(() => {
    // Fetch device details
    axios.get(`${API_URL}/api/devices`).then(res => {
      const found = res.data.find(d => d.id === deviceId);
      if (found) setDevice(found);
    }).catch(err => console.error(err));
  }, [deviceId]);

  // Initialize Charts
  useEffect(() => {
    if (!cpuChartRef.current) return;

    // 1. CPU Utilization Line Chart
    cpuInstance.current = new Chart(cpuChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'CPU Usage (%)', data: [], borderColor: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.1)', fill: true, tension: 0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Latency RTT Line Chart
    latencyInstance.current = new Chart(latencyChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Latency RTT (ms)', data: [], borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Bandwidth Dual Line Chart
    bandwidthInstance.current = new Chart(bandwidthChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Inbound (Mbps)', data: [], borderColor: '#9333ea', tension: 0.3 },
          { label: 'Outbound (Mbps)', data: [], borderColor: '#ea580c', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // 4. Packet Loss Line Chart
    packetLossInstance.current = new Chart(packetLossChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Packet Loss (%)', data: [], borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    // Simulated Real-Time Data Stream updater
    const timer = setInterval(async () => {
      const timeLabel = new Date().toLocaleTimeString();
      const cpuVal = (Math.random() * 20 + 35).toFixed(1);
      const latVal = (Math.random() * 5 + 12).toFixed(1);
      const inBand = (Math.random() * 50 + 100).toFixed(1);
      const outBand = (Math.random() * 30 + 70).toFixed(1);
      const dropVal = (Math.random() * 0.1).toFixed(2);

      // Update CPU Chart
      if (cpuInstance.current) {
        if (cpuInstance.current.data.labels.length > 10) {
          cpuInstance.current.data.labels.shift();
          cpuInstance.current.data.datasets[0].data.shift();
        }
        cpuInstance.current.data.labels.push(timeLabel);
        cpuInstance.current.data.datasets[0].data.push(cpuVal);
        cpuInstance.current.update('none');
      }

      // Update Latency Chart
      if (latencyInstance.current) {
        if (latencyInstance.current.data.labels.length > 10) {
          latencyInstance.current.data.labels.shift();
          latencyInstance.current.data.datasets[0].data.shift();
        }
        latencyInstance.current.data.labels.push(timeLabel);
        latencyInstance.current.data.datasets[0].data.push(latVal);
        latencyInstance.current.update('none');
      }

      // Update Bandwidth Chart
      if (bandwidthInstance.current) {
        if (bandwidthInstance.current.data.labels.length > 10) {
          bandwidthInstance.current.data.labels.shift();
          bandwidthInstance.current.data.datasets[0].data.shift();
          bandwidthInstance.current.data.datasets[1].data.shift();
        }
        bandwidthInstance.current.data.labels.push(timeLabel);
        bandwidthInstance.current.data.datasets[0].data.push(inBand);
        bandwidthInstance.current.data.datasets[1].data.push(outBand);
        bandwidthInstance.current.update('none');
      }

      // Update Packet Loss Chart
      if (packetLossInstance.current) {
        if (packetLossInstance.current.data.labels.length > 10) {
          packetLossInstance.current.data.labels.shift();
          packetLossInstance.current.data.datasets[0].data.shift();
        }
        packetLossInstance.current.data.labels.push(timeLabel);
        packetLossInstance.current.data.datasets[0].data.push(dropVal);
        packetLossInstance.current.update('none');
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      if (cpuInstance.current) cpuInstance.current.destroy();
      if (latencyInstance.current) latencyInstance.current.destroy();
      if (bandwidthInstance.current) bandwidthInstance.current.destroy();
      if (packetLossInstance.current) packetLossInstance.current.destroy();
    };
  }, []);

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <button onClick={onBack} style={{ background: '#e2e8f0', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>← Back to Dashboard</button>
          <h2 style={{ color: '#0f172a', margin: 0 }}>{device ? `${device.name} (${device.ip})` : 'Loading Device Telemetry...'}</h2>
        </div>
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' }}>
          ● Live Monitored
        </div>
      </div>

      {/* Grid of 4 Core Metric Graphs (Expandable to full 12) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '300px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>1. CPU Utilization (%)</h4>
          <div style={{ height: '230px' }}><canvas ref={cpuChartRef}></canvas></div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '300px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>2. Latency RTT (ms)</h4>
          <div style={{ height: '230px' }}><canvas ref={latencyChartRef}></canvas></div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '300px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>3. Bandwidth Rates Up/Down (Mbps)</h4>
          <div style={{ height: '230px' }}><canvas ref={bandwidthChartRef}></canvas></div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: '300px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>4. Packet Loss Rate (%)</h4>
          <div style={{ height: '230px' }}><canvas ref={packetLossChartRef}></canvas></div>
        </div>

      </div>
    </div>
  );
}