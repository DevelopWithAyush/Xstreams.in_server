#!/bin/bash

# Chrome Dependencies Setup Script for Ubuntu/Debian
# Run with: sudo chmod +x setup-chrome-deps.sh && sudo ./setup-chrome-deps.sh

echo "Setting up Chrome dependencies for Puppeteer in production..."

# Update package list
echo "Updating package list..."
apt-get update

# Install required dependencies for Chrome
echo "Installing Chrome dependencies..."
apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    gnupg

# Install Google Chrome (optional but recommended)
echo "Installing Google Chrome..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
apt-get update
apt-get install -y google-chrome-stable

echo "Chrome dependencies installation completed!"
echo "You can now run your Node.js application with Puppeteer."

# Test Chrome installation
echo "Testing Chrome installation..."
if google-chrome-stable --version > /dev/null 2>&1; then
    echo "✅ Google Chrome installed successfully: $(google-chrome-stable --version)"
else
    echo "⚠️  Google Chrome installation may have issues, but dependencies are installed."
fi

echo "Setup complete!" 