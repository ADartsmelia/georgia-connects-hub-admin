#!/bin/bash

echo "🔄 Restarting All Applications..."
echo "=================================="

# Stop all running Node.js apps
echo "Stopping existing applications..."
lsof -ti:3000,5173,5174,5175,8080,8081 | xargs kill -9 2>/dev/null
sleep 2

# Start everything
echo "Starting all applications..."
./start-all-local.sh
