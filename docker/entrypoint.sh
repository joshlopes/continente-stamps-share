#!/bin/sh
set -e

echo "==================================="
echo "  Starting Application"
echo "==================================="

# Create required directories
mkdir -p /var/log/supervisor /run/nginx

# Wait for database to be ready
echo "Waiting for database..."
MAX_RETRIES=30
RETRY=0

# Parse DATABASE_URL to extract host and port
DB_HOST=$(echo "$DATABASE_URL" | bun -e "
  const url = new URL(await Bun.stdin.text());
  process.stdout.write(url.hostname);
")
DB_PORT=$(echo "$DATABASE_URL" | bun -e "
  const url = new URL(await Bun.stdin.text());
  process.stdout.write(url.port || '5432');
")

while [ $RETRY -lt $MAX_RETRIES ]; do
  if bun -e "
    const net = require('net');
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.connect($DB_PORT, '$DB_HOST', () => { socket.destroy(); process.exit(0); });
    socket.on('error', () => process.exit(1));
    socket.on('timeout', () => { socket.destroy(); process.exit(1); });
  " 2>/dev/null; then
    echo "Database is ready!"
    break
  fi
  RETRY=$((RETRY + 1))
  echo "Waiting for database... ($RETRY/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo "ERROR: Database not available after $MAX_RETRIES retries"
  exit 1
fi

# Run database migrations
echo "Running database migrations..."
cd /app/apps/server
bunx prisma migrate deploy || {
  echo "Warning: Migration failed, container will continue..."
}

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
