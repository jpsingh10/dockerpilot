package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	JWTSecret        string
	DBPath           string
	OIDCIssuer       string
	OIDCClientID     string
	OIDCClientSecret string
	OIDCRedirectURL  string
	RepoBasePath     string
	WebhookSecret    string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		Port:             getEnv("PORT", "8080"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
		DBPath:           getEnv("DB_PATH", "./data/dockerpilot.db"),
		OIDCIssuer:       os.Getenv("OIDC_ISSUER"),
		OIDCClientID:     os.Getenv("OIDC_CLIENT_ID"),
		OIDCClientSecret: os.Getenv("OIDC_CLIENT_SECRET"),
		OIDCRedirectURL:  getEnv("OIDC_REDIRECT_URL", "http://localhost:8080/api/v1/auth/oidc/callback"),
		RepoBasePath:     getEnv("REPO_BASE_PATH", "./repos"),
		WebhookSecret:    os.Getenv("WEBHOOK_SECRET"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
