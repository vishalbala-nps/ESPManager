#!/bin/bash

# A script to manage the ESPManager project

# Exit on any error
set -e

# --- Configuration ---
API_SERVICE="api"

# --- Helper Functions ---
usage() {
  echo "Usage: $0 {up|down|logs|adduser|initdb|shell}"
  echo
  echo "Commands:"
  echo "  up          Build and start all services in the background."
  echo "  down        Stop and remove all services."
  echo "  logs [svc]  Follow logs for all services or a specific one (e.g., api, web)."
  echo "  adduser     Add a new user to the database (prompts for credentials)."
  echo "  initdb      Initialize the database."
  echo "  shell [svc] Open a shell inside a running service (default: api)."
  exit 1
}

# --- Main Commands ---
case "$1" in
  up)
    echo "Building and starting services..."
    docker-compose up --build -d
    echo "Services are up and running."
    ;;
  down)
    echo "Stopping and removing services..."
    docker-compose down
    echo "Services have been stopped."
    ;;
  logs)
    echo "Following logs... (Press Ctrl+C to exit)"
    docker-compose logs -f "$2"
    ;;
  adduser)
    echo "Adding a new user..."
    read -p "Enter username: " username
    read -s -p "Enter password: " password
    echo
    if [ -z "$username" ] || [ -z "$password" ]; then
      echo "Error: Username and password cannot be empty."
      exit 1
    fi
    docker-compose exec "$API_SERVICE" node scripts/addUser.js "$username" "$password"
    ;;
  initdb)
    echo "Initializing the database..."
    docker-compose exec "$API_SERVICE" node scripts/initDB.js
    ;;
  shell)
    SERVICE=${2:-$API_SERVICE}
    echo "Opening a shell in the '$SERVICE' container..."
    docker-compose exec "$SERVICE" sh
    ;;
  *)
    usage
    ;;
esac

exit 0
