#!/bin/bash

# Fix Environment for QuizzMe/CosmicEngine
# This script updates build tools and Python dependencies.

echo "🛠️  Starting Environment Repair..."

# 1. Update Xcode Command Line Tools (C++ Compiler fix)
echo "------------------------------------------------"
echo "1. Checking Xcode Command Line Tools..."
if ! xcode-select -p &>/dev/null; then
    echo "Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "⚠️  Please wait for the installation popup to finish, then run this script again."
    exit 0
else
    echo "✅ Xcode Tools already installed."
    # Reset path to ensure headers are found
    export SDKROOT=$(xcrun --show-sdk-path)
    echo "   SDK Path set to: $SDKROOT"
fi

# 2. Update Homebrew & Python (Optional but recommended)
echo "------------------------------------------------"
echo "2. Checking Python Environment..."
if command -v brew &>/dev/null; then
    echo "Updating Homebrew..."
    brew update
    echo "Ensuring Python 3 is up to date..."
    brew install python@3.11 # Use 3.11 for best compatibility with science libraries
else
    echo "ℹ️  Homebrew not found. Skipping brew updates."
fi

# 3. Clean and Reinstall Python Dependencies
echo "------------------------------------------------"
echo "3. Rebuilding Python Dependencies..."

# Remove old environment to ensure clean state
rm -rf .venv

# Create new virtual env
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and build tools
pip install --upgrade pip wheel setuptools

# Set strict flags for C++ compilation on macOS
export CFLAGS="-stdlib=libc++"
export CPATH="$(xcrun --show-sdk-path)/usr/include"

# Install dependencies (Swisseph requires compilation)
echo "Installing CosmicEngine requirements..."
pip install -r vendor/cosmic-engine-v3_5/astro-precision-horoscope/requirements.txt

if [ $? -eq 0 ]; then
    echo "------------------------------------------------"
    echo "✅ SUCCESS: All dependencies installed correctly."
    echo "   You can now use the real Cosmic Engine."
else
    echo "------------------------------------------------"
    echo "❌ ERROR: Failed to install Python dependencies."
    echo "   Please check the error log above."
fi
