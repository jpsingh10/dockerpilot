.PHONY: backend frontend dev build clean docker-build docker-up docker-down docker-logs

backend:
	go run ./cmd/server

frontend:
	cd web && npm run dev

dev:
	@echo "Run 'make backend' and 'make frontend' in separate terminals"

build:
	go build -o bin/dockerpilot ./cmd/server
	cd web && npm run build

clean:
	rm -rf bin/ web/dist/ data/

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
