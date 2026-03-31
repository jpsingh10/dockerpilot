# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /build/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.23-bookworm AS backend
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /build/web/dist ./web/dist
RUN CGO_ENABLED=1 go build -o /app/dockerpilot ./cmd/server

# Stage 3: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates docker.io git \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -m -s /bin/false dockerpilot \
    && mkdir -p /app/data /app/repos /stacks \
    && chown -R dockerpilot:dockerpilot /app /stacks

COPY --from=backend /app/dockerpilot /app/dockerpilot
COPY --from=frontend /build/web/dist /app/web/dist
RUN chown -R dockerpilot:dockerpilot /app

WORKDIR /app
USER dockerpilot
EXPOSE 8080
CMD ["/app/dockerpilot"]
