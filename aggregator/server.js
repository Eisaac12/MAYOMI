require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const { callOpenAI } = require('./connectors/openai');
const { callLocal } = require('./connectors/local');
const { callOpenClaw } = require('./connectors/openclaw');
const { callFeble5 } = require('./connectors/feble5');
const client = require('prom-client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(bodyParser.json({limit:'50kb'}));

// simple rate limiter per IP
const limiter = rateLimit({ windowMs: 1000, max: 20 });
app.use(limiter);

// simple API key middleware
app.use((req,res,next)=>{
  const key = req.header('x-api-key') || req.query.key;
  if(process.env.ADMIN_API_KEY && key !== process.env.ADMIN_API_KEY){
    return res.status(401).json({error:'unauthorized'});
  }
  next();
});

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({timeout:5000});
const requestCounter = new client.Counter({ name: 'aggregator_requests_total', help: 'Total requests' });

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', { maxRetriesPerRequest: null });
const continuumQueue = new Queue('continuum', { connection: redisConnection });
const fieldQueue = new Queue('field', { connection: redisConnection });
const systemStats = { continuumCount: 0, toolCount: 0, startedAt: Date.now() };

app.get('/health', (req,res)=>res.json({ok:true,ts:Date.now()}));
app.get('/metrics', async (req,res)=>{ res.set('Content-Type', client.register.contentType); res.end(await client.register.metrics()); })

app.get('/api/field', async (req,res)=>{
  const nodes = 250 + Math.round(Math.random()*750);
  const load = Math.min(1, Math.random()*0.6 + 0.25).toFixed(2);
  const streams = ['Omega Flow', 'Reality Loop', 'Network Sync', 'Soul Pulse', 'Code Mesh'];
  const activeStream = streams[Math.floor(Math.random()*streams.length)];
  const tools = ['GIT','DOCKER','K8S','PYTHON','DATA','AI'];
  const events = [
    `Node ${Math.round(Math.random()*9999)} joined`,
    `${activeStream} updated`,
    `Open source tool ready`
  ];
  res.json({
    fieldName: 'ONE NETWORK FIELD',
    timestamp: Date.now(),
    nodeCount: nodes,
    load,
    activeStream,
    availableTools: tools,
    openSourceMood: 'autopilot harmonize',
    streamEvents: events,
    stats: {
      continuumRequests: systemStats.continuumCount,
      toolRequests: systemStats.toolCount,
      uptimeSeconds: Math.round((Date.now() - systemStats.startedAt) / 1000)
    }
  });
});

function enabledProvider(name){
  if(!name) return null;
  const provider = String(name).toLowerCase();
  switch(provider){
    case 'openai': return process.env.OPENAI_KEY ? 'openai' : null;
    case 'local': return process.env.LOCAL_LLM_URL ? 'local' : null;
    case 'openclaw': return process.env.OPENCLAW_URL ? 'openclaw' : null;
    case 'feble5': return process.env.FEBLE5_URL ? 'feble5' : null;
    case 'simulated': return 'simulated';
    case 'auto': return 'auto';
    case 'mirror': return 'mirror';
    default: return null;
  }
}

function pickProvider(reqMeta){
  const explicit = enabledProvider(reqMeta.provider);
  if(explicit && explicit !== 'auto' && explicit !== 'mirror') return explicit;
  if(process.env.USE_LOCAL === 'true' && enabledProvider('local')) return 'local';
  if(process.env.OPENAI_KEY) return 'openai';
  if(process.env.OPENCLAW_URL) return 'openclaw';
  if(process.env.FEBLE5_URL) return 'feble5';
  if(process.env.LOCAL_LLM_URL) return 'local';
  return 'simulated';
}

function getEnabledProviders() {
  return ['openai','local','openclaw','feble5','simulated'].filter(enabledProvider);
}

async function callProvider(provider, prompt, mode) {
  if(provider === 'openai') return await callOpenAI({ prompt, mode });
  if(provider === 'local') return await callLocal({ prompt, mode });
  if(provider === 'openclaw') return await callOpenClaw({ prompt, mode });
  if(provider === 'feble5') return await callFeble5({ prompt, mode });
  return { text: `Simulated mirrored reality response for prompt: ${prompt.slice(0,200)}` };
}

app.get('/api/models', async (req,res) => {
  res.json({
    providers: [
      { name: 'auto', label: 'Auto select', available: true },
      { name: 'openai', label: 'OpenAI GPT', available: Boolean(process.env.OPENAI_KEY) },
      { name: 'local', label: 'Local LLM', available: Boolean(process.env.LOCAL_LLM_URL) },
      { name: 'openclaw', label: 'OpenClaw', available: Boolean(process.env.OPENCLAW_URL) },
      { name: 'feble5', label: 'Feble5', available: Boolean(process.env.FEBLE5_URL) },
      { name: 'simulated', label: 'Simulated Mirror', available: true },
      { name: 'mirror', label: 'Mirror All Models', available: true }
    ]
  });
});

app.post('/api/route', async (req,res)=>{
  requestCounter.inc();
  const { prompt, mode='default', provider } = req.body || {};
  if(typeof prompt !== 'string' || prompt.length === 0) return res.status(400).json({error:'invalid prompt'});
  if(prompt.length > 50000) return res.status(400).json({error:'prompt too long'});

  const selectedProvider = enabledProvider(provider) === 'auto' ? pickProvider({provider, mode}) : enabledProvider(provider) || pickProvider({provider, mode});
  try{
    let result;
    if(selectedProvider === 'openai'){
      result = await callProvider('openai', prompt, mode);
    } else if(selectedProvider === 'local'){
      result = await callProvider('local', prompt, mode);
    } else if(selectedProvider === 'openclaw'){
      result = await callProvider('openclaw', prompt, mode);
    } else if(selectedProvider === 'feble5'){
      result = await callProvider('feble5', prompt, mode);
    } else {
      result = await callProvider('simulated', prompt, mode);
    }
    const text = result?.choices?.[0]?.message?.content || result?.text || result?.output || JSON.stringify(result);
    res.json({ provider: selectedProvider, text });
  }catch(err){
    console.error('provider error',err?.message||err);
    res.status(502).json({ error: 'provider error', detail: err?.message || '' });
  }
});

app.post('/api/mirror', async (req,res)=>{
  requestCounter.inc();
  const { prompt, mode='default' } = req.body || {};
  if(typeof prompt !== 'string' || prompt.length === 0) return res.status(400).json({error:'invalid prompt'});
  if(prompt.length > 50000) return res.status(400).json({error:'prompt too long'});

  const providers = getEnabledProviders();
  const results = await Promise.allSettled(providers.map(async p => {
    try {
      const response = await callProvider(p, prompt, mode);
      const text = response?.choices?.[0]?.message?.content || response?.text || response?.output || JSON.stringify(response);
      return { provider: p, text, success: true };
    } catch (err) {
      return { provider: p, text: err?.message || 'failed', success: false };
    }
  }));

  const responses = results.map(r => ({
    provider: r.value?.provider || (r.reason?.provider || 'unknown'),
    text: r.value?.text || r.reason?.message || 'error',
    success: r.status === 'fulfilled'
  }));
  const combined = responses.map(r => `--- ${r.provider} ---\n${r.text}`).join('\n\n');
  res.json({ provider: 'mirror', responses, combined });
});

app.post('/api/continuum', async (req,res)=>{
  const { trigger='pulse', metadata={} } = req.body || {};
  try{
    const job = await continuumQueue.add('continuum-step', { trigger, metadata, ts: Date.now() });
    systemStats.continuumCount += 1;
    console.log('Continuum event queued', job.id);
    res.json({ provider:'continuum', status:'queued', jobId: job.id, trigger });
  }catch(err){
    console.error('continuum error', err?.message||err);
    res.status(500).json({ error:'continuum queue failure' });
  }
});

app.post('/api/tool', async (req,res)=>{
  const { tool='UNKNOWN', prompt='' } = req.body || {};
  try{
    const job = await fieldQueue.add('tool-action', { tool, prompt, ts: Date.now() });
    systemStats.toolCount += 1;
    res.json({ provider:'field', status:'queued', jobId: job.id, tool, message: `${tool} request received` });
  }catch(err){
    console.error('tool error', err?.message||err);
    res.status(500).json({ error:'tool queue failure' });
  }
});

app.get('/api/job/:id', async (req,res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'missing job id' });
  try {
    let job = await fieldQueue.getJob(id);
    if (!job) job = await continuumQueue.getJob(id);
    if (!job) return res.status(404).json({ error: 'job not found' });
    const state = await job.getState();
    return res.json({
      jobId: id,
      state,
      completed: state === 'completed',
      failed: state === 'failed',
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
      timestamp: job.finishedOn || job.processedOn || null
    });
  } catch (err) {
    console.error('job lookup error', err?.message || err);
    res.status(500).json({ error: 'job lookup failed' });
  }
});

const port = process.env.AGG_PORT || 8081;
app.listen(port, ()=>console.log('Aggregator listening on',port));
