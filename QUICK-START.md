# Georgia Connects Hub - Quick Start Guide

## 🚀 Quick Start Commands

### Start Everything

```bash
./start-all.sh
```

### Stop Everything

```bash
./stop-all.sh
```

### Check Status

```bash
./status.sh
```

### Health Check

```bash
./health-check.sh
```

## 📋 What Gets Started

| Service         | Port | URL                          | Description         |
| --------------- | ---- | ---------------------------- | ------------------- |
| PostgreSQL      | 5433 | -                            | Database            |
| Redis           | 6379 | -                            | Cache               |
| Backend API     | 3000 | http://localhost:3000/api/v1 | Node.js/Express API |
| Frontend        | 8080 | http://localhost:8080        | React/Vite App      |
| Admin Dashboard | 8081 | http://localhost:8081        | React/Vite Admin    |

## 🔧 Prerequisites

1. **Docker Desktop** - Must be running
2. **Node.js** (v18+) - For running applications
3. **npm** - Package manager

## 📁 Project Structure

```
georgia-connects-hub-main/
├── start-all.sh              # 🚀 Start all services
├── stop-all.sh               # 🛑 Stop all services
├── status.sh                 # 📊 Check service status
├── health-check.sh           # 🏥 Comprehensive health check
├── logs/                     # 📋 Service logs
├── georgia-connects-hub-backend/    # 🔧 Backend API
├── georgia-connects-hub/            # ⚛️ Frontend App
└── georgia-connects-hub-admin/      # 👑 Admin Dashboard
```

## 🎯 Badge Management System

The admin dashboard now includes a complete badge management system:

### Features Added

- ✅ **Badge CRUD Operations** - Create, read, update, delete badges
- ✅ **Badge Assignment** - Assign badges to users with progress tracking
- ✅ **Badge Categories** - Networking, Knowledge, Engagement, Special
- ✅ **Badge Rarity** - Common, Rare, Epic, Legendary
- ✅ **Progress Tracking** - Track user progress toward earning badges
- ✅ **Badge Statistics** - View badge usage and assignment statistics
- ✅ **Admin Interface** - Complete UI for managing badges

### Badge Management Routes

- `GET /admin/badges` - List all badges with filters
- `POST /admin/badges` - Create new badge
- `GET /admin/badges/:id` - Get badge details
- `PUT /admin/badges/:id` - Update badge
- `DELETE /admin/badges/:id` - Delete badge
- `POST /admin/badges/assign` - Assign badge to user
- `DELETE /admin/badges/unassign/:id` - Remove badge assignment
- `GET /admin/badges/stats` - Get badge statistics

## 🔐 Admin Access

**Default Admin Credentials:**

- Email: `admin@georgia-connects-hub.com`
- Password: `admin123`

## 📝 Logs

View service logs:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Admin logs
tail -f logs/admin.log
```

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check what's using ports
lsof -i :3000 :5173 :8081 :5433 :6379

# Kill conflicting processes
./stop-all.sh
./start-all.sh
```

### Database Issues

```bash
# Restart Docker services
cd georgia-connects-hub-backend
docker-compose down
docker-compose up -d
```

### Permission Issues

```bash
# Make scripts executable
chmod +x *.sh
```

## 📚 Additional Documentation

- `README-SCRIPTS.md` - Detailed script documentation
- Individual README files in each application directory

## 🎉 You're Ready!

Run `./start-all.sh` and start developing! All services will be automatically configured and started in the correct order.

## 🎯 Access URLs

- **Frontend**: http://localhost:8080
- **Admin Dashboard**: http://localhost:8081 (with badge management)
- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/api-docs
