FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline || npm ci
COPY prisma ./prisma
RUN npx prisma generate
CMD sh -c "npx prisma db push --accept-data-loss && node prisma/seed.js"
