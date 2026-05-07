#!/bin/sh
set -e

echo "⏳ Wachten op database..."
# Wacht tot postgres bereikbaar is
until pg_isready -h db -U inventarisatie 2>/dev/null; do
  sleep 1
done

echo "✅ Database bereikbaar"
echo "🔄 Migraties uitvoeren..."
npx prisma migrate deploy

echo "🌱 Seed uitvoeren (alleen als tabel leeg is)..."
node prisma/seed.js

echo "✅ Klaar"
