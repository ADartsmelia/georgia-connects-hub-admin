#!/bin/bash

# Georgia Connects Hub - Production Deployment Script
# This script automates the deployment process for production servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="georgia-connects-hub"
BACKEND_DIR="georgia-connects-hub-backend"
FRONTEND_DIR="georgia-connects-hub"
ADMIN_DIR="georgia-connects-hub-admin"
WEB_ROOT="/var/www"
LOG_DIR="/var/log/$PROJECT_NAME"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
    
    # Check if required commands exist
    local commands=("node" "npm" "docker" "docker-compose" "git" "nginx")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 22 ]; then
        log_error "Node.js version 22 or higher is required"
        exit 1
    fi
    
    log_success "All requirements met"
}

setup_directories() {
    log_info "Setting up directories..."
    
    sudo mkdir -p $WEB_ROOT/$PROJECT_NAME
    sudo mkdir -p $WEB_ROOT/$FRONTEND_DIR
    sudo mkdir -p $WEB_ROOT/$ADMIN_DIR
    sudo mkdir -p $LOG_DIR
    
    # Set proper permissions
    sudo chown -R $USER:$USER $WEB_ROOT/$PROJECT_NAME
    sudo chown -R $USER:$USER $WEB_ROOT/$FRONTEND_DIR
    sudo chown -R $USER:$USER $WEB_ROOT/$ADMIN_DIR
    sudo chown -R $USER:$USER $LOG_DIR
    
    log_success "Directories created"
}

deploy_backend() {
    log_info "Deploying backend..."
    
    cd $BACKEND_DIR
    
    # Install dependencies
    npm ci --production
    
    # Copy to web directory
    sudo cp -r . $WEB_ROOT/$PROJECT_NAME/
    sudo chown -R $USER:$USER $WEB_ROOT/$PROJECT_NAME
    
    # Create production environment file if it doesn't exist
    if [ ! -f "$WEB_ROOT/$PROJECT_NAME/.env.production" ]; then
        log_warning "Creating production environment file..."
        cp ../env.production.template $WEB_ROOT/$PROJECT_NAME/.env.production
        log_warning "Please update $WEB_ROOT/$PROJECT_NAME/.env.production with your actual values"
    fi
    
    log_success "Backend deployed"
}

deploy_frontend() {
    log_info "Deploying user frontend..."
    
    cd ../$FRONTEND_DIR
    
    # Install dependencies
    npm ci
    
    # Build for production
    npm run build
    
    # Copy build to web directory
    sudo cp -r dist/* $WEB_ROOT/$FRONTEND_DIR/
    sudo chown -R $USER:$USER $WEB_ROOT/$FRONTEND_DIR
    
    log_success "User frontend deployed"
}

deploy_admin() {
    log_info "Deploying admin dashboard..."
    
    cd ../$ADMIN_DIR
    
    # Install dependencies
    npm ci
    
    # Build for production
    npm run build
    
    # Copy build to web directory
    sudo cp -r dist/* $WEB_ROOT/$ADMIN_DIR/
    sudo chown -R $USER:$USER $WEB_ROOT/$ADMIN_DIR
    
    log_success "Admin dashboard deployed"
}

setup_database() {
    log_info "Setting up database..."
    
    cd $WEB_ROOT/$PROJECT_NAME
    
    # Start database services
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    # Wait for services to be ready
    log_info "Waiting for database services to be ready..."
    sleep 30
    
    # Run migrations
    npm run migrate
    
    # Seed initial data
    npm run seed
    
    # Insert agenda data
    npm run insert-agenda
    
    log_success "Database setup completed"
}

setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$PROJECT_NAME << EOF
# User Frontend
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root $WEB_ROOT/$FRONTEND_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    root $WEB_ROOT/$ADMIN_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_success "Nginx configuration updated"
}

setup_pm2() {
    log_info "Setting up PM2 process manager..."
    
    # Install PM2 globally if not already installed
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Create PM2 ecosystem file
    cat > $WEB_ROOT/$PROJECT_NAME/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '$PROJECT_NAME-api',
      script: 'src/server.js',
      cwd: '$WEB_ROOT/$PROJECT_NAME',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '$LOG_DIR/api-error.log',
      out_file: '$LOG_DIR/api-out.log',
      log_file: '$LOG_DIR/api-combined.log',
      time: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF

    # Start application with PM2
    cd $WEB_ROOT/$PROJECT_NAME
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log_success "PM2 setup completed"
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    log_warning "Please run the following commands to set up SSL certificates:"
    echo "sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com"
    echo ""
    log_warning "Make sure to update the Nginx configuration with your actual domain names"
}

create_deployment_script() {
    log_info "Creating deployment script..."
    
    cat > deploy.sh << 'EOF'
#!/bin/bash
# Quick deployment script for updates

set -e

echo "🚀 Starting quick deployment..."

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
pm2 restart georgia-connects-hub-api
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
EOF

    chmod +x deploy.sh
    
    log_success "Deployment script created"
}

main() {
    log_info "Starting Georgia Connects Hub deployment..."
    
    check_requirements
    setup_directories
    deploy_backend
    deploy_frontend
    deploy_admin
    setup_database
    setup_nginx
    setup_pm2
    setup_ssl
    create_deployment_script
    
    log_success "Deployment completed successfully!"
    log_info "Next steps:"
    echo "1. Update environment variables in $WEB_ROOT/$PROJECT_NAME/.env.production"
    echo "2. Set up SSL certificates with certbot"
    echo "3. Update domain names in Nginx configuration"
    echo "4. Test the application"
    echo ""
    log_info "Use './deploy.sh' for future updates"
}

# Run main function
main "$@"
