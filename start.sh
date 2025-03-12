#!/bin/bash

echo "Checking for processes on port 5000..."
sudo lsof -t -i:5000 | xargs -r kill -9
if [ $? -eq 0 ]; then
    echo "Killed process on port 5000"
else
    echo "No process found on port 5000"
fi

echo "Waiting for port to be fully released..."
sleep 5

echo "Starting the application..."
npm run dev
