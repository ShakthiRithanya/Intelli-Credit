#!/usr/bin/env bash
# Exit on error
set -o errexit

# --- Backend Setup ---
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# --- Frontend Setup ---
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete."
