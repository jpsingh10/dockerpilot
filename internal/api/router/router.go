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
) http.Handler {
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	r.HandleFunc("/api/v1/auth/login", authHandler.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/v1/auth/oidc/redirect", authHandler.OIDCRedirect).Methods("GET")
	r.HandleFunc("/api/v1/auth/oidc/callback", authHandler.OIDCCallback).Methods("GET")
	r.HandleFunc("/api/v1/webhooks/{id}", stackHandler.Webhook).Methods("POST")
	r.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}).Methods("GET")

	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.Use(authMiddleware.Authenticate)

	apiRouter.HandleFunc("/auth/me", authHandler.Me).Methods("GET")
	apiRouter.HandleFunc("/containers", containerHandler.List).Methods("GET")
	apiRouter.HandleFunc("/containers", containerHandler.Create).Methods("POST")
	apiRouter.HandleFunc("/containers/{id}/start", containerHandler.Start).Methods("POST")
	apiRouter.HandleFunc("/containers/{id}/stop", containerHandler.Stop).Methods("POST")
	apiRouter.HandleFunc("/containers/{id}/restart", containerHandler.Restart).Methods("POST")
	apiRouter.HandleFunc("/containers/{id}", containerHandler.Remove).Methods("DELETE")
	apiRouter.HandleFunc("/stacks", stackHandler.List).Methods("GET")
	apiRouter.HandleFunc("/stacks", stackHandler.Create).Methods("POST")
	apiRouter.HandleFunc("/stacks/{id}/deploy", stackHandler.Deploy).Methods("POST")
	apiRouter.HandleFunc("/stacks/{id}/teardown", stackHandler.TearDown).Methods("POST")
	apiRouter.HandleFunc("/stacks/{id}", stackHandler.Delete).Methods("DELETE")
	apiRouter.HandleFunc("/stacks/{id}/compose", stackHandler.GetComposeFile).Methods("GET")
	apiRouter.HandleFunc("/stacks/{id}/compose", stackHandler.UpdateComposeFile).Methods("PUT")

	apiRouter.HandleFunc("/images", imageHandler.List).Methods("GET")
	apiRouter.HandleFunc("/images/{id}", imageHandler.Remove).Methods("DELETE")
	apiRouter.HandleFunc("/images/prune", imageHandler.Prune).Methods("POST")

	apiRouter.HandleFunc("/volumes", volumeHandler.List).Methods("GET")
	apiRouter.HandleFunc("/volumes", volumeHandler.Create).Methods("POST")
	apiRouter.HandleFunc("/volumes/{name}", volumeHandler.Remove).Methods("DELETE")
	apiRouter.HandleFunc("/volumes/prune", volumeHandler.Prune).Methods("POST")

	apiRouter.HandleFunc("/networks", networkHandler.List).Methods("GET")
	apiRouter.HandleFunc("/networks", networkHandler.Create).Methods("POST")
	apiRouter.HandleFunc("/networks/{id}", networkHandler.Remove).Methods("DELETE")
	apiRouter.HandleFunc("/networks/prune", networkHandler.Prune).Methods("POST")

	apiRouter.HandleFunc("/system/info", systemHandler.Info).Methods("GET")

	r.HandleFunc("/api/v1/ws/{containerID}", wsHandler.Stream)

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
