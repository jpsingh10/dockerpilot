package handler

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type NetworkHandler struct {
	docker *service.DockerManager
}

func NewNetworkHandler(docker *service.DockerManager) *NetworkHandler {
	return &NetworkHandler{docker: docker}
}

type NetworkListItem struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Driver     string `json:"driver"`
	Scope      string `json:"scope"`
	Subnet     string `json:"subnet"`
	Gateway    string `json:"gateway"`
	Containers int    `json:"containers"`
}

func (h *NetworkHandler) List(w http.ResponseWriter, r *http.Request) {
	networks, err := h.docker.ListNetworks(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	items := make([]NetworkListItem, 0, len(networks))
	for _, n := range networks {
		item := NetworkListItem{
			ID:     n.ID,
			Name:   n.Name,
			Driver: n.Driver,
			Scope:  n.Scope,
		}
		detail, err := h.docker.InspectNetwork(r.Context(), n.ID)
		if err == nil {
			if len(detail.IPAM.Config) > 0 {
				item.Subnet = detail.IPAM.Config[0].Subnet
				item.Gateway = detail.IPAM.Config[0].Gateway
			}
			item.Containers = len(detail.Containers)
		}
		items = append(items, item)
	}
	api.JSON(w, http.StatusOK, items)
}

func (h *NetworkHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req service.CreateNetworkRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		api.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if err := h.docker.CreateNetwork(r.Context(), req); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusCreated, map[string]string{"status": "created"})
}

func (h *NetworkHandler) Remove(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := h.docker.RemoveNetwork(r.Context(), id); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

func (h *NetworkHandler) Prune(w http.ResponseWriter, r *http.Request) {
	output, err := h.docker.PruneNetworks(r.Context())
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "pruned", "output": output})
}
