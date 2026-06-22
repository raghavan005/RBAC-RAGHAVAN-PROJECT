#!/bin/bash

echo "🚀 Starting RBAC Development Environment"

# Function to cleanup processes on script exit
cleanup() {
    echo "🛑 Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Trap CTRL+C and call cleanup function
trap cleanup INT TERM

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if ! mongosh --eval 'db.runCommand("ping").ok' localhost/rbac_db --quiet 2>/dev/null; then
    echo "⚠️  MongoDB not running. Please start MongoDB first:"
    echo "   - Install MongoDB: https://www.mongodb.com/docs/manual/installation/"
    echo "   - Start service: sudo systemctl start mongod (Linux) or brew services start mongodb-community (macOS)"
    echo "   - Or use Docker: docker run -d -p 27017:27017 --name mongo mongo:7.0"
    exit 1
fi

echo "✅ MongoDB is running"

# Set environment variables for development
export NODE_ENV=development
export MONGODB_URI=mongodb://localhost:27017/rbac_db
export JWT_SECRET=dev-jwt-secret-key-for-development-32chars-long
export JWT_REFRESH_SECRET=dev-refresh-secret-key-for-development

# Start backend with limited memory
echo "🔧 Starting Backend API (Port 5000)..."
cd backend
NODE_OPTIONS="--max-old-space-size=512" npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend with limited memory  
echo "🌐 Starting Frontend (Port 3000)..."
NODE_OPTIONS="--max-old-space-size=1024" npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Development environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📖 API Docs: http://localhost:5000/api-docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait