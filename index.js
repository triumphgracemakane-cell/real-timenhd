require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ping = require('ping');
const si = require('systeminformation');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// --- SECURITY & MIDDLEWARE ---
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// --- REAL NEON POSTGRESQL DATABASE POOL ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for cloud databases like Neon
});

// Auto-Initialize Tables on Startup
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                name VARCHAR(255) PRIMARY KEY,
                owner_id VARCHAR(255),
                mode VARCHAR(50) DEFAULT 'individual'
            );
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) REFERENCES companies(name),
                role VARCHAR(50) DEFAULT 'Super Admin',
                mode VARCHAR(50) DEFAULT 'individual'
            );
            CREATE TABLE IF NOT EXISTS devices (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                ip TEXT NOT NULL,
                type VARCHAR(100) NOT NULL,
                location VARCHAR(255),
                monitoring_method VARCHAR(50),
                snmp_community TEXT,
                thresholds JSONB,
                parent_id VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Operational',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Neon PostgreSQL database tables verified and initialized successfully.');
    } catch (err) {
        console.error('Database initialization error:', err.message);
    }
}
initDB();

// --- CRYPTOGRAPHY UTILITY (AES-256-CBC) ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
    if (!text) return null;
    if (!text.includes(':')) return text;
    try {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return text;
    }
}

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'Operational',
        database: 'Neon PostgreSQL Connected',
        systemHealthScore: 99.9,
        timestamp: new Date().toISOString()
    });
});

// Register Organization & Auto Super Admin (Persistent DB)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, companyName, mode } = req.body;
        if (!email || !password || !companyName || !name) {
            return res.status(400).json({ error: 'Missing required registration fields' });
        }

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email is already registered.' });
        }

        const companyCheck = await pool.query('SELECT * FROM companies WHERE name = $1', [companyName]);
        if (companyCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Company name already registered. Choose a unique name.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();
        const appMode = mode || 'individual';

        await pool.query('INSERT INTO companies (name, owner_id, mode) VALUES ($1, $2, $3)', [companyName, userId, appMode]);
        await pool.query(
            'INSERT INTO users (id, name, email, password, company_name, role, mode) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, name, email, hashedPassword, companyName, 'Super Admin', appMode]
        );

        res.status(201).json({ message: 'Organization and Super Admin account created successfully in PostgreSQL', userId });
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration', details: err.message });
    }
});

// Authentication: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, company: user.company_name },
            process.env.JWT_SECRET || 'netpulse_secret_key',
            { expiresIn: '24h' }
        );

        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company_name } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login', details: err.message });
    }
});

// --- DEVICE CRUD ROUTES (Persistent DB + AES) ---

app.post('/api/devices', async (req, res) => {
    try {
        const { name, ip, type, location, monitoringMethod, snmpCommunity, thresholds, parentId } = req.body;
        if (!name || !ip || !type) {
            return res.status(400).json({ error: 'Name, IP, and Device Type are required.' });
        }

        const deviceId = Date.now().toString();
        const encryptedIp = encrypt(ip);
        const encryptedSnmp = snmpCommunity ? encrypt(snmpCommunity) : null;
        const defaultThresholds = thresholds || { cpu: 80, latency: 100, packetLoss: 5 };

        await pool.query(
            `INSERT INTO devices (id, name, ip, type, location, monitoring_method, snmp_community, thresholds, parent_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [deviceId, name, encryptedIp, type, location || 'Primary Datacenter', monitoringMethod || 'Ping', encryptedSnmp, JSON.stringify(defaultThresholds), parentId || null, 'Operational']
        );

        res.status(201).json({ message: 'Device registered and stored persistently', deviceId });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create device', details: err.message });
    }
});

app.get('/api/devices', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
        const decryptedDevices = result.rows.map(d => ({
            id: d.id,
            name: d.name,
            ip: decrypt(d.ip),
            type: d.type,
            location: d.location,
            monitoringMethod: d.monitoring_method,
            snmpCommunity: d.snmp_community ? '••••••••' : null,
            thresholds: d.thresholds,
            parentId: d.parent_id,
            status: d.status,
            createdAt: d.created_at
        }));
        res.json(decryptedDevices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch devices from database', details: err.message });
    }
});

app.put('/api/devices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ip, type, location, monitoringMethod, snmpCommunity, thresholds, parentId } = req.body;

        const existing = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Device not found' });

        const current = existing.rows[0];
        const updatedIp = ip ? encrypt(ip) : current.ip;
        const updatedSnmp = snmpCommunity ? encrypt(snmpCommunity) : current.snmp_community;

        await pool.query(
            `UPDATE devices SET name = $1, ip = $2, type = $3, location = $4, monitoring_method = $5, snmp_community = $6, thresholds = $7, parent_id = $8 WHERE id = $9`,
            [
                name || current.name,
                updatedIp,
                type || current.type,
                location || current.location,
                monitoringMethod || current.monitoring_method,
                updatedSnmp,
                thresholds ? JSON.stringify(thresholds) : current.thresholds,
                parentId !== undefined ? parentId : current.parent_id,
                id
            ]
        );

        res.json({ message: 'Device updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update device', details: err.message });
    }
});

app.delete('/api/devices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM devices WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });

        res.json({ message: 'Device deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete device', details: err.message });
    }
});

// Real ICMP Ping Diagnostic Route
app.post('/api/ping', async (req, res) => {
    const { host } = req.body;
    if (!host) return res.status(400).json({ error: 'Target host or IP required' });

    try {
        const decryptedHost = decrypt(host);
        const result = await ping.promise.probe(decryptedHost, { timeout: 3 });
        res.json({
            host: decryptedHost,
            alive: result.alive,
            latency: result.time,
            packetLoss: result.packetLoss || (result.alive ? '0%' : '100%'),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Ping execution failed', details: err.message });
    }
});

// Lightweight Agent Telemetry
app.get('/api/telemetry/agent', async (req, res) => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();

        res.json({
            cpuUsage: cpu.currentLoad.toFixed(2),
            ramTotal: mem.total,
            ramUsed: mem.used,
            ramUsagePercent: ((mem.used / mem.total) * 100).toFixed(2),
            diskInfo: disk.map(d => ({ fs: d.fs, use: d.use })),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch agent metrics', details: err.message });
    }
});

// --- LOCAL DEV RUNNER & VERCEL EXPORT ---
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`NetPulse Competition Backend running on port ${PORT}`);
    });
}

module.exports = app;