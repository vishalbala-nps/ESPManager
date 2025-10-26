#!/bin/bash

# A script to manage the ESPManager project

# Exit on any error
set -e

# --- Configuration ---
API_SERVICE="api"

# --- Helper Functions ---
usage() {
  echo "Usage: $0 {install|up|down|logs|adduser|initdb|shell|uninstall}"
  echo
  echo "Commands:"
  echo "  install     Run the first-time installation for the project."
  echo "  up          Build and start all services in the background."
  echo "  down        Stop and remove all services."
  echo "  logs [svc]  Follow logs for all services or a specific one (e.g., api, web)."
  echo "  adduser     Add a new user to the database (prompts for credentials)."
  echo "  initdb      Initialize the database."
  echo "  shell [svc] Open a shell inside a running service (default: api)."
  echo "  uninstall   Stop services, remove images, and prune the system."
  exit 1
}

# --- Main Commands ---
case "$1" in
  install)
    echo "Running first-time installation..."

    # Check for Docker
    if ! command -v docker &> /dev/null; then
        echo "Docker could not be found. Please install Docker to continue."
        exit 1
    fi

    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose could not be found. Please install Docker Compose to continue."
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f .env ]; then
        echo "ERROR: .env file not found."
        echo "Please copy .env.example to .env and configure it before running this script."
        exit 1
    fi

    echo "Building and starting services..."
    docker-compose up --build -d

    echo "Initializing the database..."
    docker-compose exec "$API_SERVICE" node scripts/initDB.js

    echo "Adding a new user..."
    read -p "Enter username: " username
    read -s -p "Enter password: " password
    echo
    if [ -z "$username" ] || [ -z "$password" ]; then
      echo "Error: Username and password cannot be empty."
      exit 1
    fi
    docker-compose exec "$API_SERVICE" node scripts/addUser.js "$username" "$password"

    echo "Setup complete! Your application is running."
    echo "You can access the web interface at http://localhost"
    ;;
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
  uninstall)
    echo "This will stop all services, remove their images, delete the data volume, and prune unused Docker data."
    read -p "Are you sure you want to continue? [y/N] " confirm
    if [[ "$confirm" != [yY] ]]; then
      echo "Uninstall cancelled."
      exit 0
    fi
    echo "Stopping services and removing images..."
    docker-compose down --rmi all -v
    
    echo "Removing data directory..."
    rm -rf ./data
    
    echo "Pruning unused Docker images, networks, and build cache..."
    docker system prune -a -f
    
    echo "Uninstall complete."
    ;;
  *)
    usage
    ;;
esac

exit 0
