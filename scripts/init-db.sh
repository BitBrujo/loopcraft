#!/bin/bash

# LoopCraft Database Initialization Script
# This script initializes the MySQL database for LoopCraft

set -e

echo "🚀 LoopCraft Database Initialization"
echo "===================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Default values
MYSQL_HOST=${MYSQL_HOST:-localhost}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-loopcraft}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-loopcraft_secure_password_2025}
MYSQL_DATABASE=${MYSQL_DATABASE:-loopcraft}

echo "📊 Configuration:"
echo "   Host: $MYSQL_HOST"
echo "   Port: $MYSQL_PORT"
echo "   Database: $MYSQL_DATABASE"
echo "   User: $MYSQL_USER"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if MySQL container exists
if ! docker ps -a | grep -q loopcraft-mysql; then
    echo "📦 MySQL container not found. Starting with docker-compose..."
    docker compose up -d
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 10
else
    # Start container if it's stopped
    if ! docker ps | grep -q loopcraft-mysql; then
        echo "🔄 Starting existing MySQL container..."
        docker start loopcraft-mysql
        echo "⏳ Waiting for MySQL to be ready..."
        sleep 5
    else
        echo "✅ MySQL container is already running"
    fi
fi

# Wait for MySQL to be ready
echo "🔍 Checking MySQL connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec loopcraft-mysql mysqladmin ping -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" > /dev/null 2>&1; then
        echo "✅ MySQL is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Error: MySQL did not become ready in time"
    exit 1
fi

# Check if database needs initialization
echo ""
echo "🔧 Checking database status..."

TABLES_COUNT=$(docker exec loopcraft-mysql mysql -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$MYSQL_DATABASE'" 2>/dev/null || echo "0")

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "⚠️  Database already has $TABLES_COUNT tables"
    echo ""
    read -p "Do you want to reinitialize the database? This will delete all data! (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "✅ Keeping existing database"
        exit 0
    fi
    echo "🗑️  Dropping and recreating database..."
    docker exec loopcraft-mysql mysql -h localhost -u root -prootpassword -e "DROP DATABASE IF EXISTS $MYSQL_DATABASE; CREATE DATABASE $MYSQL_DATABASE;"
fi

# Initialize schema
echo ""
echo "📝 Initializing database schema..."

if [ -f "src/lib/db/schema.sql" ]; then
    docker exec -i loopcraft-mysql mysql -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < src/lib/db/schema.sql
    echo "✅ Schema initialized successfully!"
else
    echo "❌ Error: Schema file not found at src/lib/db/schema.sql"
    exit 1
fi

# Verify tables
echo ""
echo "🔍 Verifying database tables..."
TABLES=$(docker exec loopcraft-mysql mysql -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -se "SHOW TABLES" 2>/dev/null)

if [ -z "$TABLES" ]; then
    echo "❌ Error: No tables found in database"
    exit 1
fi

echo "✅ Found tables:"
echo "$TABLES" | sed 's/^/   - /'

# Test demo user
echo ""
echo "👤 Verifying demo user..."
DEMO_USER=$(docker exec loopcraft-mysql mysql -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -se "SELECT username FROM users WHERE username = 'demo'" 2>/dev/null)

if [ "$DEMO_USER" = "demo" ]; then
    echo "✅ Demo user created successfully"
    echo "   Username: demo"
    echo "   Password: demo123"
else
    echo "⚠️  Warning: Demo user not found"
fi

# Connection test
echo ""
echo "🧪 Testing database connection..."
if docker exec loopcraft-mysql mysql -h localhost -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Connection test successful!"
else
    echo "❌ Connection test failed"
    exit 1
fi

echo ""
echo "🎉 Database initialization complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the app: npm run dev"
echo "   2. Login with demo user (username: demo, password: demo123)"
echo "   3. Your data will now persist in MySQL!"
echo ""
echo "🐳 Docker commands:"
echo "   - Stop MySQL: docker compose down"
echo "   - Start MySQL: docker compose up -d"
echo "   - View logs: docker logs loopcraft-mysql"
echo "   - MySQL shell: docker exec -it loopcraft-mysql mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE"
echo ""
