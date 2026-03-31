package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type VolumeHandler struct {
	docker *service.DockerManager
}

func NewVolumeHandler(docker *service.DockerManager) *VolumeHandler {
	return &VolumeHandler{docker: docker}
}

func (h *VolumeHandler) List(w http.ResponseWriter, r *http.Request) {
	volumes, err := h.docker.ListVolumes(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if volumes == nil {
		volumes = []service.VolumeInfo{}
	}
	api.JSON(w, http.StatusOK, volumes)
}

func (h *VolumeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req service.CreateVolumeRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		api.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if err := h.docker.CreateVolume(r.Context(), req); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusCreated, map[string]string{"status": "created"})
}

func (h *VolumeHandler) Remove(w http.ResponseWriter, r *http.Request) {
	name := mux.Vars(r)["name"]
	if err := h.docker.RemoveVolume(r.Context(), name); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (h *VolumeHandler) Prune(w http.ResponseWriter, r *http.Request) {
	output, err := h.docker.PruneVolumes(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "pruned", "output": output})
}
