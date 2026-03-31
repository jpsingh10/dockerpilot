package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/dockerpilot/dockerpilot/internal/api/handler"
	internalrouter "github.com/dockerpilot/dockerpilot/internal/api/router"
	"github.com/dockerpilot/dockerpilot/internal/api/middleware"
	"github.com/dockerpilot/dockerpilot/internal/config"
	"github.com/dockerpilot/dockerpilot/internal/db"
	"github.com/dockerpilot/dockerpilot/internal/repository"
	"github.com/dockerpilot/dockerpilot/internal/service"
	"github.com/dockerpilot/dockerpilot/internal/ws"
)

func main() {
	cfg := config.Load()
	database := db.Init(cfg.DBPath)

	userRepo := repository.NewUserRepository(database)
	stackRepo := repository.NewStackRepository(database)

	authService := service.NewAuthService(cfg.JWTSecret, userRepo)
	oidcService, err := service.NewOIDCService(cfg, authService, userRepo)
	if err != nil {
		log.Printf("OIDC not available: %v", err)
	}

	dockerMgr := service.NewDockerManager()
	if err := dockerMgr.Ping(context.Background()); err != nil {
		log.Printf("WARNING: Docker is not available: %v", err)
	}

	stackSvc := service.NewStackService(stackRepo, cfg.RepoBasePath)
	logMgr := service.NewLogManager()
	metricCol := service.NewMetricsCollector(dockerMgr)

	hub := ws.NewHub()
	gitopsWorker := service.NewGitOpsWorker(stackRepo, stackSvc, hub, cfg.RepoBasePath)

	var scannerCancel context.CancelFunc
	if cfg.StacksDir != "" {
		scanner := service.NewStackScanner(stackRepo, cfg.StacksDir, cfg.ScanInterval)
		var ctx context.Context
		ctx, scannerCancel = context.WithCancel(context.Background())
		go scanner.Start(ctx)
		log.Printf("Stack scanner watching: %s (interval: %ds)", cfg.StacksDir, cfg.ScanInterval)
	}

	authHandler := handler.NewAuthHandler(authService, oidcService)
	containerHandler := handler.NewContainerHandler(dockerMgr)
	stackHandler := handler.NewStackHandler(stackSvc, gitopsWorker)
	wsHandler := handler.NewWSHandler(hub, logMgr, metricCol)
	imageHandler := handler.NewImageHandler(dockerMgr)
	volumeHandler := handler.NewVolumeHandler(dockerMgr)
	networkHandler := handler.NewNetworkHandler(dockerMgr)
	systemHandler := handler.NewSystemHandler(dockerMgr)

	authMiddleware := middleware.NewAuthMiddleware(authService)

	router := internalrouter.NewRouter(authHandler, containerHandler, stackHandler, wsHandler, authMiddleware, imageHandler, volumeHandler, networkHandler, systemHandler)

	os.MkdirAll(cfg.RepoBasePath, 0755)

	server := &http.Server{Addr: ":" + cfg.Port, Handler: router}

	go func() {
		log.Printf("DockerPilot server starting on :%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	if scannerCancel != nil {
		scannerCancel()
	}
	log.Println("shutting down server...")
}
