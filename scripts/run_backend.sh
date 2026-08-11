#!/bin/bash
# Start the FastAPI backend on http://127.0.0.1:8000
set -e

cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-python}"
if [ -x ".venv/Scripts/python.exe" ]; then
  PYTHON="$(pwd)/.venv/Scripts/python.exe"   # Windows venv
elif [ -x ".venv/bin/python" ]; then
  PYTHON="$(pwd)/.venv/bin/python"           # macOS / Linux venv
fi

if [ ! -f backend/.env ]; then
  echo "backend/.env is missing - copying from .env.example"
  cp backend/.env.example backend/.env
fi

# Run from backend/ so `app.main` resolves without extra path juggling.
cd backend
exec "$PYTHON" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
