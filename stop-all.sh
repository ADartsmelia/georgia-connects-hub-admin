#!/bin/bash

# Georgia Connects Hub - Complete Stop Script
# This script stops all services: Backend, Frontend, Admin Dashboard, and Docker services

set -e  # Exit on any error

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

# Function to kill process by PID
kill_process() {
    local pid=$1
    local service_name=$2
    
    if [ -n "$pid" ] && ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping $service_name (PID: $pid)..."
        if kill $pid 2>/dev/null; then
            # Wait for graceful shutdown
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force killing $service_name..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            print_success "$service_name stopped successfully"
        else
            print_warning "Failed to stop $service_name (might already be stopped)"
        fi
    else
        print_warning "$service_name is not running"
    fi
}

# Function to stop service by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        print_status "Stopping $service_name on port $port (PID: $pid)..."
        kill $pid 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if lsof -ti:$port >/dev/null 2>&1; then
            print_warning "Force killing $service_name on port $port..."
            kill -9 $pid 2>/dev/null || true
        fi
        
        print_success "$service_name stopped successfully"
    else
        print_warning "$service_name is not running on port $port"
    fi
}

# Function to stop Admin Dashboard
stop_admin() {
    print_status "Stopping Admin Dashboard..."
    
    if [ -f logs/admin.pid ]; then
        ADMIN_PID=$(cat logs/admin.pid)
        kill_process $ADMIN_PID "Admin Dashboard"
        rm -f logs/admin.pid
    else
        stop_by_port 8081 "Admin Dashboard"
    fi
}

# Function to stop Frontend
stop_frontend() {
    print_status "Stopping Frontend application..."
    
    if [ -f logs/frontend.pid ]; then
        FRONTEND_PID=$(cat logs/frontend.pid)
        kill_process $FRONTEND_PID "Frontend"
        rm -f logs/frontend.pid
    else
        stop_by_port 8080 "Frontend"
    fi
}

# Function to stop Backend
stop_backend() {
    print_status "Stopping Backend server..."
    
    if [ -f logs/backend.pid ]; then
        BACKEND_PID=$(cat logs/backend.pid)
        kill_process $BACKEND_PID "Backend"
        rm -f logs/backend.pid
    else
        stop_by_port 3000 "Backend"
    fi
}

# Function to stop Docker services
stop_docker() {
    print_status "Stopping Docker services..."
    
    cd georgia-connects-hub-backend
    
    if docker-compose ps | grep -q "Up"; then
        if docker-compose down; then
            print_success "Docker services stopped successfully"
        else
            print_error "Failed to stop Docker services"
        fi
    else
        print_warning "Docker services are not running"
    fi
    
    cd ..
}

# Function to cleanup any remaining processes
cleanup_processes() {
    print_status "Cleaning up any remaining processes..."
    
    # Kill any remaining Node.js processes related to our project
    local node_pids=$(pgrep -f "georgia-connects-hub" 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        print_status "Found remaining Node.js processes, cleaning up..."
        echo $node_pids | xargs kill 2>/dev/null || true
        sleep 2
        echo $node_pids | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill any processes on our specific ports
    for port in 3000 8080 8081 5433 6379; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            print_status "Killing process on port $port (PID: $pid)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done
}

# Function to show final status
show_final_status() {
    echo ""
    print_status "=== FINAL STATUS ==="
    echo ""
    
    # Check Docker services
    echo -e "${BLUE}Docker Services:${NC}"
    cd georgia-connects-hub-backend
    if docker-compose ps | grep -q "Up"; then
        echo -e "${YELLOW}Some Docker services are still running${NC}"
        docker-compose ps
    else
        echo -e "${GREEN}All Docker services stopped${NC}"
    fi
    cd ..
    echo ""
    
    # Check application processes
    local backend_running=$(lsof -ti:3000 2>/dev/null || true)
    local frontend_running=$(lsof -ti:8080 2>/dev/null || true)
    local admin_running=$(lsof -ti:8081 2>/dev/null || true)
    
    if [ -n "$backend_running" ]; then
        echo -e "${YELLOW}Backend:${NC} Still running on port 3000"
    else
        echo -e "${GREEN}Backend:${NC} Stopped"
    fi
    
    if [ -n "$frontend_running" ]; then
        echo -e "${YELLOW}Frontend:${NC} Still running on port 8080"
    else
        echo -e "${GREEN}Frontend:${NC} Stopped"
    fi
    
    if [ -n "$admin_running" ]; then
        echo -e "${YELLOW}Admin Dashboard:${NC} Still running on port 8081"
    else
        echo -e "${GREEN}Admin Dashboard:${NC} Stopped"
    fi
    
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Georgia Connects Hub - Stop Script     "
    echo "=========================================="
    echo -e "${NC}"
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Stop services in reverse order
    stop_admin
    stop_frontend
    stop_backend
    stop_docker
    
    # Cleanup any remaining processes
    cleanup_processes
    
    # Show final status
    show_final_status
    
    print_success "All services stopped successfully!"
    print_status "To start all services again, run: ./start-all.sh"
}

# Handle script interruption
trap 'print_warning "Script interrupted. Cleaning up..."; cleanup_processes; exit 1' INT TERM

# Run main function
main "$@"
