package handler

import (
	"net/http"

	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/api/middleware"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
	oidcService *service.OIDCService
}

func NewAuthHandler(authService *service.AuthService, oidcService *service.OIDCService) *AuthHandler {
	return &AuthHandler{authService: authService, oidcService: oidcService}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Role     string `json:"role"`
	} `json:"user"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Password == "" {
		api.Error(w, http.StatusBadRequest, "username and password required")
		return
	}
	token, user, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		api.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	resp := LoginResponse{Token: token}
	resp.User.ID = user.ID
	resp.User.Username = user.Username
	resp.User.Role = string(user.Role)
	api.JSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) OIDCRedirect(w http.ResponseWriter, r *http.Request) {
	if h.oidcService == nil {
		api.Error(w, http.StatusNotFound, "OIDC not configured")
		return
	}
	url, state, err := h.oidcService.AuthURL()
	if err != nil {
		api.Error(w, http.StatusInternalServerError, "failed to generate auth URL")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name: "oidc_state", Value: state, Path: "/",
		HttpOnly: true, SameSite: http.SameSiteLaxMode, MaxAge: 300,
	})
	http.Redirect(w, r, url, http.StatusFound)
}

func (h *AuthHandler) OIDCCallback(w http.ResponseWriter, r *http.Request) {
	if h.oidcService == nil {
		api.Error(w, http.StatusNotFound, "OIDC not configured")
		return
	}
	stateCookie, err := r.Cookie("oidc_state")
	if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
		api.Error(w, http.StatusBadRequest, "invalid state parameter")
		return
	}
	code := r.URL.Query().Get("code")
	if code == "" {
		api.Error(w, http.StatusBadRequest, "missing code parameter")
		return
	}
	token, _, err := h.oidcService.HandleCallback(r.Context(), code)
	if err != nil {
		api.Error(w, http.StatusInternalServerError, "OIDC callback failed")
		return
	}
	http.Redirect(w, r, "/?token="+token, http.StatusFound)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		api.Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	api.JSON(w, http.StatusOK, map[string]interface{}{
		"id": claims.UserID, "username": claims.Username, "role": claims.Role,
	})
}
