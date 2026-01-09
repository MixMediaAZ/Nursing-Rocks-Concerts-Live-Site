FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# ffmpeg for HLS packaging + poster extraction
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install production deps (server bundle externalizes packages)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built assets + server bundle
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm","start"]


