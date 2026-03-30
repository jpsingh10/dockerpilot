package middleware

import (
	"net/http"

	"github.com/dockerpilot/dockerpilot/internal/api"
	"github.com/dockerpilot/dockerpilot/internal/models"
)

func RequireRole(role models.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r)
			if claims == nil {
				api.Error(w, http.StatusUnauthorized, "not authenticated")
				return
			}
			if models.Role(claims.Role) != models.RoleAdmin && models.Role(claims.Role) != role {
				api.Error(w, http.StatusForbidden, "insufficient permissions")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func AdminOnly(next http.Handler) http.Handler {
	return RequireRole(models.RoleAdmin)(next)
}
