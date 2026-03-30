package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/repository"
	"github.com/dockerpilot/dockerpilot/internal/ws"
)

type GitOpsWorker struct {
	stackRepo *repository.StackRepository
	stackSvc  *StackService
	hub       *ws.Hub
	repoBase  string
}

func NewGitOpsWorker(
	stackRepo *repository.StackRepository,
	stackSvc *StackService,
	hub *ws.Hub,
	repoBase string,
) *GitOpsWorker {
	return &GitOpsWorker{
		stackRepo: stackRepo,
		stackSvc:  stackSvc,
		hub:       hub,
		repoBase:  repoBase,
	}
}

type WebhookPayload struct {
	Ref        string `json:"ref"`
	After      string `json:"after"`
	Repository struct {
		CloneURL string `json:"clone_url"`
		FullName string `json:"full_name"`
	} `json:"repository"`
}

func (w *GitOpsWorker) ValidateSignature(payload []byte, signature, secret string) bool {
	if secret == "" {
		return true
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(signature))
}

func (w *GitOpsWorker) HandleWebhook(ctx context.Context, stack *models.Stack, payload WebhookPayload) {
	log.Printf("[gitops] webhook received for stack %s, commit %s", stack.Name, payload.After)

	w.hub.BroadcastAll(ws.Message{
		Type:      ws.MsgEvent,
		Payload:   map[string]string{"event": "deploy_started", "stack": stack.Name, "commit": payload.After},
		Timestamp: time.Now(),
	})

	repoDir := filepath.Join(w.repoBase, stack.Name)

	if err := w.cloneOrPull(ctx, stack, repoDir); err != nil {
		w.failDeploy(stack, fmt.Sprintf("git pull failed: %v", err))
		return
	}

	stack.LastCommit = payload.After

	if err := w.stackSvc.Deploy(ctx, stack.ID); err != nil {
		w.failDeploy(stack, fmt.Sprintf("deploy failed: %v", err))
		return
	}

	log.Printf("[gitops] deploy succeeded for stack %s", stack.Name)
	w.hub.BroadcastAll(ws.Message{
		Type:      ws.MsgEvent,
		Payload:   map[string]string{"event": "deploy_success", "stack": stack.Name, "commit": payload.After},
		Timestamp: time.Now(),
	})
}

func (w *GitOpsWorker) cloneOrPull(ctx context.Context, stack *models.Stack, repoDir string) error {
	if _, err := os.Stat(filepath.Join(repoDir, ".git")); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(repoDir), 0755); err != nil {
			return fmt.Errorf("mkdir: %w", err)
		}
		cmd := exec.CommandContext(ctx, "git", "clone", "--branch", stack.Branch,
			"--single-branch", "--depth", "1", stack.RepoURL, repoDir)
		out, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("git clone: %w\n%s", err, out)
		}
		return nil
	}

	cmd := exec.CommandContext(ctx, "git", "-C", repoDir, "pull", "origin", stack.Branch)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git pull: %w\n%s", err, out)
	}
	return nil
}

func (w *GitOpsWorker) failDeploy(stack *models.Stack, errMsg string) {
	log.Printf("[gitops] deploy failed for stack %s: %s", stack.Name, errMsg)

	now := time.Now()
	stack.LastStatus = models.StatusFailed
	stack.LastDeployedAt = &now
	_ = w.stackRepo.Update(stack)

	w.hub.BroadcastAll(ws.Message{
		Type:      ws.MsgError,
		Payload:   map[string]string{"event": "deploy_failed", "stack": stack.Name, "error": errMsg},
		Timestamp: time.Now(),
	})
}
