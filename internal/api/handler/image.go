package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type ImageHandler struct {
	docker *service.DockerManager
}

func NewImageHandler(docker *service.DockerManager) *ImageHandler {
	return &ImageHandler{docker: docker}
}

func (h *ImageHandler) List(w http.ResponseWriter, r *http.Request) {
	images, err := h.docker.ListImages(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if images == nil {
		images = []service.ImageInfo{}
	}
	api.JSON(w, http.StatusOK, images)
}

func (h *ImageHandler) Remove(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	force := r.URL.Query().Get("force") == "true"
	if err := h.docker.RemoveImage(r.Context(), id, force); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (h *ImageHandler) Prune(w http.ResponseWriter, r *http.Request) {
	output, err := h.docker.PruneImages(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "pruned", "output": output})
}
