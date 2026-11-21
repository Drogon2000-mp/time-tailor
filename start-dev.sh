#!/bin/bash

# Time Tailor Development Startup Script
# This script helps start the development server by handling port conflicts

echo "🚀 Starting Time Tailor Server..."
echo ""

# Check if port 5000 is in use
PORT=5000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $PORT is already in use!"
    echo ""
    echo "Options:"
    echo "1) Kill the process and restart"
    echo "2) Exit and handle manually"
    echo ""
    read -p "Choose an option (1 or 2): " choice
    
    case $choice in
        1)
            echo "🔨 Killing process on port $PORT..."
            lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
            echo "✅ Process killed"
            sleep 1
            ;;
        2)
            echo "👋 Exiting. Use 'lsof -ti:5000 | xargs kill -9' to kill the process manually."
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Exiting."
            exit 1
            ;;
    esac
fi

# Build client if dist doesn't exist
if [ ! -d "client/dist" ]; then
    echo "📦 Building client for the first time..."
    npm run build
fi

# Start the server
echo "🎯 Starting server on port $PORT..."
cd server && npm start
