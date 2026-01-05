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

CMD ["/app/server.js"]
