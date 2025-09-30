#!/bin/bash

# Georgia Connects Hub - Setup and Start All Applications
# This script installs dependencies and starts all applications

echo "🔧 Georgia Connects Hub - Setup and Start"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if QR Generator needs dependencies
if [ ! -d "georgia-qr-generator/node_modules" ]; then
    echo -e "\n${YELLOW}Installing QR Generator dependencies...${NC}"
    cd georgia-qr-generator
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ QR Generator dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install QR Generator dependencies${NC}"
        exit 1
    fi
    cd ..
else
    echo -e "\n${GREEN}✓ QR Generator dependencies already installed${NC}"
fi

# Check other apps
echo -e "\n${BLUE}Checking other applications...${NC}"
for app in "georgia-connects-hub" "georgia-connects-hub-admin" "georgia-connects-hub-backend"; do
    if [ ! -d "$app/node_modules" ]; then
        echo -e "${YELLOW}Warning: $app/node_modules not found. You may need to run 'cd $app && npm install'${NC}"
    else
        echo -e "${GREEN}✓ $app dependencies installed${NC}"
    fi
done

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "\n${BLUE}Starting all applications...${NC}\n"

# Start all applications
./start-all-local.sh
