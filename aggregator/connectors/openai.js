const axios = require('axios');

async function callOpenAI({prompt,mode}){
  if(!process.env.OPENAI_KEY) throw new Error('OPENAI_KEY not set');
  const url = process.env.OPENAI_URL || 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{role:'user', content: prompt}],
    max_tokens: 800
  };
  const res = await axios.post(url,payload,{ headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` } });
  return res.data;
}

module.exports = { callOpenAI };