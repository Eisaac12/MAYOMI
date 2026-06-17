# Aggregator (Lightweight) — MAYOMI

This repository includes a simple AI aggregator service to route requests to multiple model providers (OpenAI, local LLM) with queueing and metrics.

Files added:
- `aggregator/server.js` — Express API with `/api/route`, `/health`, `/metrics`.
- `aggregator/connectors/openai.js` — OpenAI adapter (axios).
- `aggregator/connectors/local.js` — Local LLM adapter.
- `worker/worker.js` — BullMQ worker scaffold.
- `docker-compose.yml`, `Dockerfile`, `.env.example` — local dev setup.

Quick start (dev):

1. Copy `.env.example` to `.env` and set `ADMIN_API_KEY` and keys.
2. Start services with Docker Compose:

```bash
docker compose up --build
```

3. Call aggregator (use API key):

```bash
curl -X POST http://localhost:8081/api/route -H "Content-Type: application/json" -H "x-api-key: <your_key>" -d '{"prompt":"Hello world"}'
```

Notes:
- This is scaffolding for local development and demonstration. Implement error handling, retries, and provider-specific tuning before production use.
- Use a secrets manager for real deployments; do not place secrets in repository.
