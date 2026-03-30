package service

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
)

type DockerManager struct{}

func NewDockerManager() *DockerManager {
	return &DockerManager{}
}

type ContainerInfo struct {
	ID      string `json:"ID"`
	Names   string `json:"Names"`
	Image   string `json:"Image"`
	Status  string `json:"Status"`
	State   string `json:"State"`
	Ports   string `json:"Ports"`
	Labels  string `json:"Labels"`
	Created string `json:"CreatedAt"`
}

type CreateContainerRequest struct {
	Image     string   `json:"image"`
	Name      string   `json:"name"`
	Ports     []string `json:"ports"`
	Volumes   []string `json:"volumes"`
	Env       []string `json:"env"`
	ForcePull bool     `json:"forcePull"`
}

func (d *DockerManager) Ping(ctx context.Context) error {
	if ctx == nil {
		ctx = context.Background()
	}
	return exec.CommandContext(ctx, "docker", "info").Run()
}

func (d *DockerManager) ListContainers(ctx context.Context) ([]ContainerInfo, error) {
	out, err := exec.CommandContext(ctx, "docker", "ps", "--all", "--no-trunc",
		"--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker ps: %w", err)
	}

	var containers []ContainerInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var c ContainerInfo
		if err := json.Unmarshal([]byte(line), &c); err != nil {
			continue
		}
		containers = append(containers, c)
	}
	return containers, nil
}

func (d *DockerManager) InspectContainer(ctx context.Context, id string) (json.RawMessage, error) {
	out, err := exec.CommandContext(ctx, "docker", "inspect", id).Output()
	if err != nil {
		return nil, fmt.Errorf("docker inspect %s: %w", id, err)
	}
	return json.RawMessage(out), nil
}

func (d *DockerManager) Start(ctx context.Context, id string) error {
	out, err := exec.CommandContext(ctx, "docker", "start", id).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker start %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) Stop(ctx context.Context, id string) error {
	out, err := exec.CommandContext(ctx, "docker", "stop", id).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker stop %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) Restart(ctx context.Context, id string) error {
	out, err := exec.CommandContext(ctx, "docker", "restart", id).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker restart %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) Remove(ctx context.Context, id string, force bool) error {
	args := []string{"rm"}
	if force {
		args = append(args, "-f")
	}
	args = append(args, id)
	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker rm %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) Create(ctx context.Context, req CreateContainerRequest) (string, error) {
	if req.Image == "" {
		return "", fmt.Errorf("image is required")
	}

	if req.ForcePull {
		pullOut, err := exec.CommandContext(ctx, "docker", "pull", req.Image).CombinedOutput()
		if err != nil {
			return "", fmt.Errorf("docker pull %s: %w\n%s", req.Image, err, pullOut)
		}
	}

	args := []string{"run", "-d"}
	if req.Name != "" {
		args = append(args, "--name", req.Name)
	}
	for _, p := range req.Ports {
		args = append(args, "-p", p)
	}
	for _, v := range req.Volumes {
		args = append(args, "-v", v)
	}
	for _, e := range req.Env {
		args = append(args, "-e", e)
	}
	args = append(args, req.Image)

	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker run: %w\n%s", err, out)
	}

	return strings.TrimSpace(string(out)), nil
}

type ContainerStats struct {
	CPUPerc  string `json:"CPUPerc"`
	MemPerc  string `json:"MemPerc"`
	MemUsage string `json:"MemUsage"`
	NetIO    string `json:"NetIO"`
	BlockIO  string `json:"BlockIO"`
	Name     string `json:"Name"`
	ID       string `json:"ID"`
}

func (d *DockerManager) Stats(ctx context.Context, id string) (*ContainerStats, error) {
	out, err := exec.CommandContext(ctx, "docker", "stats", id,
		"--no-stream", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker stats %s: %w", id, err)
	}

	var stats ContainerStats
	if err := json.Unmarshal([]byte(strings.TrimSpace(string(out))), &stats); err != nil {
		return nil, fmt.Errorf("parse stats: %w", err)
	}
	return &stats, nil
}
