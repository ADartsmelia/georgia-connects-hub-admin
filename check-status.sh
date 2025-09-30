#!/bin/bash

# Georgia Connects Hub - Status Check Script

echo "🔍 Checking Georgia Connects Hub Status"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}Docker Containers:${NC}"
echo "-------------------"
if docker ps --filter "name=georgia-connects" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "georgia-connects"; then
    docker ps --filter "name=georgia-connects" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}No Docker containers running${NC}"
fi

echo ""
echo -e "${BLUE}Application Ports:${NC}"
echo "-------------------"

check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        echo -e "${GREEN}✓${NC} Port $port ($name) - PID: $pid"
    else
        echo -e "${RED}✗${NC} Port $port ($name) - Not running"
    fi
}

check_port 3000 "Backend API"
check_port 8080 "User Frontend"
check_port 8081 "Admin Dashboard"
check_port 5433 "PostgreSQL"
check_port 6379 "Redis"

echo ""
echo -e "${BLUE}HTTP Endpoints:${NC}"
echo "-------------------"

check_http() {
    local url=$1
    local name=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$url" 2>/dev/null)
    if [ "$response" != "000" ]; then
        echo -e "${GREEN}✓${NC} $name - HTTP $response"
    else
        echo -e "${RED}✗${NC} $name - Not responding"
    fi
}

check_http "http://localhost:3000/api/v1/auth/me" "Backend API"
check_http "http://localhost:8080" "User Frontend"
check_http "http://localhost:8081" "Admin Dashboard"

echo ""
echo -e "${BLUE}Recent Logs (last 5 lines each):${NC}"
echo "-----------------------------------"

if [ -f "logs/backend.log" ]; then
    echo -e "${YELLOW}Backend:${NC}"
    tail -5 logs/backend.log
    echo ""
fi

if [ -f "logs/frontend.log" ]; then
    echo -e "${YELLOW}Frontend:${NC}"
    tail -5 logs/frontend.log
    echo ""
fi

if [ -f "logs/admin.log" ]; then
    echo -e "${YELLOW}Admin:${NC}"
    tail -5 logs/admin.log
    echo ""
fi

# QR Generator is now part of Admin Dashboard

echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "-------------------"
echo "View full logs:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo "  tail -f logs/admin.log"
echo "  tail -f logs/qr-generator.log"
echo ""
echo "Test URLs in browser:"
echo "  open http://localhost:3000/api/v1/auth/me"
echo "  open http://localhost:5173"
echo "  open http://localhost:5174"
echo "  open http://localhost:5175"
echo ""
