package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"
)

type MetricsSnapshot struct {
	Timestamp time.Time `json:"timestamp"`
	CPUPerc   string    `json:"cpuPerc"`
	MemPerc   string    `json:"memPerc"`
	MemUsage  string    `json:"memUsage"`
	NetIO     string    `json:"netIO"`
	BlockIO   string    `json:"blockIO"`
}

type MetricsCollector struct {
	docker *DockerManager
}

func NewMetricsCollector(docker *DockerManager) *MetricsCollector {
	return &MetricsCollector{docker: docker}
}

func (c *MetricsCollector) StreamMetrics(ctx context.Context, containerID string, interval time.Duration) (<-chan MetricsSnapshot, error) {
	_, err := exec.CommandContext(ctx, "docker", "inspect", "--format", "{{.State.Status}}", containerID).Output()
	if err != nil {
		return nil, fmt.Errorf("container %s not found: %w", containerID, err)
	}

	ch := make(chan MetricsSnapshot, 10)

	go func() {
		defer close(ch)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				stats, err := c.docker.Stats(ctx, containerID)
				if err != nil {
					log.Printf("metrics error for %s: %v", containerID, err)
					continue
				}
				snapshot := MetricsSnapshot{
					Timestamp: time.Now(),
					CPUPerc:   strings.TrimSuffix(stats.CPUPerc, "%"),
					MemPerc:   strings.TrimSuffix(stats.MemPerc, "%"),
					MemUsage:  stats.MemUsage,
					NetIO:     stats.NetIO,
					BlockIO:   stats.BlockIO,
				}
				select {
				case ch <- snapshot:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return ch, nil
}

func (c *MetricsCollector) AllContainerStats(ctx context.Context) ([]ContainerStats, error) {
	out, err := exec.CommandContext(ctx, "docker", "stats",
		"--no-stream", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker stats: %w", err)
	}

	var stats []ContainerStats
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var s ContainerStats
		if err := json.Unmarshal([]byte(line), &s); err != nil {
			continue
		}
		stats = append(stats, s)
	}
	return stats, nil
}
