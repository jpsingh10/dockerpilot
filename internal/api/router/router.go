package router

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api/handler"
	"github.com/dockerpilot/dockerpilot/internal/api/middleware"
)

func NewRouter(
	authHandler *handler.AuthHandler,
	containerHandler *handler.ContainerHandler,
	stackHandler *handler.StackHandler,
	wsHandler *handler.WSHandler,
	authMiddleware *middleware.AuthMiddleware,
	imageHandler *handler.ImageHandler,
	volumeHandler *handler.VolumeHandler,
	networkHandler *handler.NetworkHandler,
	systemHandler *handler.SystemHandler,
	userHandler *handler.UserHandler,
) http.Handler {
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	// Public routes
	r.HandleFunc("/api/v1/auth/login", authHandler.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/auth/oidc/redirect", authHandler.OIDCRedirect).Methods("GET")
	r.HandleFunc("/api/v1/auth/oidc/callback", authHandler.OIDCCallback).Methods("GET")
	r.HandleFunc("/api/v1/webhooks/{id}", stackHandler.Webhook).Methods("POST")
	r.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}).Methods("GET")

	// Authenticated routes
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.Use(authMiddleware.Authenticate)

	// Read endpoints — all authenticated users
	apiRouter.HandleFunc("/auth/me", authHandler.Me).Methods("GET")
	apiRouter.HandleFunc("/containers", containerHandler.List).Methods("GET")
	apiRouter.HandleFunc("/stacks", stackHandler.List).Methods("GET")
	apiRouter.HandleFunc("/stacks/{id}/compose", stackHandler.GetComposeFile).Methods("GET")
	apiRouter.HandleFunc("/images", imageHandler.List).Methods("GET")
	apiRouter.HandleFunc("/volumes", volumeHandler.List).Methods("GET")
	apiRouter.HandleFunc("/networks", networkHandler.List).Methods("GET")
	apiRouter.HandleFunc("/system/info", systemHandler.Info).Methods("GET")

	// Write endpoints — admin only
	adminOnly := func(f http.HandlerFunc) http.Handler {
		return middleware.AdminOnly(http.HandlerFunc(f))
	}

	// Containers write
	apiRouter.Handle("/containers", adminOnly(containerHandler.Create)).Methods("POST")
	apiRouter.Handle("/containers/{id}/start", adminOnly(containerHandler.Start)).Methods("POST")
	apiRouter.Handle("/containers/{id}/stop", adminOnly(containerHandler.Stop)).Methods("POST")
	apiRouter.Handle("/containers/{id}/restart", adminOnly(containerHandler.Restart)).Methods("POST")
	apiRouter.Handle("/containers/{id}", adminOnly(containerHandler.Remove)).Methods("DELETE")

	// Stacks write
	apiRouter.Handle("/stacks", adminOnly(stackHandler.Create)).Methods("POST")
	apiRouter.Handle("/stacks/{id}/deploy", adminOnly(stackHandler.Deploy)).Methods("POST")
	apiRouter.Handle("/stacks/{id}/teardown", adminOnly(stackHandler.TearDown)).Methods("POST")
	apiRouter.Handle("/stacks/{id}", adminOnly(stackHandler.Delete)).Methods("DELETE")
	apiRouter.Handle("/stacks/{id}/compose", adminOnly(stackHandler.UpdateComposeFile)).Methods("PUT")

	// Images write
	apiRouter.Handle("/images/{id}", adminOnly(imageHandler.Remove)).Methods("DELETE")
	apiRouter.Handle("/images/prune", adminOnly(imageHandler.Prune)).Methods("POST")

	// Volumes write
	apiRouter.Handle("/volumes", adminOnly(volumeHandler.Create)).Methods("POST")
	apiRouter.Handle("/volumes/{name}", adminOnly(volumeHandler.Remove)).Methods("DELETE")
	apiRouter.Handle("/volumes/prune", adminOnly(volumeHandler.Prune)).Methods("POST")

	// Networks write
	apiRouter.Handle("/networks", adminOnly(networkHandler.Create)).Methods("POST")
	apiRouter.Handle("/networks/{id}", adminOnly(networkHandler.Remove)).Methods("DELETE")
	apiRouter.Handle("/networks/prune", adminOnly(networkHandler.Prune)).Methods("POST")

	// User management — admin only
	apiRouter.Handle("/users", adminOnly(userHandler.List)).Methods("GET")
	apiRouter.Handle("/users", adminOnly(userHandler.Create)).Methods("POST")
	apiRouter.Handle("/users/{id}", adminOnly(userHandler.Update)).Methods("PUT")
	apiRouter.Handle("/users/{id}", adminOnly(userHandler.Delete)).Methods("DELETE")

	// WebSocket (handles auth separately)
	r.HandleFunc("/api/v1/ws/{containerID}", wsHandler.Stream)

	// SPA fallback
	spa := spaHandler{staticPath: "./web/dist", indexPath: "index.html"}
	r.PathPrefix("/").Handler(spa)

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fs := http.Dir(h.staticPath)
	f, err := fs.Open(r.URL.Path)
	if err != nil {
		if _, statErr := os.Stat(h.staticPath + "/" + h.indexPath); statErr == nil {
			http.ServeFile(w, r, h.staticPath+"/"+h.indexPath)
			return
		}
		http.NotFound(w, r)
		return
	}
	f.Close()
	http.FileServer(fs).ServeHTTP(w, r)
}
