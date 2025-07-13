#!/bin/bash

# Start backend in background
echo "Starting Rust backend..."
./backend &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
until curl -f http://localhost:3001/health > /dev/null 2>&1; do
    sleep 1
done
echo "Backend is ready!"

# Start frontend
echo "Starting Next.js frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    sleep 1
done
echo "Frontend is ready!"

echo "Markdown Preview is running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID 