package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type ContainerHandler struct {
	docker *service.DockerManager
}

func NewContainerHandler(docker *service.DockerManager) *ContainerHandler {
	return &ContainerHandler{docker: docker}
}

func (h *ContainerHandler) List(w http.ResponseWriter, r *http.Request) {
	containers, err := h.docker.ListContainersDetailed(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if containers == nil {
		containers = []service.ContainerDetailed{}
	}
	api.JSON(w, http.StatusOK, containers)
}

func (h *ContainerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req service.CreateContainerRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	id, err := h.docker.Create(r.Context(), req)
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusCreated, map[string]string{"id": id})
}

func (h *ContainerHandler) Start(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := h.docker.Start(r.Context(), id); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "started"})
}

func (h *ContainerHandler) Stop(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := h.docker.Stop(r.Context(), id); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "stopped"})
}

func (h *ContainerHandler) Restart(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := h.docker.Restart(r.Context(), id); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "restarted"})
}

func (h *ContainerHandler) Remove(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	force := r.URL.Query().Get("force") == "true"
	if err := h.docker.Remove(r.Context(), id, force); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "removed"})
}
