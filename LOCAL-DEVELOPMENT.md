# Local Development Guide

## 🚀 Quick Start

### Option 1: Start All Applications at Once (Recommended)

```bash
./start-all-local.sh
```

This will start:

- Backend API on `http://localhost:3000`
- User Frontend on `http://localhost:5173`
- Admin Dashboard on `http://localhost:5175`
- QR Generator on `http://localhost:5174`

Press `Ctrl+C` to stop all applications.

### Option 2: Stop All Applications

```bash
./stop-all-local.sh
```

## 📱 Application URLs

| Application     | URL                   | Port |
| --------------- | --------------------- | ---- |
| Backend API     | http://localhost:3000 | 3000 |
| User Frontend   | http://localhost:5173 | 5173 |
| Admin Dashboard | http://localhost:5175 | 5175 |
| QR Generator    | http://localhost:5174 | 5174 |

## 📋 Starting Applications Individually

### Backend API

```bash
cd georgia-connects-hub-backend
npm run dev
```

### User Frontend

```bash
cd georgia-connects-hub
npm run dev
```

### Admin Dashboard

```bash
cd georgia-connects-hub-admin
npm run dev
```

### QR Generator

```bash
cd georgia-qr-generator
npm run dev
```

## 📝 Logs

When using `start-all-local.sh`, logs are written to:

- `logs/backend.log`
- `logs/frontend.log`
- `logs/admin.log`
- `logs/qr-generator.log`

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" errors, stop all applications first:

```bash
./stop-all-local.sh
```

### Dependencies Not Installed

If you get module not found errors:

```bash
# For each application
cd [app-directory]
npm install
cd ..
```

### Database Connection Issues

Make sure your database is running and environment variables are set correctly in:

- `georgia-connects-hub-backend/.env`

## 🧪 Testing the QR System

1. **Generate a QR Code:**

   - Open http://localhost:5174
   - Optionally enter a user email
   - Click "Generate QR Code"
   - Download the QR code

2. **Scan the QR Code:**

   - Open http://localhost:5175 (Admin Dashboard)
   - Login with admin credentials
   - Navigate to "QR Scanner"
   - Enter the QR code
   - Click "Scan QR Code"

3. **View QR Codes:**
   - In Admin Dashboard, navigate to "QR Management"
   - View all QR codes and their statuses

## ⚙️ Environment Variables

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=georgia_connects
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

### Admin Dashboard

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### QR Generator

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 🛠️ Development Tips

- Use the browser console to debug API calls
- Backend API documentation available at http://localhost:3000/api-docs
- Hot reload is enabled for all frontend applications
- Backend restarts automatically on code changes (if using nodemon)
