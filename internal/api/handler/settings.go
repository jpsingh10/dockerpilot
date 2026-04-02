package handler

import (
	"net/http"

	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/config"
	"github.com/dockerpilot/dockerpilot/internal/repository"
)

type SettingsHandler struct {
	settingsRepo *repository.SettingsRepository
	cfg          *config.Config
}

func NewSettingsHandler(settingsRepo *repository.SettingsRepository, cfg *config.Config) *SettingsHandler {
	return &SettingsHandler{settingsRepo: settingsRepo, cfg: cfg}
}

type OIDCSettingsResponse struct {
	Issuer      string `json:"issuer"`
	ClientID    string `json:"clientId"`
	RedirectURL string `json:"redirectUrl"`
	Enabled     bool   `json:"enabled"`
}

type OIDCSettingsRequest struct {
	Issuer       string `json:"issuer"`
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
	RedirectURL  string `json:"redirectUrl"`
}

var oidcKeys = []string{"oidc_issuer", "oidc_client_id", "oidc_client_secret", "oidc_redirect_url"}

func (h *SettingsHandler) GetOIDC(w http.ResponseWriter, r *http.Request) {
	dbSettings, _ := h.settingsRepo.GetMulti(oidcKeys)

	issuer := dbSettings["oidc_issuer"]
	if issuer == "" {
		issuer = h.cfg.OIDCIssuer
	}
	clientID := dbSettings["oidc_client_id"]
	if clientID == "" {
		clientID = h.cfg.OIDCClientID
	}
	redirectURL := dbSettings["oidc_redirect_url"]
	if redirectURL == "" {
		redirectURL = h.cfg.OIDCRedirectURL
	}

	api.JSON(w, http.StatusOK, OIDCSettingsResponse{
		Issuer:      issuer,
		ClientID:    clientID,
		RedirectURL: redirectURL,
		Enabled:     issuer != "",
	})
}

func (h *SettingsHandler) UpdateOIDC(w http.ResponseWriter, r *http.Request) {
	var req OIDCSettingsRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	pairs := map[string]string{
		"oidc_issuer":        req.Issuer,
		"oidc_client_id":     req.ClientID,
		"oidc_redirect_url":  req.RedirectURL,
	}
	if req.ClientSecret != "" {
		pairs["oidc_client_secret"] = req.ClientSecret
	}

	if err := h.settingsRepo.SetMulti(pairs); err != nil {
		api.Error(w, http.StatusInternalServerError, "failed to save OIDC settings")
		return
	}

	api.JSON(w, http.StatusOK, map[string]string{"status": "saved", "note": "Restart required for changes to take effect"})
}

type GitSettingsResponse struct {
	RepoURL string `json:"repoUrl"`
	Branch  string `json:"branch"`
	Token   string `json:"token"`
}

type GitSettingsRequest struct {
	RepoURL string `json:"repoUrl"`
	Branch  string `json:"branch"`
	Token   string `json:"token"`
}

var gitKeys = []string{"git_repo_url", "git_branch", "git_token"}

func (h *SettingsHandler) GetGitSettings(w http.ResponseWriter, r *http.Request) {
	dbSettings, _ := h.settingsRepo.GetMulti(gitKeys)

	api.JSON(w, http.StatusOK, GitSettingsResponse{
		RepoURL: dbSettings["git_repo_url"],
		Branch:  dbSettings["git_branch"],
		Token:   dbSettings["git_token"],
	})
}

func (h *SettingsHandler) UpdateGitSettings(w http.ResponseWriter, r *http.Request) {
	var req GitSettingsRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	pairs := map[string]string{
		"git_repo_url": req.RepoURL,
		"git_branch":   req.Branch,
	}
	if req.Token != "" {
		pairs["git_token"] = req.Token
	}

	if err := h.settingsRepo.SetMulti(pairs); err != nil {
		api.Error(w, http.StatusInternalServerError, "failed to save Git settings")
		return
	}

	api.JSON(w, http.StatusOK, map[string]string{"status": "saved"})
}
