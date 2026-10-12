import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AuthFlow({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [mode, setMode] = useState('individual'); // 'individual' or 'industry'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    role: 'Network Engineer'
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        // Registration endpoint payload
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          mode: mode,
          // First user creating the company automatically becomes Super Admin
          role: 'Super Admin' 
        };

        const res = await axios.post(`${API_URL}/api/auth/register`, payload);
        setSuccessMsg('Company & Super Admin account created successfully! Please sign in.');
        setIsRegister(false);
      } else {
        // Login endpoint payload
        const res = await axios.post(`${API_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password
        });
        
        localStorage.setItem('netpulse_token', res.data.token);
        localStorage.setItem('netpulse_user', JSON.stringify(res.data.user));
        if (onLoginSuccess) onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication action failed. Please check your inputs.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#0f172a' }}>
          {isRegister ? 'Initialize NetPulse Organization' : 'Sign In to NetPulse'}
        </h2>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
        {successMsg && <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Triumph-Grace Makane" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>Company / Organization Name (Unique)</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="NetPulse Global Ltd" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>Deployment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="individual">Individual Mode (Single Admin)</option>
                  <option value="industry">Industry Mode (Continuity Officers Fail-safe)</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="admin@netpulse.com" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="••••••••" />
          </div>

          <button type="submit" style={{ width: '100%', backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '12px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}>
            {isRegister ? 'Register Organization & Super Admin' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.9rem' }}>
            {isRegister ? 'Already have an account? Sign In' : "Don't have an organization account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}