#!/bin/bash

# Run the Python backend server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Run the server
echo "Starting Python backend on http://0.0.0.0:8000"
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
