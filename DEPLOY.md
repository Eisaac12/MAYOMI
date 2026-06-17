# Deployment notes — MAYOMI / One‑Drop OS

This document summarizes how to run the system locally and in a simple
containerized environment.

Local (development)
-------------------
- Start the aggregator and worker using Docker Compose (recommended):

```bash
docker compose up -d
```

- Start the dashboard / surface server (serves dashboard.html):

```bash
npm start
```

- Access the dashboard at: `http://localhost:5000/dashboard`
- Aggregator API: `http://localhost:8081` (used by the dashboard via server proxy)

Environment
-----------
Create a `.env` from `.env.example` and populate provider keys (OpenAI, OpenClaw, Feble5)
before enabling them in production.

Notes
-----
- The dashboard talks to the aggregator through the server proxy (`/api/*`) to
  avoid CORS issues and centralize API key usage.
- If you enable external models, ensure network access and keys are set in `.env`.

Troubleshooting
---------------
- If jobs are queued but never processed, check Redis and worker logs:

```bash
docker compose ps
docker compose logs worker --tail=200
```
