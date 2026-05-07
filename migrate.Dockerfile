FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Kopieer package bestanden
COPY package.json package-lock.json* ./

# Installeer ALLE dependencies (inclusief bcryptjs voor seed)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Kopieer prisma schema en seed
COPY prisma ./prisma

# Genereer Prisma client
RUN npx prisma generate

# Entrypoint: push schema + seed
CMD sh -c "npx prisma db push --accept-data-loss && node prisma/seed.js"
