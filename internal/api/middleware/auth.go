package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/service"
)

type contextKey string

const ClaimsKey contextKey = "claims"

type AuthMiddleware struct {
	authService *service.AuthService
}

func NewAuthMiddleware(authService *service.AuthService) *AuthMiddleware {
	return &AuthMiddleware{authService: authService}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			api.Error(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			api.Error(w, http.StatusUnauthorized, "invalid authorization format")
			return
		}

		claims, err := m.authService.ValidateToken(parts[1])
		if err != nil {
			api.Error(w, http.StatusUnauthorized, "invalid token")
			return
		}

		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetClaims(r *http.Request) *service.Claims {
	claims, _ := r.Context().Value(ClaimsKey).(*service.Claims)
	return claims
}
