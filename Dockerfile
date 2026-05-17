FROM node:22-alpine AS deps

RUN apk add --no-cache \
  build-base \
  libc6-compat \
  libpng-dev \
  libx11-dev \
  libxtst-dev \
  python3 \
  zlib-dev
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_DEMO_MODE=false
ARG NEXT_PUBLIC_HTPC_PLATFORM=WINDOWS
ENV NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}
ENV NEXT_PUBLIC_HTPC_PLATFORM=${NEXT_PUBLIC_HTPC_PLATFORM}

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libpng libstdc++ libx11 libxtst zlib

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ARG NEXT_PUBLIC_DEMO_MODE=false
ARG NEXT_PUBLIC_HTPC_PLATFORM=WINDOWS
ENV NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}
ENV NEXT_PUBLIC_HTPC_PLATFORM=${NEXT_PUBLIC_HTPC_PLATFORM}

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir .next \
  && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/native ./native
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
