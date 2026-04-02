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
		var token string

		// Check Authorization header first
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				token = parts[1]
			}
		}

		// Fall back to query param (for EventSource/SSE which can't set headers)
		if token == "" {
			token = r.URL.Query().Get("token")
		}

		if token == "" {
			api.Error(w, http.StatusUnauthorized, "missing authorization")
			return
		}

		claims, err := m.authService.ValidateToken(token)
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
