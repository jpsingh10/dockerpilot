package service

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os/exec"
	"sync"
	"time"
)

type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Line      string    `json:"line"`
}

type RingBuffer struct {
	mu   sync.RWMutex
	buf  []LogEntry
	head int
	size int
	cap  int
}

func NewRingBuffer(capacity int) *RingBuffer {
	return &RingBuffer{
		buf: make([]LogEntry, capacity),
		cap: capacity,
	}
}

func (r *RingBuffer) Push(entry LogEntry) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.buf[r.head] = entry
	r.head = (r.head + 1) % r.cap
	if r.size < r.cap {
		r.size++
	}
}

func (r *RingBuffer) Tail(n int) []LogEntry {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if n > r.size {
		n = r.size
	}
	result := make([]LogEntry, n)
	start := (r.head - n + r.cap) % r.cap
	for i := 0; i < n; i++ {
		result[i] = r.buf[(start+i)%r.cap]
	}
	return result
}

type LogManager struct {
	mu      sync.RWMutex
	buffers map[string]*RingBuffer
	cancels map[string]context.CancelFunc
}

func NewLogManager() *LogManager {
	return &LogManager{
		buffers: make(map[string]*RingBuffer),
		cancels: make(map[string]context.CancelFunc),
	}
}

const logBufferSize = 10000

func (m *LogManager) GetOrStartBuffer(containerID string) *RingBuffer {
	m.mu.Lock()
	defer m.mu.Unlock()

	if buf, ok := m.buffers[containerID]; ok {
		return buf
	}

	buf := NewRingBuffer(logBufferSize)
	m.buffers[containerID] = buf

	ctx, cancel := context.WithCancel(context.Background())
	m.cancels[containerID] = cancel

	go m.streamLogs(ctx, containerID, buf)
	return buf
}

func (m *LogManager) streamLogs(ctx context.Context, containerID string, buf *RingBuffer) {
	cmd := exec.CommandContext(ctx, "docker", "logs", "-f", "--tail", "500", containerID)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("log stream pipe error for %s: %v", containerID, err)
		return
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		log.Printf("log stream start error for %s: %v", containerID, err)
		return
	}

	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 64*1024), 64*1024)
	for scanner.Scan() {
		buf.Push(LogEntry{
			Timestamp: time.Now(),
			Line:      scanner.Text(),
		})
	}

	_ = cmd.Wait()
}

func (m *LogManager) StopBuffer(containerID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if cancel, ok := m.cancels[containerID]; ok {
		cancel()
		delete(m.cancels, containerID)
		delete(m.buffers, containerID)
	}
}

func (m *LogManager) StreamLogs(ctx context.Context, containerID string) (<-chan string, error) {
	ch := make(chan string, 100)

	cmd := exec.CommandContext(ctx, "docker", "logs", "-f", "--tail", "100", containerID)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("pipe: %w", err)
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start: %w", err)
	}

	go func() {
		defer close(ch)
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 64*1024), 64*1024)
		for scanner.Scan() {
			select {
			case ch <- scanner.Text():
			case <-ctx.Done():
				_ = cmd.Process.Kill()
				return
			}
		}
		_ = cmd.Wait()
	}()

	return ch, nil
}
