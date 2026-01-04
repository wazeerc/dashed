FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS build

WORKDIR /app
ENV NODE_ENV=production
ARG TARGETPLATFORM

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force

COPY server.js ./
COPY public ./public

FROM --platform=$TARGETPLATFORM gcr.io/distroless/nodejs20-debian12 AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/public ./public
COPY healthcheck.js ./healthcheck.js

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/usr/bin/node", "/app/healthcheck.js"]

CMD ["/app/server.js"]
