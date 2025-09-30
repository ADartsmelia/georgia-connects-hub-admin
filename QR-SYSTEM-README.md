# Georgia Connects Hub - QR Code System

## 🎯 Overview

A complete QR code generation, scanning, and management system for the Georgia Connects Hub. This system consists of three main components:

1. **QR Code Generator** - Standalone web application for generating unique QR codes
2. **QR Scanner** - Admin dashboard page for scanning and validating QR codes
3. **QR Management** - Admin dashboard page for viewing and managing all QR codes

## 📁 Project Structure

```
georgia-connects-hub-main/
├── georgia-qr-generator/          # Standalone QR generator app
│   ├── src/
│   │   ├── App.tsx               # Main QR generator UI
│   │   ├── config.ts             # API configuration
│   │   └── ...
│   └── package.json
│
├── georgia-connects-hub-admin/    # Admin dashboard
│   └── src/
│       └── pages/
│           ├── QRScanner.tsx     # QR scanning page
│           └── QRManagement.tsx  # QR management page
│
└── georgia-connects-hub-backend/  # Backend API
    └── src/
        ├── models/
        │   └── QRCode.js         # QR code database model
        └── routes/
            └── qr.js             # QR code API endpoints
```

## 🚀 Features

### QR Code Generator

- Generate unique QR codes
- Optional user email association
- Download QR codes as PNG images
- Clean, modern UI with real-time preview
- Displays QR code metadata (status, created date, etc.)

### QR Scanner (Admin)

- Scan and validate QR codes
- Real-time validation feedback
- Displays associated user information
- Marks codes as "used" after scanning
- Prevents duplicate scanning

### QR Management (Admin)

- View all generated QR codes
- Filter by status (active, used, expired)
- Pagination support
- Export to CSV
- View detailed statistics
- See who scanned each code and when

## 🛠️ Installation & Setup

### 1. QR Code Generator

```bash
cd georgia-qr-generator
npm install

# Create .env file
echo "VITE_API_URL=https://api.networkinggeorgia.com/api/v1" > .env

# Run development server
npm run dev

# Build for production
npm run build
```

The generator will run on `http://localhost:5174`

### 2. Backend Setup

The backend API endpoints are already integrated into the main backend server. You just need to run the database migration:

```bash
cd georgia-connects-hub-backend

# Run migration to create qr_codes table
npm run migrate
```

### 3. Admin Dashboard

The QR scanner and management pages are already integrated into the admin dashboard. Just rebuild and redeploy:

```bash
cd georgia-connects-hub-admin
npm install
npm run build
```

## 📡 API Endpoints

### Generate QR Code

```http
POST /api/v1/qr/generate
Content-Type: application/json

{
  "userEmail": "user@example.com"  // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "id": "uuid",
    "code": "unique-code",
    "userId": "uuid",
    "status": "active",
    "createdAt": "2025-09-30T..."
  }
}
```

### Scan QR Code (Admin only)

```http
POST /api/v1/qr/scan
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "qr-code-string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "QR code scanned successfully",
  "data": {
    "id": "uuid",
    "code": "unique-code",
    "userId": "uuid",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "status": "used",
    "scannedAt": "2025-09-30T...",
    "createdAt": "2025-09-30T..."
  }
}
```

### Get All QR Codes (Admin only)

```http
GET /api/v1/qr/all?status=active&page=1&limit=50
Authorization: Bearer {token}
```

### Get QR Code by ID (Admin only)

```http
GET /api/v1/qr/:id
Authorization: Bearer {token}
```

### Get QR Statistics (Admin only)

```http
GET /api/v1/qr/stats/overview
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 60,
    "used": 35,
    "expired": 5
  }
}
```

## 🗄️ Database Schema

### `qr_codes` Table

```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(255) UNIQUE NOT NULL,
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  scannedAt TIMESTAMP NULL,
  scannedBy UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSON,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_userId ON qr_codes(userId);
CREATE INDEX idx_qr_codes_status ON qr_codes(status);
CREATE INDEX idx_qr_codes_createdAt ON qr_codes(createdAt);
```

## 🔐 Security

- QR code scanning requires admin authentication
- Each QR code can only be scanned once
- Metadata tracking (IP address, user agent) for audit trail
- Expired QR codes cannot be scanned
- All admin endpoints protected by JWT authentication

## 🎨 Usage Flow

### For QR Code Generation:

1. Open the QR Generator app
2. Optionally enter a user email
3. Click "Generate QR Code"
4. Download the QR code image
5. Distribute to users

### For QR Code Scanning (Admin):

1. Login to admin dashboard
2. Navigate to "QR Scanner"
3. Enter or scan the QR code
4. Click "Scan QR Code"
5. View user information and mark as used

### For QR Code Management (Admin):

1. Login to admin dashboard
2. Navigate to "QR Management"
3. View all QR codes with filters
4. Export to CSV for reporting
5. View statistics and analytics

## 📊 QR Code States

- **active** - QR code is valid and can be scanned
- **used** - QR code has been scanned and cannot be reused
- **expired** - QR code has expired and cannot be scanned

## 🚢 Deployment

### QR Generator (DigitalOcean Apps Platform)

1. Create a new app in DigitalOcean Apps Platform
2. Connect to the repository
3. Set source directory: `georgia-qr-generator`
4. Add environment variable:
   ```
   VITE_API_URL=https://api.networkinggeorgia.com/api/v1
   ```
5. Deploy

### Admin Dashboard

The QR scanner and management pages are already part of the admin dashboard. Just redeploy the admin app after building.

### Backend

The API endpoints are already integrated into the backend. Just restart the backend service after running migrations.

## 🧪 Testing

### Test QR Generation:

```bash
curl -X POST https://api.networkinggeorgia.com/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@example.com"}'
```

### Test QR Scanning:

```bash
curl -X POST https://api.networkinggeorgia.com/api/v1/qr/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"code":"your-qr-code"}'
```

## 📝 Notes

- QR codes are generated with 256-bit cryptographic randomness
- QR codes include error correction level H (high)
- QR code images are 256x256 pixels with margin
- All timestamps are stored in UTC
- CSV export includes all QR code data and associated user information

## 🆘 Troubleshooting

### QR Generator not connecting to API

- Check VITE_API_URL environment variable
- Verify backend is running and accessible
- Check CORS settings on backend

### QR Scanner showing errors

- Ensure admin is logged in
- Check admin JWT token is valid
- Verify QR code exists in database

### QR codes not appearing in management page

- Check database connection
- Verify QR codes table exists
- Check admin authentication

## 📞 Support

For issues or questions, please contact the development team.
