package handler

import (
	"net/http"

	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type SystemHandler struct {
	docker *service.DockerManager
}

func NewSystemHandler(docker *service.DockerManager) *SystemHandler {
	return &SystemHandler{docker: docker}
}

func (h *SystemHandler) Info(w http.ResponseWriter, r *http.Request) {
	info, err := h.docker.Info(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, info)
}
