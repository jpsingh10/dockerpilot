.PHONY: backend frontend dev build clean

backend:
	go run ./cmd/server

frontend:
	cd web && npm run dev

dev:
	@echo "Run 'make backend' and 'make frontend' in separate terminals"

build:
	go build -o bin/nexusdocker ./cmd/server
	cd web && npm run build

clean:
	rm -rf bin/ web/dist/ data/
