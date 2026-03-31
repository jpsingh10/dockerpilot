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

// --- Image types and methods ---

type ImageInfo struct {
	ID           string `json:"ID"`
	Repository   string `json:"Repository"`
	Tag          string `json:"Tag"`
	Size         string `json:"Size"`
	CreatedAt    string `json:"CreatedAt"`
	CreatedSince string `json:"CreatedSince"`
}

func (d *DockerManager) ListImages(ctx context.Context) ([]ImageInfo, error) {
	out, err := exec.CommandContext(ctx, "docker", "images", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker images: %w", err)
	}

	var images []ImageInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var img ImageInfo
		if err := json.Unmarshal([]byte(line), &img); err != nil {
			continue
		}
		images = append(images, img)
	}
	return images, nil
}

func (d *DockerManager) RemoveImage(ctx context.Context, id string, force bool) error {
	args := []string{"rmi"}
	if force {
		args = append(args, "-f")
	}
	args = append(args, id)
	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker rmi %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) PruneImages(ctx context.Context) (string, error) {
	out, err := exec.CommandContext(ctx, "docker", "image", "prune", "-af").CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker image prune: %w\n%s", err, out)
	}
	return strings.TrimSpace(string(out)), nil
}

// --- Volume types and methods ---

type VolumeInfo struct {
	Name       string `json:"Name"`
	Driver     string `json:"Driver"`
	Scope      string `json:"Scope"`
	Mountpoint string `json:"Mountpoint"`
	CreatedAt  string `json:"CreatedAt"`
	Labels     string `json:"Labels"`
}

type CreateVolumeRequest struct {
	Name   string            `json:"name"`
	Driver string            `json:"driver"`
	Labels map[string]string `json:"labels"`
}

func (d *DockerManager) ListVolumes(ctx context.Context) ([]VolumeInfo, error) {
	out, err := exec.CommandContext(ctx, "docker", "volume", "ls", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker volume ls: %w", err)
	}

	var volumes []VolumeInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var v VolumeInfo
		if err := json.Unmarshal([]byte(line), &v); err != nil {
			continue
		}
		volumes = append(volumes, v)
	}
	return volumes, nil
}

func (d *DockerManager) CreateVolume(ctx context.Context, req CreateVolumeRequest) error {
	args := []string{"volume", "create"}
	if req.Driver != "" {
		args = append(args, "--driver", req.Driver)
	}
	for k, v := range req.Labels {
		args = append(args, "--label", k+"="+v)
	}
	args = append(args, req.Name)
	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker volume create: %w\n%s", err, out)
	}
	return nil
}

func (d *DockerManager) RemoveVolume(ctx context.Context, name string) error {
	out, err := exec.CommandContext(ctx, "docker", "volume", "rm", name).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker volume rm %s: %w\n%s", name, err, out)
	}
	return nil
}

func (d *DockerManager) PruneVolumes(ctx context.Context) (string, error) {
	out, err := exec.CommandContext(ctx, "docker", "volume", "prune", "-af").CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker volume prune: %w\n%s", err, out)
	}
	return strings.TrimSpace(string(out)), nil
}

// --- Network types and methods ---

type NetworkInfo struct {
	ID     string `json:"ID"`
	Name   string `json:"Name"`
	Driver string `json:"Driver"`
	Scope  string `json:"Scope"`
}

type NetworkDetail struct {
	ID     string `json:"Id"`
	Name   string `json:"Name"`
	Driver string `json:"Driver"`
	Scope  string `json:"Scope"`
	IPAM   struct {
		Config []struct {
			Subnet  string `json:"Subnet"`
			Gateway string `json:"Gateway"`
		} `json:"Config"`
	} `json:"IPAM"`
	Containers map[string]interface{} `json:"Containers"`
}

type CreateNetworkRequest struct {
	Name     string `json:"name"`
	Driver   string `json:"driver"`
	Subnet   string `json:"subnet"`
	Gateway  string `json:"gateway"`
	Internal bool   `json:"internal"`
}

func (d *DockerManager) ListNetworks(ctx context.Context) ([]NetworkInfo, error) {
	out, err := exec.CommandContext(ctx, "docker", "network", "ls", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker network ls: %w", err)
	}

	var networks []NetworkInfo
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		if line == "" {
			continue
		}
		var n NetworkInfo
		if err := json.Unmarshal([]byte(line), &n); err != nil {
			continue
		}
		networks = append(networks, n)
	}
	return networks, nil
}

func (d *DockerManager) InspectNetwork(ctx context.Context, id string) (*NetworkDetail, error) {
	out, err := exec.CommandContext(ctx, "docker", "network", "inspect", id).Output()
	if err != nil {
		return nil, fmt.Errorf("docker network inspect %s: %w", id, err)
	}

	var details []NetworkDetail
	if err := json.Unmarshal(out, &details); err != nil {
		return nil, fmt.Errorf("parse network inspect: %w", err)
	}
	if len(details) == 0 {
		return nil, fmt.Errorf("network %s not found", id)
	}
	return &details[0], nil
}

func (d *DockerManager) CreateNetwork(ctx context.Context, req CreateNetworkRequest) error {
	args := []string{"network", "create"}
	if req.Driver != "" {
		args = append(args, "--driver", req.Driver)
	}
	if req.Subnet != "" {
		args = append(args, "--subnet", req.Subnet)
	}
	if req.Gateway != "" {
		args = append(args, "--gateway", req.Gateway)
	}
	if req.Internal {
		args = append(args, "--internal")
	}
	args = append(args, req.Name)
	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker network create: %w\n%s", err, out)
	}
	return nil
}

func (d *DockerManager) RemoveNetwork(ctx context.Context, id string) error {
	out, err := exec.CommandContext(ctx, "docker", "network", "rm", id).CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker network rm %s: %w\n%s", id, err, out)
	}
	return nil
}

func (d *DockerManager) PruneNetworks(ctx context.Context) (string, error) {
	out, err := exec.CommandContext(ctx, "docker", "network", "prune", "-f").CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker network prune: %w\n%s", err, out)
	}
	return strings.TrimSpace(string(out)), nil
}

// --- System types and methods ---

type DockerInfoResult struct {
	ServerVersion     string `json:"ServerVersion"`
	NCPU              int    `json:"NCPU"`
	MemTotal          int64  `json:"MemTotal"`
	Images            int    `json:"Images"`
	Containers        int    `json:"Containers"`
	ContainersRunning int    `json:"ContainersRunning"`
	ContainersStopped int    `json:"ContainersStopped"`
}

func (d *DockerManager) Info(ctx context.Context) (*DockerInfoResult, error) {
	out, err := exec.CommandContext(ctx, "docker", "info", "--format", "{{json .}}").Output()
	if err != nil {
		return nil, fmt.Errorf("docker info: %w", err)
	}

	var info DockerInfoResult
	if err := json.Unmarshal([]byte(strings.TrimSpace(string(out))), &info); err != nil {
		return nil, fmt.Errorf("parse docker info: %w", err)
	}
	return &info, nil
}
