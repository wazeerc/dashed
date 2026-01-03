# Dashed - Lightweight Server Dashboard

A minimal, resource-efficient home server dashboard with persistent JSON storage.

![dashed](https://github.com/user-attachments/assets/6e8c45a1-a61b-4f5b-8d2e-990817203a04)

## Features

- **Ultra Lightweight**: ~45MB Docker image (node:alpine)
- **Low Resource Usage**: ~20-30MB RAM, optimized for 1GB RAM systems
- **Minimal Backend**: Express.js server with JSON file storage
- **Persistent Storage**: Services saved to JSON file (shared across devices)
- **Clean UI**: Neo-brutalism style
- **Easy Management**: Add/delete service cards directly in the app
- **Volume Persistence**: Docker volume for data backup/restore

## Quick Start

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

Access at: `http://localhost:3000`

### Docker

Build and run:
```bash
docker build -t dashed .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name dashed dashed
# OR
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name dashed ghcr.io/wazeerc/dashed:latest
```

### Local Development

```bash
npm install
npm start
```

Access at: `http://localhost:3000`

## Usage

1. Click the ➕ button to add a new service
2. Fill in:
   - **Name**: Service name (e.g., "Portainer")
   - **Category**: Optional category (e.g., "Container Management")
   - **URL/IP**: Full URL with protocol (e.g., "http://192.168.1.100:9000")
   - **Icon**: Emoji or character (e.g., 🐳)
3. Click on cards to open services in a new tab
4. Hover over cards and click ❌ to delete

## Resource Efficiency

- **Docker Image**: ~45MB (node:alpine based)
- **Memory Usage**: ~20-30MB RAM
- **CPU Usage**: Minimal (lightweight Express server)
- **Disk Space**: <2MB for application + your data
- **Network**: Zero external requests
- **Data Storage**: Simple JSON file (easy to backup)

## API Endpoints

- `GET /api/services` - Get all services
- `POST /api/services` - Add new service
- `DELETE /api/services/:id` - Delete service

## Data Persistence

Services are stored in `/app/data/services.json` inside the container. The docker-compose configuration automatically mounts `./data` to persist your services across container restarts.

To backup your services:
```bash
cp data/services.json services-backup.json
```
