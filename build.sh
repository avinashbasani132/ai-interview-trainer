#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Installing Frontend dependencies..."
npm --prefix frontend-react install

echo "==> Building Production React SPA..."
npm --prefix frontend-react run build

echo "==> Build finished successfully!"
