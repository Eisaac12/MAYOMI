const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const connection = new IORedis(process.env.REDIS_URL || 'redis://redis:6379');

async function main(){
  const q = new Queue('agg-jobs',{connection});
  const job = await q.add('test-job',{foo:'bar',time:Date.now()});
  console.log('Enqueued job id',job.id);
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
