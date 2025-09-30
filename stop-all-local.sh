#!/bin/bash

# Georgia Connects Hub - Stop All Applications

echo "🛑 Stopping Georgia Connects Hub - All Applications"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
echo -e "${BLUE}Step 1: Stopping Node.js applications...${NC}"
echo "=================================================="

# Kill processes by port
echo -e "${YELLOW}Stopping Backend (port 3000)...${NC}"
if lsof -ti:3000 | xargs kill -9 2>/dev/null; then
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo "  Backend not running"
fi

echo -e "${YELLOW}Stopping User Frontend (port 5173)...${NC}"
if lsof -ti:5173 | xargs kill -9 2>/dev/null; then
    echo -e "${GREEN}✓ User Frontend stopped${NC}"
else
    echo "  User Frontend not running"
fi

echo -e "${YELLOW}Stopping Admin Dashboard (port 5175)...${NC}"
if lsof -ti:5175 | xargs kill -9 2>/dev/null; then
    echo -e "${GREEN}✓ Admin Dashboard stopped${NC}"
else
    echo "  Admin Dashboard not running"
fi

# QR Generator is now integrated into Admin Dashboard

echo ""
echo -e "${BLUE}Step 2: Managing Docker containers...${NC}"
echo "=================================================="

# Check if Docker is available
if command_exists docker; then
    # Ask user if they want to stop Docker containers
    echo -e "${YELLOW}Do you want to stop Docker containers (PostgreSQL, Redis)?${NC}"
    echo "  (y) Yes - Stop Docker containers"
    echo "  (n) No - Keep Docker containers running (recommended)"
    echo "  (r) Restart Docker containers"
    read -p "Choice [y/n/r]: " -n 1 -r
    echo ""
    
    case $REPLY in
        [Yy])
            cd georgia-connects-hub-backend 2>/dev/null || true
            if docker-compose ps | grep -q "georgia-connects"; then
                echo -e "${YELLOW}Stopping Docker containers...${NC}"
                if docker-compose down; then
                    echo -e "${GREEN}✓ Docker containers stopped${NC}"
                else
                    echo -e "${RED}✗ Failed to stop Docker containers${NC}"
                fi
            else
                echo "  No Docker containers running"
            fi
            cd - >/dev/null 2>&1 || true
            ;;
        [Rr])
            cd georgia-connects-hub-backend 2>/dev/null || true
            echo -e "${YELLOW}Restarting Docker containers...${NC}"
            docker-compose restart
            echo -e "${GREEN}✓ Docker containers restarted${NC}"
            cd - >/dev/null 2>&1 || true
            ;;
        *)
            echo -e "${BLUE}✓ Docker containers kept running${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}Docker not found - skipping${NC}"
fi

echo ""
echo -e "${GREEN}=================================================="
echo -e "✅ Cleanup complete!"
echo -e "==================================================${NC}"
echo ""
echo "📊 Current Status:"
echo ""

# Check Docker status
if command_exists docker && docker ps | grep -q "georgia-connects"; then
    echo "🐳 Docker Containers (RUNNING):"
    docker ps --filter "name=georgia-connects" --format "  • {{.Names}} - {{.Status}}"
    echo ""
    echo "  To stop Docker: cd georgia-connects-hub-backend && docker-compose down"
else
    echo "🐳 Docker Containers: Not running"
fi
echo ""

# Check for any remaining processes
if lsof -ti:3000,5173,5174,5175 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Warning: Some ports are still in use${NC}"
    echo "  Run 'lsof -ti:3000,5173,5174,5175' to check"
else
    echo -e "${GREEN}✅ All application ports are free${NC}"
fi

echo ""
echo "🚀 To start again: ./start-all-local.sh"
echo ""