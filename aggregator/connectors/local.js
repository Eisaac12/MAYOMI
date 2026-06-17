const axios = require('axios');

async function callLocal({prompt,mode}){
  const url = process.env.LOCAL_LLM_URL; // e.g. http://localhost:8000/generate
  if(!url) throw new Error('LOCAL_LLM_URL not set');
  const res = await axios.post(url,{input:prompt});
  return res.data;
}

module.exports = { callLocal };