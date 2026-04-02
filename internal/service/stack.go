package service

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/repository"
)

type StackService struct {
	stackRepo *repository.StackRepository
	repoBase  string
}

func NewStackService(stackRepo *repository.StackRepository, repoBase string) *StackService {
	return &StackService{stackRepo: stackRepo, repoBase: repoBase}
}

func (s *StackService) List() ([]models.Stack, error) {
	return s.stackRepo.FindAll()
}

func (s *StackService) Get(id uint) (*models.Stack, error) {
	return s.stackRepo.FindByID(id)
}

func (s *StackService) Create(stack *models.Stack) error {
	return s.stackRepo.Create(stack)
}

func (s *StackService) FindByWebhookID(webhookID string) (*models.Stack, error) {
	return s.stackRepo.FindByWebhookID(webhookID)
}

func (s *StackService) Delete(id uint) error {
	stack, err := s.stackRepo.FindByID(id)
	if err != nil {
		return err
	}

	composePath := s.composePath(stack)
	_ = s.tearDown(context.Background(), stack.Name, composePath)

	return s.stackRepo.Delete(id)
}

func (s *StackService) Deploy(ctx context.Context, id uint) error {
	stack, err := s.stackRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("find stack: %w", err)
	}

	composePath := s.composePath(stack)

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composePath,
		"-p", stack.Name, "up", "-d", "--remove-orphans", "--build")
	cmd.Dir = filepath.Dir(composePath)
	out, err := cmd.CombinedOutput()

	now := time.Now()
	if err != nil {
		stack.LastStatus = models.StatusFailed
		stack.LastDeployedAt = &now
		_ = s.stackRepo.Update(stack)
		return fmt.Errorf("docker compose up: %w\nOutput: %s", err, out)
	}

	stack.LastStatus = models.StatusSuccess
	stack.LastDeployedAt = &now
	_ = s.stackRepo.Update(stack)
	return nil
}

func (s *StackService) TearDown(ctx context.Context, id uint) error {
	stack, err := s.stackRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("find stack: %w", err)
	}

	composePath := s.composePath(stack)
	return s.tearDown(ctx, stack.Name, composePath)
}

func (s *StackService) tearDown(ctx context.Context, name, composePath string) error {
	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composePath,
		"-p", name, "down")
	cmd.Dir = filepath.Dir(composePath)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker compose down: %w\nOutput: %s", err, out)
	}
	return nil
}

func (s *StackService) composePath(stack *models.Stack) string {
	if stack.StackType == models.StackTypeLocal {
		return filepath.Join(stack.LocalPath, stack.ComposePath)
	}
	repoDir := filepath.Join(s.repoBase, stack.Name)
	return filepath.Join(repoDir, stack.ComposePath)
}

func (s *StackService) DeployStream(ctx context.Context, id uint, output chan<- string) error {
	defer close(output)

	stack, err := s.stackRepo.FindByID(id)
	if err != nil {
		return fmt.Errorf("find stack: %w", err)
	}

	composePath := s.composePath(stack)

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composePath,
		"-p", stack.Name, "up", "-d", "--remove-orphans", "--build")
	cmd.Dir = filepath.Dir(composePath)

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("stdout pipe: %w", err)
	}
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("cmd start: %w", err)
	}

	var wg sync.WaitGroup
	scanPipe := func(pipe io.Reader) {
		defer wg.Done()
		scanner := bufio.NewScanner(pipe)
		for scanner.Scan() {
			line := scanner.Text()
			select {
			case output <- line:
			case <-ctx.Done():
				return
			}
		}
	}

	wg.Add(2)
	go scanPipe(stdoutPipe)
	go scanPipe(stderrPipe)
	wg.Wait()

	cmdErr := cmd.Wait()

	now := time.Now()
	if cmdErr != nil {
		stack.LastStatus = models.StatusFailed
		stack.LastDeployedAt = &now
		_ = s.stackRepo.Update(stack)
		return fmt.Errorf("docker compose up: %w", cmdErr)
	}

	stack.LastStatus = models.StatusSuccess
	stack.LastDeployedAt = &now
	_ = s.stackRepo.Update(stack)
	return nil
}

func (s *StackService) ComposePath(id uint) (string, error) {
	stack, err := s.stackRepo.FindByID(id)
	if err != nil {
		return "", err
	}
	return s.composePath(stack), nil
}

func (s *StackService) RepoDir(stack *models.Stack) string {
	return filepath.Join(s.repoBase, stack.Name)
}
