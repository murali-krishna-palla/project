#!/bin/bash
# Production build script

echo "Building VocalFlow Web Application for production..."
echo ""

# Build client
echo "📦 Building frontend..."
cd client
npm install
npm run build

if [ $? -eq 0 ]; then
  echo "✓ Frontend build complete"
else
  echo "✗ Frontend build failed"
  exit 1
fi

cd ..

# Package server
echo ""
echo "📦 Installing server dependencies..."
cd server
npm install --production

if [ $? -eq 0 ]; then
  echo "✓ Server ready for production"
else
  echo "✗ Server build failed"
  exit 1
fi

echo ""
echo "✓ Production build complete!"
echo ""
echo "To start the production server:"
echo "  cd server && NODE_ENV=production npm start"
echo ""
echo "Or with custom port:"
echo "  PORT=8000 NODE_ENV=production npm start"
