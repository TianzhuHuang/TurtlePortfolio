#!/bin/bash

# Turtle Portfolio Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Turtle Portfolio Deployment..."

# Configuration
REMOTE_SERVER="syh-prod"
REMOTE_USER="root"
REMOTE_PATH="/home/web/release/turtle"
FRONTEND_BUILD_DIR="frontend/out"
BACKEND_DIR="backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running from project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Deploy Frontend
deploy_frontend() {
    echo "🌐 Deploying Frontend..."
    
    # Step 1: Build frontend
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    # Step 2: Package and upload compiled files
    print_status "Packaging frontend build..."
    tar -czf frontend.tar.gz -C "$FRONTEND_BUILD_DIR" .
    
    print_status "Uploading frontend to remote server..."
    scp frontend.tar.gz "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/frontend/"
    
    # Step 3: Extract and reload nginx
    print_status "Extracting frontend files on remote server..."
    ssh "$REMOTE_USER@$REMOTE_SERVER" "
        cd $REMOTE_PATH/frontend/
        tar -xzf frontend.tar.gz
        rm frontend.tar.gz
    "
    
    print_status "Frontend deployed successfully!"
}

# Deploy Backend
deploy_backend() {
    echo "⚙️  Deploying Backend..."
    
    # Step 1: Package backend (excluding unnecessary files)
    print_status "Packaging backend..."
    tar --exclude='*.pyc' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='out' \
        -czf backend.tar.gz "$BACKEND_DIR"
    
    # Step 2: Upload to remote server
    print_status "Uploading backend to remote server..."
    scp backend.tar.gz "$REMOTE_USER@$REMOTE_SERVER:$REMOTE_PATH/"
    
    # Step 3: Extract and restart services
    print_status "Extracting backend files and restarting services..."
    ssh "$REMOTE_USER@$REMOTE_SERVER" "
        cd $REMOTE_PATH/
        tar -xzf backend.tar.gz
        rm backend.tar.gz
    "
    
    print_status "Backend deployed successfully!"
}

# Reload Services
reload_services() {
    echo "🔄 Reloading Services..."
    
    # Reload Nginx
    print_status "Reloading Nginx service..."
    ssh "$REMOTE_USER@$REMOTE_SERVER" "sudo systemctl reload nginx"
    
    # Restart backend services with docker-compose
    print_status "Restarting backend services..."
    ssh "$REMOTE_USER@$REMOTE_SERVER" "
        cd $REMOTE_PATH
        docker-compose down
        docker-compose up -d
    "
    
    print_status "Services reloaded successfully!"
}

# Main deployment process
main() {
    echo "========================================"
    echo " Turtle Portfolio Deployment"
    echo "========================================"
    
    START_TIME=$(date +%s)
    
    deploy_frontend
    echo ""
    
    deploy_backend
    echo ""
    
    reload_services
    echo ""
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo "========================================"
    print_status "🎉 Deployment completed successfully in ${DURATION} seconds!"
    echo "========================================"
}

# Run main function
main "$@"