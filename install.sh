#!/bin/bash

# Check for Docker
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker to continue."
    exit
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose could not be found. Please install Docker Compose to continue."
    exit
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found."
    echo "Please copy .env.example to .env and configure it before running this script."
    exit 1
fi

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Build and Start Docker Containers ---
echo "Building and starting Docker containers..."
docker-compose up --build -d

# --- Wait for API to be ready ---
echo "Waiting for the API service to be ready..."
docker-compose exec api node scripts/initDB.js


# --- Add a New User ---
echo "Please enter the credentials for the new user:"
read -p "Username: " username
read -s -p "Password: " password
echo

# Check if username and password were provided
if [ -z "$username" ] || [ -z "$password" ]; then
  echo "Username and password cannot be empty. Aborting user creation."
  exit 1
fi

echo "Adding user '$username' to the database..."
docker-compose exec api node scripts/addUser.js "$username" "$password"

echo "Setup complete! Your application is running."
echo "You can access the web interface at http://localhost"
