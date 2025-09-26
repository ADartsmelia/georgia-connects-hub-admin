# 🚀 Georgia Connects Hub - Production Deployment Guide

## 📋 Overview

This guide covers deploying the Georgia Connects Hub application to production servers. The application consists of:

- **Backend API** (Node.js/Express)
- **User Frontend** (React/Vite)
- **Admin Dashboard** (React/Vite)
- **Database** (PostgreSQL)
- **Cache** (Redis)

## 🖥️ Server Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 22.04 LTS

## 🔧 Prerequisites

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Install Node.js 22.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Domain & SSL Setup

```bash
# Point your domain to server IP
# Configure Nginx for SSL
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com
```

## 📦 Application Deployment

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/georgia-connects-hub.git
cd georgia-connects-hub
```

### 2. Environment Configuration

#### Backend Environment (.env)

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=georgia_connects_hub
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.yourdomain.com

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="Georgia Connects Hub"

# Frontend URLs
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# Security
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (.env.production)

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME="Georgia Connects Hub"
VITE_APP_VERSION="1.0.0"
```

#### Admin Environment (.env.production)

```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME="Georgia Connects Hub Admin"
VITE_APP_VERSION="1.0.0"
```

### 3. Database Setup

```bash
# Start database services
cd georgia-connects-hub-backend
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 30

# Run migrations
npm run migrate

# Seed initial data
npm run seed

# Insert agenda data
npm run insert-agenda
```

### 4. Build Applications

```bash
# Build Backend
cd georgia-connects-hub-backend
npm ci --production
npm run build

# Build User Frontend
cd ../georgia-connects-hub
npm ci
npm run build

# Build Admin Dashboard
cd ../georgia-connects-hub-admin
npm ci
npm run build
```

## 🌐 Nginx Configuration

### 1. Main Domain (User Frontend)

```nginx
# /etc/nginx/sites-available/georgia-connects-hub
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/georgia-connects-hub/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. API Domain

```nginx
# /etc/nginx/sites-available/api.georgia-connects-hub
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Admin Domain

```nginx
# /etc/nginx/sites-available/admin.georgia-connects-hub
server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    root /var/www/georgia-connects-hub-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/georgia-connects-hub /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.georgia-connects-hub /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.georgia-connects-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Process Management

### 1. PM2 Configuration

```bash
# Install PM2
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'georgia-connects-api',
      script: 'src/server.js',
      cwd: '/var/www/georgia-connects-hub-backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      log_file: '/var/log/pm2/api-combined.log',
      time: true
    }
  ]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Systemd Service (Alternative)

```bash
# Create systemd service
sudo tee /etc/systemd/system/georgia-connects-api.service << EOF
[Unit]
Description=Georgia Connects Hub API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/georgia-connects-hub-backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable georgia-connects-api
sudo systemctl start georgia-connects-api
```

## 📁 File Structure

```
/var/www/
├── georgia-connects-hub/          # User frontend build
│   └── dist/
├── georgia-connects-hub-admin/    # Admin dashboard build
│   └── dist/
├── georgia-connects-hub-backend/  # Backend source
│   ├── src/
│   ├── node_modules/
│   └── .env
└── logs/                          # Application logs
    ├── api-error.log
    ├── api-out.log
    └── api-combined.log
```

## 🔒 Security Considerations

### 1. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Database Security

```bash
# Change default passwords
# Enable SSL connections
# Restrict database access to localhost only
# Regular security updates
```

### 3. Application Security

- Use strong JWT secrets
- Enable HTTPS everywhere
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

## 📊 Monitoring & Logging

### 1. Log Management

```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
sudo tee /etc/logrotate.d/georgia-connects-hub << EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 2. Health Checks

```bash
# Create health check script
cat > /usr/local/bin/health-check.sh << EOF
#!/bin/bash
curl -f http://localhost:3000/api/v1/health || exit 1
EOF

chmod +x /usr/local/bin/health-check.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/health-check.sh" | crontab -
```

## 🚀 Deployment Script

### Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Build applications
echo "📦 Building applications..."
cd georgia-connects-hub-backend && npm ci --production
cd ../georgia-connects-hub && npm ci && npm run build
cd ../georgia-connects-hub-admin && npm ci && npm run build

# Copy builds to web directory
echo "📁 Copying builds..."
sudo cp -r georgia-connects-hub/dist/* /var/www/georgia-connects-hub/
sudo cp -r georgia-connects-hub-admin/dist/* /var/www/georgia-connects-hub-admin/

# Restart services
echo "🔄 Restarting services..."
pm2 restart georgia-connects-api
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
```

## 🔧 Maintenance

### Regular Tasks

- **Daily**: Check logs for errors
- **Weekly**: Review security updates
- **Monthly**: Database maintenance
- **Quarterly**: Full security audit

### Backup Strategy

```bash
# Database backup
pg_dump georgia_connects_hub > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/
```

## 📞 Support

For deployment issues or questions:

- Check logs: `/var/log/pm2/`
- Monitor services: `pm2 status`
- Test endpoints: `curl https://api.yourdomain.com/api/v1/health`

---

**Last Updated**: January 2025
**Version**: 1.0.0
