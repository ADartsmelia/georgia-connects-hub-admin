# Quick Start - Local Development

## 🚀 Start Everything

```bash
./start-all-local.sh
```

This automatically:

- ✅ Checks Docker is installed and running
- ✅ Checks all required ports are available
- ✅ Starts PostgreSQL and Redis in Docker
- ✅ Configures database environment variables
- ✅ Starts all 4 applications
- ✅ Verifies everything is running
- ✅ Shows helpful URLs and commands

## 🛑 Stop Everything

```bash
./stop-all-local.sh
```

Interactive options:

- Keep Docker running (recommended)
- Stop Docker containers
- Restart Docker containers

## 📱 URLs After Starting

| Service         | URL                   |
| --------------- | --------------------- |
| Backend API     | http://localhost:3000 |
| User Frontend   | http://localhost:5173 |
| Admin Dashboard | http://localhost:5175 |
| QR Generator    | http://localhost:5174 |
| PostgreSQL      | localhost:5433        |
| Redis           | localhost:6379        |
| pgAdmin         | http://localhost:5050 |

## 🔧 Troubleshooting

### Port Already in Use

```bash
./stop-all-local.sh
```

### Check Logs

```bash
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/admin.log
tail -f logs/qr-generator.log
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# View Docker logs
docker logs georgia-connects-postgres
docker logs georgia-connects-redis

# Restart Docker containers
cd georgia-connects-hub-backend
docker-compose restart
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it georgia-connects-postgres psql -U postgres -d georgia_connects_hub

# Check database.env is loaded
cat georgia-connects-hub-backend/.env | grep DB_
```

## 🎯 Common Tasks

### View All Running Processes

```bash
ps aux | grep node
```

### Kill Specific Port

```bash
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5175 | xargs kill -9  # Admin
lsof -ti:5174 | xargs kill -9  # QR Gen
```

### Restart Just Backend

```bash
cd georgia-connects-hub-backend
npm run dev
```

### View Docker Container Stats

```bash
docker stats georgia-connects-postgres georgia-connects-redis
```

## ⚙️ Database Credentials

From `database.env`:

```
Host: localhost
Port: 5433
Database: georgia_connects_hub
Username: postgres
Password: postgres123
```

## 🐘 pgAdmin (Database UI)

Access at http://localhost:5050

Credentials:

- Email: admin@georgia-connects-hub.com
- Password: admin123

Add server:

- Host: postgres (Docker network name)
- Port: 5432 (internal Docker port)
- Username: postgres
- Password: postgres123

## 📦 First Time Setup

If starting fresh:

```bash
# Install dependencies
cd georgia-connects-hub-backend && npm install && cd ..
cd georgia-connects-hub && npm install && cd ..
cd georgia-connects-hub-admin && npm install && cd ..
cd georgia-qr-generator && npm install && cd ..

# Start everything
./start-all-local.sh
```

## 🎨 What Each App Does

- **Backend API**: REST API + WebSocket server
- **User Frontend**: Main web application
- **Admin Dashboard**: Admin panel for management
- **QR Generator**: Standalone QR code generator

## 💡 Tips

- Docker containers will persist data between restarts
- Keep Docker running for faster development
- Logs are written to `logs/` directory
- Press `Ctrl+C` in the start script terminal to stop all apps
- Use `./stop-all-local.sh` for clean shutdown
