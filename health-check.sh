#!/bin/bash

# Georgia Connects Hub - Health Check Script
# This script performs a comprehensive health check of all services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
HEALTHY=0
UNHEALTHY=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    HEALTHY=$((HEALTHY + 1))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    UNHEALTHY=$((UNHEALTHY + 1))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service_name=$2
    local expected_status=${3:-200}
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$service_name is healthy (HTTP $response)"
        return 0
    else
        print_error "$service_name is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to check database connection
check_database() {
    local db_name=$1
    local service_name=$2
    
    cd georgia-connects-hub-backend
    
    if docker-compose exec -T postgres psql -U postgres -d "$db_name" -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "$service_name database is healthy"
        cd ..
        return 0
    else
        print_error "$service_name database is unhealthy"
        cd ..
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is healthy"
        return 0
    else
        print_error "Redis is unhealthy"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        print_success "Disk space is healthy (${usage}% used)"
        return 0
    elif [ "$usage" -lt 90 ]; then
        print_warning "Disk space is getting low (${usage}% used)"
        return 0
    else
        print_error "Disk space is critically low (${usage}% used)"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt 80 ]; then
        print_success "Memory usage is healthy (${usage}% used)"
        return 0
    elif [ "$usage" -lt 90 ]; then
        print_warning "Memory usage is high (${usage}% used)"
        return 0
    else
        print_error "Memory usage is critically high (${usage}% used)"
        return 1
    fi
}

# Main health check
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Georgia Connects Hub - Health Check     "
    echo "=========================================="
    echo -e "${NC}"
    
    print_status "Starting comprehensive health check..."
    echo ""
    
    # System Health
    echo -e "${BLUE}🖥️  System Health:${NC}"
    check_disk_space
    check_memory
    echo ""
    
    # Docker Services
    echo -e "${BLUE}🐳 Docker Services:${NC}"
    cd georgia-connects-hub-backend
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker services are running"
    else
        print_error "Docker services are not running"
    fi
    cd ..
    echo ""
    
    # Database Health
    echo -e "${BLUE}🗄️  Database Health:${NC}"
    check_database "georgia_connects_hub" "PostgreSQL"
    check_redis
    echo ""
    
    # Backend Health
    echo -e "${BLUE}🔧 Backend Health:${NC}"
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_http_endpoint "http://localhost:3000/api/v1/health" "Backend API"
        check_http_endpoint "http://localhost:3000/api-docs" "API Documentation"
    else
        print_error "Backend is not running"
    fi
    echo ""
    
    # Frontend Health
    echo -e "${BLUE}⚛️  Frontend Health:${NC}"
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_http_endpoint "http://localhost:8080" "Frontend Application"
    else
        print_error "Frontend is not running"
    fi
    echo ""
    
    # Admin Dashboard Health
    echo -e "${BLUE}👑 Admin Dashboard Health:${NC}"
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_http_endpoint "http://localhost:8081" "Admin Dashboard"
    else
        print_error "Admin Dashboard is not running"
    fi
    echo ""
    
    # Summary
    echo -e "${BLUE}📊 Health Check Summary:${NC}"
    echo "Healthy services: $HEALTHY"
    echo "Unhealthy services: $UNHEALTHY"
    echo ""
    
    if [ $UNHEALTHY -eq 0 ]; then
        print_success "All services are healthy! 🎉"
        exit 0
    else
        print_error "Some services are unhealthy. Please check the logs."
        exit 1
    fi
}

# Run main function
main "$@"
