# MAYOMI

![CI](https://github.com/Eisaac12/MAYOMI/actions/workflows/ci.yml/badge.svg)

A minimal scaffold for the MAYOMI project.

One‑Drop OS — Full‑Stack Universal AI Edition
-------------------------------------------------
This branch contains the One‑Drop OS additions: an integrated dashboard,
an AI Mirror (multi-model mirror endpoint), new AI connectors, and
proxy routes that let the dashboard talk to the aggregator safely.

The One‑Drop OS is a conceptual layer that unifies multiple AI providers
and runtime tools into a single control surface (the dashboard).

Quick start
-----------

Prerequisites:
- Node.js (v18+ recommended)
- Docker & docker-compose (for aggregator, worker, redis)

Run services (docker):

```bash
docker compose up -d
```

Start the dashboard / surface server (serves `/dashboard`):

```bash
npm start
# open http://localhost:5000/dashboard
```

Aggregator API (already containerized) runs on port `8081` by default.

Environment
-----------
Copy `.env.example` to `.env` and set secrets (API keys, URLs) as needed.

Run tests
---------

```bash
python -m unittest discover -s tests
```

License: MIT