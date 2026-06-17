const axios = require('axios');

async function callFeble5({ prompt, mode }) {
  const url = process.env.FEBLE5_URL;
  if (!url) throw new Error('FEBLE5_URL not set');
  const payload = {
    prompt,
    model: process.env.FEBLE5_MODEL || 'feble5-alpha',
    mode: mode || 'creativity'
  };
  const headers = {
    'Content-Type': 'application/json'
  };
  if (process.env.FEBLE5_KEY) {
    headers.Authorization = `Bearer ${process.env.FEBLE5_KEY}`;
  }
  const res = await axios.post(url, payload, { headers, timeout: 20000 });
  return res.data;
}

module.exports = { callFeble5 };