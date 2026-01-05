FROM node:20-bookworm-slim AS build

WORKDIR /app
ARG TARGETPLATFORM

COPY package*.json ./

RUN npm ci --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY vite.config.js ./
COPY src ./src

RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY server.js ./server.js

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node","-e","require('http').get('http://127.0.0.1:3000/health', res => { if (res.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1));"]
CMD ["/app/server.js"]
