package service

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/dockerpilot/dockerpilot/internal/models"
	"github.com/dockerpilot/dockerpilot/internal/repository"
	"gorm.io/gorm"
)

type StackScanner struct {
	stackRepo    *repository.StackRepository
	stacksDir    string
	scanInterval int
}

func NewStackScanner(stackRepo *repository.StackRepository, stacksDir string, scanInterval int) *StackScanner {
	return &StackScanner{
		stackRepo:    stackRepo,
		stacksDir:    stacksDir,
		scanInterval: scanInterval,
	}
}

func (s *StackScanner) Start(ctx context.Context) {
	// Run an initial scan immediately
	s.scan()

	ticker := time.NewTicker(time.Duration(s.scanInterval) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("[scanner] stopping")
			return
		case <-ticker.C:
			s.scan()
		}
	}
}

func (s *StackScanner) scan() {
	entries, err := os.ReadDir(s.stacksDir)
	if err != nil {
		log.Printf("[scanner] failed to read stacks dir %s: %v", s.stacksDir, err)
		return
	}

	discovered := make(map[string]bool)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		dirName := entry.Name()
		dirPath := filepath.Join(s.stacksDir, dirName)

		// Check for compose file
		composePath := ""
		if _, err := os.Stat(filepath.Join(dirPath, "docker-compose.yml")); err == nil {
			composePath = "docker-compose.yml"
		} else if _, err := os.Stat(filepath.Join(dirPath, "compose.yaml")); err == nil {
			composePath = "compose.yaml"
		}

		if composePath == "" {
			continue
		}

		discovered[dirName] = true

		existing, err := s.stackRepo.FindByName(dirName)
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Printf("[scanner] error looking up stack %s: %v", dirName, err)
			continue
		}

		if existing != nil {
			// Skip git stacks — don't overwrite
			if existing.StackType == models.StackTypeGit {
				continue
			}
			// Already tracked as local, nothing to do
			continue
		}

		// Create new local stack
		stack := &models.Stack{
			Name:        dirName,
			StackType:   models.StackTypeLocal,
			LocalPath:   dirPath,
			ComposePath: composePath,
		}
		if err := s.stackRepo.Create(stack); err != nil {
			log.Printf("[scanner] failed to create stack %s: %v", dirName, err)
			continue
		}
		log.Printf("[scanner] discovered local stack: %s (%s)", dirName, dirPath)
	}

	// Clean up local stacks whose directories no longer exist
	localStacks, err := s.stackRepo.FindByStackType(models.StackTypeLocal)
	if err != nil {
		log.Printf("[scanner] failed to query local stacks: %v", err)
		return
	}

	for _, stack := range localStacks {
		if _, err := os.Stat(stack.LocalPath); os.IsNotExist(err) {
			if err := s.stackRepo.Delete(stack.ID); err != nil {
				log.Printf("[scanner] failed to remove stack %s: %v", stack.Name, err)
				continue
			}
			log.Printf("[scanner] removed local stack: %s (directory gone)", stack.Name)
		}
	}
}
