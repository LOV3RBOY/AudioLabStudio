#!/bin/bash
set -e

echo "🔧 Setting up AudioLabStudio..."

# Check for required dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is required"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is required"
    echo "Please install PostgreSQL from https://postgresql.org"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is required"
    echo "Please install FFmpeg from https://ffmpeg.org"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Setup database
echo "🗄️ Setting up database..."
createdb audiolabstudio 2>/dev/null || echo "Database already exists"
psql audiolabstudio < server/database/setup.sql

echo "✅ Setup complete!"
echo "Run './start.js' to launch AudioLabStudio"
