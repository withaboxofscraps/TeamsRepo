# Student Performance Analysis System — React + Python

## What's inside
- `backend/` — Python Flask API, data in `data.json` (no database needed)
- `frontend/` — React + TypeScript (Vite), runs in any browser

## Run it — 2 terminals, both stay open

### Terminal 1 — backend
```
cd backend
pip install -r requirements.txt
python app.py
```
Leave running. Serves on `http://localhost:5000`.

### Terminal 2 — frontend
```
cd frontend
npm install
npm run dev
```
Leave running. It'll print a local URL — usually `http://localhost:5173`.
Open that link in Chrome. That's your app.

## That's it
No SDK installs, no PATH edits, no emulators. `npm install` pulls everything
the frontend needs (just React + Vite — nothing heavy).

## Demo flow
1. Dashboard tab loads first — bar chart of department averages, list of
   at-risk/failing students below it
2. Students tab — search by name, click a row to open detail
3. In detail view, click "Edit marks" → change a number → Save → status and
   percentage recalculate instantly (backend does the math, frontend just
   displays it)

## If something breaks
- Blank page / "Could not reach the backend" banner → Terminal 1 (Flask)
  isn't running, or you closed it. Restart `python app.py`.
- `npm install` errors → you need Node.js installed (nodejs.org, LTS
  version). Check with `node --version` — if that's not recognized either,
  install Node first, this is the one real dependency.
- Port 5173 or 5000 already in use → close whatever else is using it, or
  just restart your terminal/PC.
