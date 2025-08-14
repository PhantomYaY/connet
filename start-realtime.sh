#!/bin/bash

echo "🚀 Starting Real-time Chat Application..."
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "node_modules/socket.io-client" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install socket.io-client
fi

# Check if server directory exists
if [ ! -d "server" ]; then
    echo "❌ Server directory not found. Please ensure the backend is set up."
    exit 1
fi

# Install backend dependencies if needed
cd server
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Backend .env file not found. Copying from example..."
    cp .env.example .env
    echo "📝 Please edit server/.env with your Firebase credentials"
    echo "   Then restart this script."
    exit 1
fi

# Start backend server in background
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Go back to project root and start frontend
cd ..
echo "⚡ Starting frontend development server..."
echo ""
echo "🌟 Real-time chat will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "💬 Features:"
echo "   ✅ Instant messaging via WebSockets"
echo "   ✅ Real-time typing indicators"
echo "   ✅ Online/offline status"
echo "   ✅ No page reloads needed!"
echo ""

# Start frontend
npm start

# Cleanup: kill backend when frontend stops
echo "🛑 Stopping servers..."
kill $BACKEND_PID 2>/dev/null
echo "✅ Done!"
