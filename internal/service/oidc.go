package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/dockerpilot/dockerpilot/internal/config"
	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/repository"
	"golang.org/x/oauth2"
)

type OIDCService struct {
	provider    *oidc.Provider
	oauth2Conf  *oauth2.Config
	verifier    *oidc.IDTokenVerifier
	authService *AuthService
	userRepo    *repository.UserRepository
}

func NewOIDCService(cfg *config.Config, authService *AuthService, userRepo *repository.UserRepository) (*OIDCService, error) {
	if cfg.OIDCIssuer == "" {
		return nil, nil
	}

	ctx := context.Background()
	provider, err := oidc.NewProvider(ctx, cfg.OIDCIssuer)
	if err != nil {
		return nil, fmt.Errorf("oidc provider: %w", err)
	}

	oauth2Conf := &oauth2.Config{
		ClientID:     cfg.OIDCClientID,
		ClientSecret: cfg.OIDCClientSecret,
		RedirectURL:  cfg.OIDCRedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	verifier := provider.Verifier(&oidc.Config{ClientID: cfg.OIDCClientID})

	return &OIDCService{
		provider:    provider,
		oauth2Conf:  oauth2Conf,
		verifier:    verifier,
		authService: authService,
		userRepo:    userRepo,
	}, nil
}

func (s *OIDCService) AuthURL() (string, string, error) {
	state, err := RandomHex(16)
	if err != nil {
		return "", "", err
	}
	url := s.oauth2Conf.AuthCodeURL(state)
	return url, state, nil
}

func (s *OIDCService) HandleCallback(ctx context.Context, code string) (string, *models.User, error) {
	token, err := s.oauth2Conf.Exchange(ctx, code)
	if err != nil {
		return "", nil, fmt.Errorf("token exchange: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return "", nil, errors.New("no id_token in response")
	}

	idToken, err := s.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", nil, fmt.Errorf("verify id_token: %w", err)
	}

	var claims struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"preferred_username"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return "", nil, fmt.Errorf("parse claims: %w", err)
	}

	if claims.Name == "" {
		claims.Name = claims.Email
	}

	user, err := s.userRepo.FindByOIDCSub(claims.Sub)
	if err != nil {
		user = &models.User{
			Username:     claims.Name,
			Email:        claims.Email,
			OIDCSub:      claims.Sub,
			Role:         models.RoleViewer,
			PasswordHash: "-",
		}
		if err := s.userRepo.Create(user); err != nil {
			return "", nil, fmt.Errorf("create user: %w", err)
		}
	}

	jwtToken, err := s.authService.GenerateToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("generate jwt: %w", err)
	}

	return jwtToken, user, nil
}

func RandomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
