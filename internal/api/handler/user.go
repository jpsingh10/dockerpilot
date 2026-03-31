package handler

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/api/middleware"
	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/repository"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type UserHandler struct {
	userRepo    *repository.UserRepository
	authService *service.AuthService
}

func NewUserHandler(userRepo *repository.UserRepository, authService *service.AuthService) *UserHandler {
	return &UserHandler{userRepo: userRepo, authService: authService}
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type UpdateUserRequest struct {
	Email    string `json:"email,omitempty"`
	Role     string `json:"role,omitempty"`
	Password string `json:"password,omitempty"`
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.userRepo.FindAll()
	if err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, users)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		api.Error(w, http.StatusBadRequest, "username, email, and password are required")
		return
	}
	role := models.Role(req.Role)
	if role != models.RoleAdmin && role != models.RoleUser && role != models.RoleViewer {
		role = models.RoleViewer
	}
	hash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		api.Error(w, http.StatusInternalServerError, "failed to hash password")
		return
	}
	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hash,
		Role:         role,
	}
	if err := h.userRepo.Create(user); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusCreated, user)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}
	user, err := h.userRepo.FindByID(uint(id))
	if err != nil {
		api.Error(w, http.StatusNotFound, "user not found")
		return
	}
	var req UpdateUserRequest
	if err := api.DecodeJSON(r, &req); err != nil {
		api.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Role != "" {
		role := models.Role(req.Role)
		if role == models.RoleAdmin || role == models.RoleUser || role == models.RoleViewer {
			user.Role = role
		}
	}
	if req.Password != "" {
		hash, err := h.authService.HashPassword(req.Password)
		if err != nil {
			api.Error(w, http.StatusInternalServerError, "failed to hash password")
			return
		}
		user.PasswordHash = hash
	}
	if err := h.userRepo.Update(user); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseUint(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		api.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}
	claims := middleware.GetClaims(r)
	if claims != nil && claims.UserID == uint(id) {
		api.Error(w, http.StatusBadRequest, "cannot delete yourself")
		return
	}
	if err := h.userRepo.Delete(uint(id)); err != nil {
		api.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
