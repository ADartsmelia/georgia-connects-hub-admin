# Georgia Connects Hub - Service Management Scripts

This document explains how to use the startup and stop scripts for the Georgia Connects Hub project.

## Overview

The Georgia Connects Hub consists of multiple services:

- **Docker Services**: PostgreSQL database and Redis cache
- **Backend**: Node.js/Express API server
- **Frontend**: React/Vite application
- **Admin Dashboard**: React/Vite admin interface

## Scripts

### `start-all.sh` - Complete Startup Script

This script starts all services in the correct order:

1. **Docker Services** (PostgreSQL + Redis)
2. **Backend API** (Port 3000)
3. **Frontend Application** (Port 5173)
4. **Admin Dashboard** (Port 8081)

#### Usage

```bash
./start-all.sh
```

#### Features

- ✅ Checks for already running services
- ✅ Waits for services to be ready before starting the next
- ✅ Provides colored output for easy reading
- ✅ Creates PID files for process tracking
- ✅ Logs all output to `logs/` directory
- ✅ Shows final status and access URLs

#### Access URLs (after startup)

- **Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:8081
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/api-docs

### `stop-all.sh` - Complete Stop Script

This script stops all services in the correct order:

1. **Admin Dashboard** (Port 8081)
2. **Frontend Application** (Port 5173)
3. **Backend API** (Port 3000)
4. **Docker Services** (PostgreSQL + Redis)

#### Usage

```bash
./stop-all.sh
```

#### Features

- ✅ Graceful shutdown with fallback to force kill
- ✅ Cleans up PID files
- ✅ Removes any remaining processes on project ports
- ✅ Provides colored output for easy reading
- ✅ Shows final status after shutdown

## Prerequisites

### Required Software

1. **Docker Desktop** - Must be running before starting
2. **Node.js** (v18 or higher)
3. **npm** (comes with Node.js)

### Required Environment Variables

The scripts automatically set these environment variables for the backend:

- `DB_HOST=localhost`
- `DB_PORT=5433`
- `DB_NAME=georgia_connects_hub`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres123`
- `REDIS_PASSWORD=redis123`
- `JWT_SECRET=your-super-secret-jwt-key-change-in-production`
- `JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production`
- `NODE_ENV=development`

## Directory Structure

```
georgia-connects-hub-main/
├── start-all.sh              # Startup script
├── stop-all.sh               # Stop script
├── logs/                     # Log files directory
│   ├── backend.log           # Backend server logs
│   ├── frontend.log          # Frontend server logs
│   ├── admin.log             # Admin dashboard logs
│   ├── backend.pid           # Backend process ID
│   ├── frontend.pid          # Frontend process ID
│   └── admin.pid             # Admin process ID
├── georgia-connects-hub-backend/    # Backend application
├── georgia-connects-hub/            # Frontend application
└── georgia-connects-hub-admin/      # Admin dashboard
```

## Log Files

All service logs are stored in the `logs/` directory:

- `backend.log` - Backend server output
- `frontend.log` - Frontend development server output
- `admin.log` - Admin dashboard server output

To view logs in real-time:

```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# View admin logs
tail -f logs/admin.log
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :8081  # Admin

# Kill the process
kill -9 <PID>
```

#### 2. Docker Not Running

If Docker services fail to start:

```bash
# Start Docker Desktop first, then run
./start-all.sh
```

#### 3. Services Won't Stop

If services don't stop properly:

```bash
# Force stop all services
./stop-all.sh

# If still running, manually kill processes
pkill -f "georgia-connects-hub"
```

#### 4. Database Connection Issues

If backend can't connect to database:

```bash
# Check Docker services
cd georgia-connects-hub-backend
docker-compose ps

# Restart Docker services
docker-compose down
docker-compose up -d
```

### Manual Service Management

If you need to start/stop individual services:

#### Backend Only

```bash
cd georgia-connects-hub-backend
npm start
```

#### Frontend Only

```bash
cd georgia-connects-hub
npm run dev
```

#### Admin Dashboard Only

```bash
cd georgia-connects-hub-admin
npm run dev
```

#### Docker Services Only

```bash
cd georgia-connects-hub-backend
docker-compose up -d    # Start
docker-compose down      # Stop
```

## Development Workflow

### Typical Development Session

1. **Start all services**: `./start-all.sh`
2. **Develop your features**
3. **View logs**: `tail -f logs/backend.log` (or frontend.log, admin.log)
4. **Stop all services**: `./stop-all.sh`

### Hot Reloading

- **Frontend**: Automatically reloads on file changes
- **Backend**: Restart required for changes (or use nodemon)
- **Admin Dashboard**: Automatically reloads on file changes

## Security Notes

⚠️ **Important**: The scripts use default passwords and development settings. For production:

1. Change all passwords in Docker Compose files
2. Update JWT secrets
3. Use environment-specific configuration files
4. Enable SSL/TLS

## Support

If you encounter issues:

1. Check the log files in `logs/` directory
2. Verify Docker Desktop is running
3. Ensure all required ports (3000, 5173, 8081, 5433, 6379) are available
4. Check that Node.js and npm are properly installed

For additional help, refer to the individual README files in each application directory.
