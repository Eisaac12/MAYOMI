const axios = require('axios');

async function callOpenClaw({ prompt, mode }) {
  const url = process.env.OPENCLAW_URL;
  if (!url) throw new Error('OPENCLAW_URL not set');
  const payload = {
    input: prompt,
    model: process.env.OPENCLAW_MODEL || 'openclaw-v1',
    mood: mode || 'balanced'
  };
  const headers = {
    'Content-Type': 'application/json'
  };
  if (process.env.OPENCLAW_KEY) {
    headers.Authorization = `Bearer ${process.env.OPENCLAW_KEY}`;
  }
  const res = await axios.post(url, payload, { headers, timeout: 20000 });
  return res.data;
}

module.exports = { callOpenClaw };