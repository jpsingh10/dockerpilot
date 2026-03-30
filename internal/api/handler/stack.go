package handler

import (
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type StackHandler struct {
	stackSvc     *service.StackService
	gitopsWorker *service.GitOpsWorker
}

func NewStackHandler(stackSvc *service.StackService, gitopsWorker *service.GitOpsWorker) *StackHandler {
	return &StackHandler{stackSvc: stackSvc, gitopsWorker: gitopsWorker}
}

type CreateStackRequest struct {
	Name        string `json:"name"`
	RepoURL     string `json:"repoUrl"`
	Branch      string `json:"branch"`
	ComposePath string `json:"composePath"`
}

func (h *StackHandler) List(w http.ResponseWriter, r *http.Request) {
	stacks, err := h.stackSvc.List()
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, stacks)
}

func (h *StackHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateStackRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" || req.RepoURL == "" {
		api.Error(w, http.StatusBadRequest, "name and repoUrl required")
		return
	}
	if req.Branch == "" {
		req.Branch = "main"
	}
	if req.ComposePath == "" {
		req.ComposePath = "docker-compose.yml"
	}
	webhookID, _ := service.RandomHex(16)
	stack := &models.Stack{
		Name: req.Name, RepoURL: req.RepoURL, Branch: req.Branch,
		ComposePath: req.ComposePath, WebhookID: webhookID,
	}
	if err := h.stackSvc.Create(stack); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusCreated, stack)
}

func (h *StackHandler) Deploy(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "invalid stack id")
		return
	}
	if err := h.stackSvc.Deploy(r.Context(), uint(id)); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "deployed"})
}

func (h *StackHandler) TearDown(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "invalid stack id")
		return
	}
	if err := h.stackSvc.TearDown(r.Context(), uint(id)); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "torn down"})
}

func (h *StackHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "invalid stack id")
		return
	}
	if err := h.stackSvc.Delete(uint(id)); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *StackHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	webhookID := mux.Vars(r)["id"]
	body, err := io.ReadAll(r.Body)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "failed to read body")
		return
	}
	defer r.Body.Close()
	stack, err := h.stackSvc.FindByWebhookID(webhookID)
	if err != nil {
		api.Error(w, http.StatusNotFound, "stack not found")
		return
	}
	signature := r.Header.Get("X-Hub-Signature-256")
	if !h.gitopsWorker.ValidateSignature(body, signature, stack.WebhookSecret) {
		api.Error(w, http.StatusUnauthorized, "invalid signature")
		return
	}
	var payload service.WebhookPayload
	if err := api.DecodeJSONBytes(body, &payload); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid payload")
		return
	}
	go h.gitopsWorker.HandleWebhook(r.Context(), stack, payload)
	api.JSON(w, http.StatusAccepted, map[string]string{"status": "accepted"})
}
