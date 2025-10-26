# ESPManager

ESPManager is a full-stack application for managing IoT devices via MQTT. While it is primarily designed for ESP8266/ESP32 devices, it can be used to manage any device that can communicate over the MQTT protocol. The project consists of a Node.js backend API, a React-based web frontend, and uses Docker for easy deployment and management.

The system allows users to monitor device status, send commands, and manage devices through a web interface.

## Features

- **Remote Device Management**: A web-based UI to remotely manage and monitor your ESP devices.
- **Detailed Device Information**: View real-time stats for each device, including MAC address, IP, firmware version, uptime, and WiFi signal strength in a convenient modal.
- **Over-the-Air (OTA) Updates**: Upload new firmware to your devices directly from the web interface.
- **Version Tagging**: Group firmware releases with tags (e.g., `stable`, `beta`, `default`) for better organization and targeted updates.
- **Configurable MQTT Topics**: Customize the base MQTT topics for status, commands, and info via environment variables for flexible integration.
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
    Copy the example environment file to `.env` and customize it with your settings.
    ```bash
    cp .env.example .env
    ```
    *This step is mandatory. The application will not start without a configured `.env` file.*

    You must configure your MQTT broker details and can optionally change the default MQTT topics:
    - `JWT_SECRET`: A long, random string for securing user sessions.
    - `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`: Your MQTT broker credentials.
    - `MQTT_STATUS_TOPIC`: Base topic for devices to report their status (Default: `device/status`).
    - `MQTT_COMMAND_TOPIC`: Base topic for sending commands to devices (Default: `device/command`).
    - `MQTT_INFO_TOPIC`: Base topic for devices to publish detailed info (Default: `device/info`).

3.  **Run the installation command:**
    Make the management script executable and run the `install` command. This will build the Docker containers, initialize the database, and prompt you to create an admin user.
    ```bash
    chmod +x manage.sh
    ./manage.sh install
    ```

Once the installation is complete, you can access the web interface at `http://localhost`.

### Management

After the initial installation, you can use the `manage.sh` script to control the application.

-   **Start the application:** `./manage.sh up`
-   **Stop the application:** `./manage.sh down`
-   **View logs:** `./manage.sh logs`
-   **Add a new user:** `./manage.sh adduser`
-   **Uninstall the application:** `./manage.sh uninstall` (This is a destructive operation).

---

## MQTT Protocol Guide

For a device to be compatible with ESPManager, it must follow the MQTT protocol defined below. The base topics (`<statusTopic>`, `<commandTopic>`, `<infoTopic>`) are configured in the `.env` file.

### 1. Command Topic: `<commandTopic>/<deviceId>`

The device must **subscribe** to this topic to receive commands from the web UI.

-   **Get Device Info**
    -   **Payload**: `{"action": "info"}`
    -   **Device Action**: The device should publish its detailed stats as a JSON payload to the `<infoTopic>/<deviceId>` topic.

-   **OTA Firmware Update**
    -   **Payload**: `{"action": "update", "version": "default/1.0.1"}`
    -   **Device Action**: The device should initiate its OTA update process. It must parse the `version` string to separate the tag and version number (e.g., "default/1.0.1" -> tag: "default", version: "1.0.1"). It then uses these to construct the download URL in the format `/api/updates/<tag>/<version>/download`.

-   **Factory Reset (for Online Devices)**
    -   **Payload**: `{"action": "delete"}`
    -   **Device Action**: The device should perform a factory reset, erasing its configuration. As part of this process, it should publish a blank, retained message to its own status topic (`<statusTopic>/<deviceId>`) to remove itself from the broker.

### 2. Status Topic: `<statusTopic>/<deviceId>`

The device **publishes** to this topic to report its state. All status messages should be sent with the `retain` flag set to `true`.

-   **Online Status**
    -   **Published**: On successful connection to the MQTT broker.
    -   **Payload**: `{"status": "online", "version": "<tag>/<firmwareVersion>"}`

-   **Updating Status**
    -   **Published**: Just before the firmware update process begins.
    -   **Payload**: `{"status": "updating"}`

-   **Offline Status (Last Will and Testament)**
    -   **Published**: Automatically by the MQTT broker if the device disconnects ungracefully. This should be set as the device's LWT.
    -   **Payload**: `{"status": "offline"}`

-   **Removing Offline Devices**
    -   If a user deletes an offline device from the UI, ESPManager will publish a blank, retained message to this topic to remove it from the broker's retained messages.

### 3. Info Topic: `<infoTopic>/<deviceId>`

The device **publishes** to this topic in response to an `info` command.

-   **Example Payload**:
    ```json
    {
      "deviceId": "Device1",
      "macAddress": "40:91:51:58:94:9D",
      "status": "online",
      "firmwareVersion": "default/2.00",
      "ipAddress": "192.168.1.21",
      "uptime": 230018,
      "wifiSSID": "MyWiFi",
      "wifiStrength": -55,
      "freeHeap": 40048
    }
    ```

### For ESP8266/ESP32 Users: ESPManagerLibrary

If you are using an ESP8266 or ESP32, you can use the **[ESPManagerLibrary](https://github.com/vishalbala-nps/ESPManagerLibrary)** to simplify development. This companion library handles the entire MQTT protocol for you, providing a robust, callback-driven solution that works seamlessly with this backend.
