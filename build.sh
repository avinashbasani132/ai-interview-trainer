#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Installing Frontend dependencies..."
# Force install devDependencies in case Render defaults to NODE_ENV=production
npm --prefix frontend-react install --include=dev

echo "==> Building Production React SPA..."
# Prevent OOM errors on Render's 512MB RAM free tier
export NODE_OPTIONS="--max-old-space-size=400"
npm --prefix frontend-react run build

echo "==> Build finished successfully!"
