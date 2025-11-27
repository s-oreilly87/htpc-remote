## Stage 1: Build the application
#FROM node:19.8.1-alpine AS builder
#
#WORKDIR /app
#
## Install dependencies
#COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
#RUN \
# if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
# elif [ -f package-lock.json ]; then npm ci; \
# elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
# else yarn install; \
# fi
#
## Copy necessary files
#COPY src ./src
#COPY public ./public
#COPY next.config.js .
#COPY jsconfig.json .
#COPY postcss.config.cjs .
#COPY tailwind.config.cjs .
#COPY certificates ./certificates
#COPY package.json .
#
## Build the application
#RUN npm run build
#
## Stage 2: Run the application
#FROM node:19.8.1-alpine AS runner
#
#WORKDIR /app
#
## Copy necessary files from builder
#COPY --from=builder /app/.next/standalone ./.next/standalone
## COPY --from=builder /app/.next/static ./.next/static
#COPY --from=builder /app/public ./public
#COPY --from=builder /app/package.json ./package.json
#
## Set environment variables
#ARG NEXT_PUBLIC_PLATFORM
#ENV NEXT_PUBLIC_PLATFORM=${NEXT_PUBLIC_PLATFORM}
#
## Expose port
#EXPOSE 3000
#
## Start the application
#CMD node .next/standalone/server.js
## CMD node .next/server.js

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]