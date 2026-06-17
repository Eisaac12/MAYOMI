const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { exec } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
const AGGREGATOR_BASE = process.env.AGGREGATOR_BASE || 'http://localhost:8081';

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${AGGREGATOR_BASE}/health`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'aggregator health proxy failed' });
  }
});

app.get('/api/field', async (req, res) => {
  try {
    const response = await axios.get(`${AGGREGATOR_BASE}/api/field`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'aggregator field proxy failed' });
  }
});

app.post('/api/tool', async (req, res) => {
  try {
    const response = await axios.post(`${AGGREGATOR_BASE}/api/tool`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'aggregator tool proxy failed' });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${AGGREGATOR_BASE}/api/models`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'aggregator models proxy failed' });
  }
});

app.post('/api/mirror', async (req, res) => {
  try {
    const response = await axios.post(`${AGGREGATOR_BASE}/api/mirror`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'aggregator mirror proxy failed' });
  }
});

app.get('/api/job/:id', async (req, res) => {
  try {
    const response = await axios.get(`${AGGREGATOR_BASE}/api/job/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({ error: 'aggregator job lookup proxy failed' });
  }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Dashboard not found');
  }
});

function getLocationFromIp(ip) {
  return axios.get(`http://ip-api.com/json/${ip}`, { timeout: 2000 })
    .then(res => {
      if (res.data && res.data.status === 'success') {
        return { lat: res.data.lat, lon: res.data.lon, city: res.data.city, country: res.data.countryCode };
      }
      throw new Error('failed geo');
    })
    .catch(() => ({
      lat: (Math.random() * 180 - 90),
      lon: (Math.random() * 360 - 180),
      city: 'Unknown',
      country: '??'
    }));
}

function getLocalSouls(callback) {
  const cmd = process.platform === 'win32'
    ? 'netstat -n | findstr ESTABLISHED'
    : "netstat -tan | grep ESTABLISHED | awk '{print $5}' | cut -d: -f1 | sort -u";

  exec(cmd, (error, stdout) => {
    if (error) return callback([]);
    const ips = stdout.split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '0.0.0.0' && !line.startsWith('127.'))
      .map(line => line.split(':')[0]);
    const unique = [...new Set(ips)];
    callback(unique.slice(0, 50));
  });
}

const allSouls = new Map();

function emitSoulAdd(soul) {
  io.emit('soul_add', soul);
}
function emitSoulRemove(ip) {
  io.emit('soul_remove', ip);
}

function spawnRandomGlobalSoul() {
  const randomIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
  if (allSouls.has(randomIp)) return;
  getLocationFromIp(randomIp).then(loc => {
    const soul = {
      id: randomIp,
      ip: randomIp,
      lat: loc.lat,
      lon: loc.lon,
      lastSeen: Date.now(),
      isLocal: false,
      city: loc.city,
      country: loc.country,
      ttl: 30000 + Math.random() * 60000
    };
    allSouls.set(randomIp, soul);
    emitSoulAdd(soul);
    setTimeout(() => {
      if (allSouls.has(randomIp) && !allSouls.get(randomIp).isLocal) {
        allSouls.delete(randomIp);
        emitSoulRemove(randomIp);
      }
    }, soul.ttl);
  }).catch(() => {});
}

function refreshLocalSouls() {
  getLocalSouls((localIps) => {
    const now = Date.now();
    for (const [ip, soul] of allSouls.entries()) {
      if (soul.isLocal && localIps.includes(ip)) {
        soul.lastSeen = now;
      }
    }

    localIps.forEach(ip => {
      if (!allSouls.has(ip)) {
        getLocationFromIp(ip).then(loc => {
          const soul = {
            id: ip,
            ip: ip,
            lat: loc.lat,
            lon: loc.lon,
            lastSeen: Date.now(),
            isLocal: true,
            city: loc.city || 'Local',
            country: loc.country || 'LAN',
            ttl: Infinity
          };
          allSouls.set(ip, soul);
          emitSoulAdd(soul);
        });
      }
    });

    for (const [ip, soul] of allSouls.entries()) {
      if (soul.isLocal && (now - soul.lastSeen > 10000)) {
        allSouls.delete(ip);
        emitSoulRemove(ip);
      }
    }
  });
}

setInterval(() => {
  if (allSouls.size < 3000) spawnRandomGlobalSoul();
}, 2000);

refreshLocalSouls();
setInterval(refreshLocalSouls, 5000);

function generateInfiniteTerrain(bounds) {
  const tiles = [];
  const xMin = Math.floor(bounds.xMin / 256);
  const xMax = Math.ceil(bounds.xMax / 256);
  const yMin = Math.floor(bounds.yMin / 256);
  const yMax = Math.ceil(bounds.yMax / 256);
  for (let x = xMin; x <= xMax; x += 1) {
    for (let y = yMin; y <= yMax; y += 1) {
      const seed = x * 131071 + y;
      const hash = (seed * 9301 + 49297) % 233280;
      tiles.push({ x, y, type: hash % 4, name: `Realm ${Math.abs(seed % 10000)}` });
    }
  }
  return tiles;
}

io.on('connection', socket => {
  for (const soul of allSouls.values()) {
    socket.emit('soul_add', soul);
  }
  socket.on('request_infinite_map', bounds => {
    socket.emit('infinite_terrain', generateInfiniteTerrain(bounds));
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n🔥 INFINITE SOUL MAP OS running at http://localhost:${PORT}`);
  console.log('🌍 Showing all active souls (global simulated + your real netstat connections)');
  console.log('🔄 Map is infinite – pan beyond Earth to discover procedural realms\n');
});
