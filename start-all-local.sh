#!/bin/bash

# Georgia Connects Hub - Start All Applications Locally
# This script starts Docker containers, backend, frontend, admin dashboard, and QR generator

set -e  # Exit on error

echo "🚀 Starting Georgia Connects Hub - All Applications"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to kill all background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all applications...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup INT TERM

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is running
check_docker() {
    if ! command_exists docker; then
        echo -e "${RED}✗ Docker is not installed${NC}"
        echo "  Please install Docker from https://www.docker.com/get-started"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}✗ Docker is not running${NC}"
        echo "  Please start Docker Desktop"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}✗ Port $port is already in use (required for $service)${NC}"
        echo "  Run './stop-all-local.sh' to stop existing services"
        return 1
    fi
    return 0
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${BLUE}Waiting for $service to be ready...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q -E "200|401|404"; then
            echo -e "${GREEN}✓ $service is ready${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
        echo -n "."
    done
    
    echo -e "\n${RED}✗ $service failed to start${NC}"
    return 1
}

# Create logs directory
mkdir -p logs

echo ""
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
echo "=================================================="

# Check Docker
check_docker

# Check if Docker Compose is available
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}✗ Docker Compose is not available${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed ($(node -v))${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm is installed ($(npm -v))${NC}"

echo ""
echo -e "${BLUE}Step 2: Checking ports...${NC}"
echo "=================================================="

check_port 3000 "Backend API" || exit 1
check_port 5173 "User Frontend" || exit 1
check_port 5174 "QR Generator" || exit 1
check_port 5175 "Admin Dashboard" || exit 1
check_port 5433 "PostgreSQL" || exit 1

echo -e "${GREEN}✓ All required ports are available${NC}"

echo ""
echo -e "${BLUE}Step 3: Starting Docker containers...${NC}"
echo "=================================================="

cd georgia-connects-hub-backend

# Check if containers are already running
if docker ps | grep -q "georgia-connects-postgres"; then
    echo -e "${YELLOW}Docker containers are already running${NC}"
else
    echo "Starting PostgreSQL and Redis..."
    if docker-compose up -d; then
        echo -e "${GREEN}✓ Docker containers started${NC}"
    else
        echo -e "${RED}✗ Failed to start Docker containers${NC}"
        exit 1
    fi
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec georgia-connects-postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready (attempt $((ATTEMPT + 1)))${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo -e "${RED}✗ PostgreSQL failed to start after ${MAX_ATTEMPTS} seconds${NC}"
    echo ""
    echo "Showing PostgreSQL logs:"
    docker logs --tail 20 georgia-connects-postgres
    
    # Check for version incompatibility
    if docker logs georgia-connects-postgres 2>&1 | grep -q "database files are incompatible"; then
        echo ""
        echo -e "${YELLOW}⚠️  PostgreSQL version mismatch detected!${NC}"
        echo "The database was created with an older PostgreSQL version."
        echo ""
        echo "Options:"
        echo "  1. Remove old data and start fresh (RECOMMENDED for development)"
        echo "  2. Exit and fix manually"
        echo ""
        read -p "Remove old database data and start fresh? [y/N]: " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Removing old PostgreSQL data...${NC}"
            docker-compose down -v
            echo -e "${GREEN}✓ Old data removed${NC}"
            echo ""
            echo -e "${BLUE}Starting fresh PostgreSQL...${NC}"
            docker-compose up -d
            
            # Wait again for PostgreSQL
            echo "Waiting for PostgreSQL to be ready..."
            ATTEMPT=0
            while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
                if docker exec georgia-connects-postgres pg_isready -U postgres >/dev/null 2>&1; then
                    echo -e "${GREEN}✓ PostgreSQL is ready (attempt $((ATTEMPT + 1)))${NC}"
                    break
                fi
                ATTEMPT=$((ATTEMPT + 1))
                echo -n "."
                sleep 1
            done
            
            if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
                echo ""
                echo -e "${RED}✗ PostgreSQL still failed to start${NC}"
                docker logs --tail 30 georgia-connects-postgres
                exit 1
            fi
        else
            echo "Exiting. To manually fix:"
            echo "  cd georgia-connects-hub-backend"
            echo "  docker-compose down -v"
            echo "  docker-compose up -d"
            exit 1
        fi
    else
        echo ""
        echo "To debug:"
        echo "  docker logs georgia-connects-postgres"
        echo "  docker exec -it georgia-connects-postgres psql -U postgres"
        exit 1
    fi
fi
echo ""

cd ..

echo ""
echo -e "${BLUE}Step 4: Checking environment configuration...${NC}"
echo "=================================================="

# Check if .env exists in backend
if [ ! -f "georgia-connects-hub-backend/.env" ]; then
    echo -e "${YELLOW}Creating .env file from database.env...${NC}"
    if [ -f "georgia-connects-hub-backend/database.env" ]; then
        cp georgia-connects-hub-backend/database.env georgia-connects-hub-backend/.env
        echo -e "${GREEN}✓ .env file created${NC}"
    else
        echo -e "${RED}✗ database.env not found${NC}"
        exit 1
    fi
else
    # Check if DB credentials are in .env
    if ! grep -q "DB_HOST" georgia-connects-hub-backend/.env; then
        echo -e "${YELLOW}Adding database credentials to .env...${NC}"
        cat georgia-connects-hub-backend/database.env >> georgia-connects-hub-backend/.env
        echo -e "${GREEN}✓ Database credentials added${NC}"
    else
        echo -e "${GREEN}✓ .env file exists with DB credentials${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Step 5: Starting applications...${NC}"
echo "=================================================="

# Start Backend API
echo -e "\n${BLUE}5.1. Starting Backend API...${NC}"
cd georgia-connects-hub-backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
cd ..

# Wait a bit for backend to initialize
sleep 3

# Start User Frontend
echo -e "\n${BLUE}5.2. Starting User Frontend...${NC}"
cd georgia-connects-hub
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ User Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..

# Start Admin Dashboard
echo -e "\n${BLUE}5.3. Starting Admin Dashboard...${NC}"
cd georgia-connects-hub-admin
npm run dev > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
echo -e "${GREEN}✓ Admin Dashboard started (PID: $ADMIN_PID)${NC}"
cd ..

# QR Generator is now integrated into Admin Dashboard

echo ""
echo -e "${BLUE}Step 6: Verifying services...${NC}"
echo "=================================================="

# Wait for services to start
sleep 5

# Check if processes are still running
for pid in $BACKEND_PID $FRONTEND_PID $ADMIN_PID; do
    if ! kill -0 $pid 2>/dev/null; then
        echo -e "${RED}✗ Process $pid died unexpectedly${NC}"
        echo "  Check logs in ./logs/ directory"
        cleanup
        exit 1
    fi
done

echo -e "${GREEN}✓ All processes are running${NC}"

echo ""
echo -e "${GREEN}=================================================="
echo -e "🎉 All applications started successfully!"
echo -e "==================================================${NC}"
echo ""
echo "📱 Application URLs:"
echo "  • Backend API:       http://localhost:3000"
echo "  • User Frontend:     http://localhost:8080"
echo "  • Admin Dashboard:   http://localhost:8081"
echo "    - QR Generator:    http://localhost:8081/admin/qr-generator"
echo "    - QR Scanner:      http://localhost:8081/admin/qr-scanner"
echo "    - QR Management:   http://localhost:8081/admin/qr-management"
echo ""
echo "🐳 Docker Services:"
echo "  • PostgreSQL:        localhost:5433"
echo "  • Redis:             localhost:6379"
echo "  • pgAdmin:           http://localhost:5050 (optional)"
echo ""
echo "📋 Process IDs:"
echo "  • Backend:     $BACKEND_PID"
echo "  • Frontend:    $FRONTEND_PID"
echo "  • Admin:       $ADMIN_PID"
echo ""
echo "📝 Logs:"
echo "  • logs/backend.log"
echo "  • logs/frontend.log"
echo "  • logs/admin.log"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs:         tail -f logs/backend.log"
echo "  • Check Docker:      docker ps"
echo "  • Stop all:          ./stop-all-local.sh"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all applications${NC}"
echo ""

# Wait for all background processes
wait