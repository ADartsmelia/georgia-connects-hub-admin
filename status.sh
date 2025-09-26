#!/bin/bash

# Georgia Connects Hub - Status Check Script
# This script shows the current status of all services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check service health
check_service_health() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name is not responding"
        return 1
    fi
}

# Function to get process info
get_process_info() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        local cpu=$(ps -p $pid -o %cpu= 2>/dev/null | tr -d ' ' || echo "N/A")
        local mem=$(ps -p $pid -o %mem= 2>/dev/null | tr -d ' ' || echo "N/A")
        echo -e "${GREEN}Running${NC} (PID: $pid, CPU: ${cpu}%, MEM: ${mem}%)"
        return 0
    else
        echo -e "${RED}Not running${NC}"
        return 1
    fi
}

# Main status check
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Georgia Connects Hub - Service Status  "
    echo "=========================================="
    echo -e "${NC}"
    
    # Docker Services Status
    echo -e "${BLUE}🐳 Docker Services:${NC}"
    cd georgia-connects-hub-backend
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✓ Docker services are running${NC}"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${RED}✗ Docker services are not running${NC}"
    fi
    cd ..
    echo ""
    
    # Backend Status
    echo -e "${BLUE}🔧 Backend API (Port 3000):${NC}"
    if check_port 3000; then
        get_process_info 3000 "Backend"
        check_service_health "http://localhost:3000/api/v1/health" "Backend API"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi
    echo ""
    
    # Frontend Status
    echo -e "${BLUE}⚛️  Frontend App (Port 8080):${NC}"
    if check_port 8080; then
        get_process_info 8080 "Frontend"
        check_service_health "http://localhost:8080" "Frontend"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi
    echo ""
    
    # Admin Dashboard Status
    echo -e "${BLUE}👑 Admin Dashboard (Port 8081):${NC}"
    if check_port 8081; then
        get_process_info 8081 "Admin Dashboard"
        check_service_health "http://localhost:8081" "Admin Dashboard"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi
    echo ""
    
    # Database Status
    echo -e "${BLUE}🗄️  Database Status:${NC}"
    cd georgia-connects-hub-backend
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not ready${NC}"
    fi
    
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is ready${NC}"
    else
        echo -e "${RED}✗ Redis is not ready${NC}"
    fi
    cd ..
    echo ""
    
    # Access URLs
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    if check_port 8080; then
        echo -e "${GREEN}Frontend:${NC} http://localhost:8080"
    else
        echo -e "${RED}Frontend:${NC} Not available"
    fi
    
    if check_port 8081; then
        echo -e "${GREEN}Admin Dashboard:${NC} http://localhost:8081"
    else
        echo -e "${RED}Admin Dashboard:${NC} Not available"
    fi
    
    if check_port 3000; then
        echo -e "${GREEN}Backend API:${NC} http://localhost:3000/api/v1"
        echo -e "${GREEN}API Docs:${NC} http://localhost:3000/api-docs"
    else
        echo -e "${RED}Backend API:${NC} Not available"
    fi
    echo ""
    
    # Log Files
    echo -e "${BLUE}📋 Log Files:${NC}"
    if [ -d "logs" ]; then
        echo "Available log files:"
        ls -la logs/*.log 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  No log files found"
    else
        echo "No logs directory found"
    fi
    echo ""
    
    # Quick Actions
    echo -e "${BLUE}🚀 Quick Actions:${NC}"
    echo "  Start all services: ./start-all.sh"
    echo "  Stop all services:  ./stop-all.sh"
    echo "  View logs:          tail -f logs/backend.log"
    echo ""
}

# Run main function
main "$@"
