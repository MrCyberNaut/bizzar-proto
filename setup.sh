#!/bin/bash
set -e

echo "🚀 BizzAR Prototype Setup"
echo ""

# Install deps
echo "📦 Installing dependencies..."
npm install

# Check for .env.local
if [ ! -f .env.local ]; then
  echo ""
  echo "⚠️  No .env.local found. Creating from example..."
  cp .env.local.example .env.local
  echo ""
  echo "👉 Edit .env.local and add your 8th Wall app key:"
  echo "   Get it free at: https://www.8thwall.com"
  echo ""
fi

# Check for card.jpg
if [ ! -f public/card.jpg ]; then
  echo "⚠️  No public/card.jpg found. Add your business card photo."
  echo ""
fi

# Check for image-target-cli
if command -v image-target-cli &> /dev/null; then
  if [ -f public/card.jpg ] && [ ! -f public/card.mind ]; then
    echo "🧠 Compiling image target..."
    image-target-cli compile public/card.jpg -o public/card.mind
    echo "✅ card.mind compiled"
  fi
else
  echo "💡 To compile your image target, run:"
  echo "   npx @8thwall/image-target-cli compile public/card.jpg -o public/card.mind"
  echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run the dev server:  npm run dev"
echo "Test on mobile:      npx ngrok http 3000"
echo "Open on phone:       https://YOUR_NGROK_URL/ar"
