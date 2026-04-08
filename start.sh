#!/bin/bash
# Start both server and client in development mode

echo "Starting VocalFlow Web Application..."

# Start server
cd server
npm install
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start client
cd ../client
npm install
npm start &
CLIENT_PID=$!

echo "✓ Server PID: $SERVER_PID"
echo "✓ Client PID: $CLIENT_PID"
echo ""
echo "Server: http://localhost:5000"
echo "Client: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

wait
