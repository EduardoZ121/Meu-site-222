# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
Remake Pixel is an AI-powered image/video generation web platform with a React frontend (CRA via CRACO) and Python FastAPI backend, backed by MongoDB.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| **Frontend** | `cd /workspace && yarn start` | 3000 | CRA/CRACO dev server |
| **Backend** | `cd /workspace/backend && python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload` | 8000 | FastAPI + uvicorn |
| **MongoDB** | `sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log` | 27017 | Must start before backend |

### Key caveats

- **Frontend `src/` is inside `frontend-completo.zip`**: The zip must be extracted and `frontend/src` copied to `/workspace/src` before the frontend can run. The update script handles this automatically.
- **`emergentintegrations==0.1.0`** in `backend/requirements.txt` is not available on PyPI and is not imported anywhere in the backend code. Install backend deps with: `pip3 install $(grep -v emergentintegrations backend/requirements.txt | tr '\n' ' ')`. Additionally, `replicate`, `stripe`, `openai`, `Pillow`, and `httpx` are needed but not listed in requirements.txt.
- **Backend `.env`** must exist at `/workspace/backend/.env` with at least `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAILS`, and `APP_PUBLIC_URL`.
- **Frontend `.env`** must exist at `/workspace/.env` with `REACT_APP_BACKEND_URL=http://localhost:8000`.
- External API keys (`REPLICATE_API_TOKEN`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`) are required for AI generation and payment flows but the server starts without them.
- Backend tests (`pytest tests/`) require the backend server to be running since they make HTTP requests to the API.
- The `@emergentbase/visual-edits` dev dependency in `package.json` is fetched from a custom URL and may fail; it's gracefully skipped in `craco.config.js` if missing.

### Lint / Test / Build

- **Backend lint**: `cd /workspace/backend && flake8 server.py --max-line-length=120`
- **Backend tests**: `cd /workspace/backend && REACT_APP_BACKEND_URL=http://localhost:8000 pytest tests/test_remake_pixel.py -v` (requires running backend)
- **Frontend lint**: Built into CRA/CRACO — warnings shown during `yarn start` / `yarn build`
- **Frontend build**: `cd /workspace && yarn build`
