# ESPManager

ESPManager is a full-stack application designed to manage and communicate with ESP8266/ESP32 devices via MQTT. It consists of a Node.js backend API, a React-based web frontend, and uses Docker for easy deployment and management.

The system allows users to monitor device status, send commands, and manage devices through a web interface.

## Features

- **Remote Device Management**: A web-based UI to remotely manage and monitor your ESP devices.
- **Over-the-Air (OTA) Updates**: Upload new firmware to your devices directly from the web interface.
- **MQTT Console**: A built-in console to send and receive MQTT messages for real-time debugging and interaction.
- **Dockerized**: Comes with `docker-compose.yml` for a simple and reproducible setup.

## Installation and Usage

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ESPManager.git
    cd ESPManager
    ```

2.  **Configure Environment Variables:**
    Copy the example environment file to `.env` and customize it with your settings (e.g., `JWT_SECRET`, MQTT broker details).
    ```bash
    cp .env.example .env
    ```
    *This step is mandatory. The application will not start without a configured `.env` file.*

3.  **Run the installation script:**
    This script builds the Docker containers, initializes the database, and prompts you to create an admin user.
    ```bash
    chmod +x install.sh
    ./install.sh
    ```

Once the installation is complete, you can access the web interface at `http://localhost:8080`.

### Usage (Post-Installation)

After installation, you can use the `manage.sh` script to control the application. Make sure it's executable:
```bash
chmod +x manage.sh
```

-   **Start the application:**
    ```bash
    ./manage.sh up
    ```

-   **Stop the application:**
    ```bash
    ./manage.sh down
    ```

-   **View logs:**
    ```bash
    ./manage.sh logs
    ```

-   **Add a new user:**
    ```bash
    ./manage.sh adduser <username> <password>
    ```
    
-   **Uninstall the application:**
    This will stop containers, remove images, and delete the local data volume. **This is a destructive operation.**
    ```bash
    ./manage.sh uninstall
    ```

---

## ESPManagerLibrary for ESP Devices

This project is designed to work with the `ESPManager` Arduino library, which runs on the ESP devices. It provides a robust, callback-driven solution for handling MQTT connectivity, remote device resets, and Over-the-Air (OTA) firmware updates, abstracting away complex boilerplate code.

**GitHub Repository:** [https://github.com/vishalbala-nps/ESPManagerLibrary](https://github.com/vishalbala-nps/ESPManagerLibrary)
