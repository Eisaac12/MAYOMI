require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
const execProm = util.promisify(exec);
const parser = require('cron-parser');

const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379', { maxRetriesPerRequest: null });
const scheduledJobs = [];
const workspaceRoot = process.cwd();

function sanitizeShell(command) {
  const allowed = [
    'pwd', 'whoami', 'ls', 'dir', 'git status', 'git branch', 'git log --oneline -5', 'node -v', 'npm -v', 'cat', 'type', 'echo'
  ];
  const normalized = command.trim();
  if (allowed.some(prefix => normalized === prefix || normalized.startsWith(prefix + ' '))) {
    return normalized;
  }
  return null;
}

async function runTerminal(prompt) {
  const match = prompt.match(/(?:command\s*[:=]\s*)(.+)$/i);
  const cmd = match ? match[1].trim() : prompt.trim();
  const safe = sanitizeShell(cmd || 'pwd');
  if (!safe) {
    return { tool:'TERMINAL', error: 'Unsafe or unsupported terminal command. Allowed: pwd, whoami, ls, dir, git status, git branch, git log --oneline -5, node -v, npm -v, cat <file>, echo <text>' };
  }
  try {
    const { stdout, stderr } = await execProm(safe, { cwd: workspaceRoot, timeout: 5000, maxBuffer: 200000 });
    return { tool:'TERMINAL', output: stdout.trim() || stderr.trim() || `Executed ${safe}` };
  } catch (err) {
    return { tool:'TERMINAL', error: `Terminal execution failed: ${err.message}` };
  }
}

async function runFiles(prompt) {
  const readMatch = prompt.match(/(?:cat|type|read)\s+(.+)$/i);
  const listMatch = prompt.match(/(?:ls|dir|list)\s*([\w\-./]*)$/i);
  if (readMatch) {
    const target = readMatch[1].trim();
    const filePath = path.resolve(workspaceRoot, target);
    if (!filePath.startsWith(workspaceRoot)) {
      return { tool:'FILES', error:'Access denied' };
    }
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { tool:'FILES', file: target, content: content.slice(0, 1400) };
    } catch (err) {
      return { tool:'FILES', error: `Cannot read file: ${err.message}` };
    }
  }
  const dir = listMatch && listMatch[1] ? path.resolve(workspaceRoot, listMatch[1].trim()) : workspaceRoot;
  if (!dir.startsWith(workspaceRoot)) {
    return { tool:'FILES', error:'Access denied' };
  }
  try {
    const entries = await fs.readdir(dir, { withFileTypes:true });
    return { tool:'FILES', directory: path.relative(workspaceRoot, dir) || '.', entries: entries.map(e => ({name:e.name,type:e.isDirectory()?'dir':'file'})).slice(0,80) };
  } catch (err) {
    return { tool:'FILES', error: `Cannot list directory: ${err.message}` };
  }
}

async function runBrowser(prompt) {
  const match = prompt.match(/(https?:\/\/[^\s]+)/i);
  const url = match ? match[1] : 'https://example.com';
  try {
    const response = await axios.get(url, { timeout: 8000 });
    const snippet = typeof response.data === 'string' ? response.data.slice(0, 800) : JSON.stringify(response.data).slice(0, 800);
    return { tool:'BROWSER', url, status: response.status, snippet };
  } catch (err) {
    return { tool:'BROWSER', error: `Failed to fetch ${url}: ${err.message}` };
  }
}

async function runApiGateway(prompt) {
  const jsonMatch = prompt.match(/\{[\s\S]*\}/);
  let payload = null;
  try { payload = jsonMatch ? JSON.parse(jsonMatch[0]) : null; } catch (err) { payload = null; }
  let url = payload?.url || prompt.match(/(https?:\/\/[^\s]+)/i)?.[1];
  if (!url) {
    return { tool:'API GATEWAY', error:'No URL found in prompt' };
  }
  try {
    const method = payload?.method || 'GET';
    const headers = payload?.headers || {};
    const body = payload?.body;
    const response = await axios({ method, url, headers, data: body, timeout: 8000 });
    return { tool:'API GATEWAY', url, status: response.status, data: typeof response.data === 'string' ? response.data.slice(0, 800) : response.data };
  } catch (err) {
    return { tool:'API GATEWAY', error: `Request failed: ${err.message}` };
  }
}

function runVoice(prompt) {
  const message = prompt.trim() || 'Voice tool activated in the full-stack reality field.';
  return { tool:'VOICE', message: `VOICE OUTPUT: ${message}` };
}

async function runCron(prompt) {
  const cronMatch = prompt.match(/cron\s*[:=]\s*([^;\n]+)/i);
  const cmdMatch = prompt.match(/command\s*[:=]\s*([^;\n]+)/i);
  if (!cronMatch || !cmdMatch) {
    return { tool:'CRON JOB', error:'Prompt must include cron:<expression> and command:<term>' };
  }
  const expression = cronMatch[1].trim();
  const command = cmdMatch[1].trim();
  if (!sanitizeShell(command)) {
    return { tool:'CRON JOB', error:'Cron command is not allowed or unsafe.' };
  }
  let interval;
  try {
    interval = parser.parseExpression(expression, { currentDate: new Date() });
  } catch (err) {
    return { tool:'CRON JOB', error:`Invalid cron expression: ${err.message}` };
  }
  const next = interval.next();
  const job = { expression, command, next: next.toString(), createdAt: new Date().toISOString() };
  scheduledJobs.push(job);
  setTimeout(async () => {
    try {
      const result = await execProm(command, { cwd: workspaceRoot, timeout: 5000, maxBuffer: 200000 });
      console.log('Cron job executed:', command, result.stdout || result.stderr);
    } catch (err) {
      console.error('Cron job failed:', err.message);
    }
  }, next.getTime() - Date.now());
  return { tool:'CRON JOB', scheduled: true, next: next.toString(), command };
}

const continuumWorker = new Worker('continuum', async job => {
  console.log('Continuum processing', job.id, job.name, job.data);
  return {
    processed: true,
    event: job.data,
    message: `Continuum pulse ${job.data.trigger} processed at ${new Date().toISOString()}`
  };
}, { connection });

const fieldWorker = new Worker('field', async job => {
  console.log('Field processing', job.id, job.name, job.data);
  const tool = (job.data.tool || 'UNKNOWN').toString().trim().toUpperCase();
  const prompt = (job.data.prompt || '').toString();
  switch (tool) {
    case 'TERMINAL': return await runTerminal(prompt);
    case 'FILES': return await runFiles(prompt);
    case 'BROWSER': return await runBrowser(prompt);
    case 'API GATEWAY': return await runApiGateway(prompt);
    case 'VOICE': return runVoice(prompt);
    case 'CRON JOB': return await runCron(prompt);
    default:
      return {
        processed: true,
        tool,
        response: `Tool ${tool} harmonized with the ONE NETWORK FIELD. Prompt=${prompt.slice(0,120)}`
      };
  }
}, { connection });

const handleCompleted = (job, result) => console.log('Job completed', job.queueName, job.id, result);
const handleFailed = (job, err) => console.error('Job failed', job.queueName, job.id, err);

continuumWorker.on('completed', handleCompleted);
continuumWorker.on('failed', handleFailed);
fieldWorker.on('completed', handleCompleted);
fieldWorker.on('failed', handleFailed);

console.log('Worker running (listening to continuum and field queues)');
