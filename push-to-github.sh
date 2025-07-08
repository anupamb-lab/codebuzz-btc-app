#!/bin/bash

# Script to push backend code to GitHub
# Run this script from the main project directory

echo "🚀 Pushing Backend Code to GitHub..."

cd backend

# Configure Git with correct credentials
git config user.name "growthdev1"
git config user.email "growthdev1@gmail.com"

# Remove existing remote if any
git remote remove origin 2>/dev/null || true

# Add remote with new token
git remote add origin https://growthdev1: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@github.com/growthdev1/fake-mining-backend.git

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo "🔗 Repository: https://github.com/growthdev1/fake-mining-backend"
else
    echo "❌ Failed to push to GitHub"
    echo "💡 Try uploading files manually via GitHub web interface"
fi

cd ..
