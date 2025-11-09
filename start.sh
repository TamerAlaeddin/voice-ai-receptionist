#!/bin/bash

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -9 -f "agent.py" 2>/dev/null || true
pkill -9 -f "app.main" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

echo "Starting services..."

# Start backend API
cd backend
uv run python -m app.main &
sleep 2

# Start agent
SSL_CERT_FILE=$(uv run python -c "import certifi; print(certifi.where())") uv run python agent.py dev &
sleep 2

# Start frontend
cd ../frontend
npm run dev &

echo ""
echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
wait
