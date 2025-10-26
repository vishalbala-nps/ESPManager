# ESPManager

ESPManager is a full-stack application for managing IoT devices via MQTT. While it is primarily designed for ESP8266/ESP32 devices, it can be used to manage any device that can communicate over the MQTT protocol. The project consists of a Node.js backend API, a React-based web frontend, and uses Docker for easy deployment and management.

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

3.  **Run the installation command:**
    Make the management script executable and run the `install` command. This will build the Docker containers, initialize the database, and prompt you to create an admin user.
    ```bash
    chmod +x manage.sh
    ./manage.sh install
    ```

Once the installation is complete, you can access the web interface at `http://localhost`.

### Management

After the initial installation, you can use the `manage.sh` script to control the application.

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
    ./manage.sh adduser
    ```
    
-   **Uninstall the application:**
    This will stop containers, remove images, and delete the local data volume. **This is a destructive operation.**
    ```bash
    ./manage.sh uninstall
    ```

---

## Configuring a Device

While this project is named ESPManager, it is platform-agnostic. Any device or application that can communicate over MQTT can be integrated. Your device's firmware should be configured to connect to the same MQTT broker as this application and follow the protocol outlined below.

### MQTT Protocol and Topics

Here are the MQTT topics and payloads the ESPManager backend uses to interact with devices.

#### Remote Commands

Your device should subscribe to `device/status/<deviceId>` to listen for the following commands:

-   **Device Reset**
    -   **Topic**: `device/status/<deviceId>`
    -   **Payload**: (blank message)
    -   **Action**: The device should perform a graceful disconnect from MQTT, erase its configuration, and restart.

-   **OTA Firmware Update**
    -   **Topic**: `device/status/<deviceId>`
    -   **Payload**: A JSON message with an `action` and `version`.
        ```json
        {"action": "update", "version": "1.0.1"}
        ```
    -   **Action**: The device should construct a URL and attempt to download the new firmware binary from the ESPManager backend. For this to work, the device needs its own logic to perform an HTTP download and apply the update.
    -   **URL Format**: `http://<updateServer>/api/updates/<version>/download` (where `<updateServer>` is the address of this application).

#### Automatic Status Messages

To provide real-time device state to the web UI, the device should publish status messages to the `device/status/<deviceId>` topic. These messages should be sent with the `retain` flag set to `true`.

-   **Online Status**
    -   **Published**: On successful connection to the MQTT broker.
    -   **Payload**: `{"deviceId": "<deviceId>", "status": "online", "version": "<appVersion>"}`

-   **Updating Status**
    -   **Published**: Just before the firmware update process begins.
    -   **Payload**: `{"deviceId": "<deviceId>", "status": "updating", "version": "<appVersion>"}`

-   **Offline Status (Last Will and Testament)**
    -   **Published**: Automatically by the MQTT broker if the device disconnects ungracefully (e.g., power loss). This should be set as the device's Last Will and Testament (LWT).
    -   **Payload**: `{"deviceId": "<deviceId>", "status": "offline", "version": "<appVersion>"}`

### For ESP8266/ESP32 Users: ESPManagerLibrary

If you are using an ESP8266 or ESP32, you can use the **[ESPManagerLibrary](https://github.com/vishalbala-nps/ESPManagerLibrary)** to simplify development. This companion library handles the entire MQTT protocol for you, providing a robust, callback-driven solution that works seamlessly with this backend.
