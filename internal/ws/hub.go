package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type MessageType string

const (
	MsgLog    MessageType = "log"
	MsgMetric MessageType = "metric"
	MsgEvent  MessageType = "event"
	MsgError  MessageType = "error"
)

type Message struct {
	Type      MessageType `json:"type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

type Client struct {
	Conn        *websocket.Conn
	Send        chan []byte
	ContainerID string
	Hub         *Hub
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Subscribe(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[c.ContainerID] == nil {
		h.clients[c.ContainerID] = make(map[*Client]bool)
	}
	h.clients[c.ContainerID][c] = true
}

func (h *Hub) Unsubscribe(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if clients, ok := h.clients[c.ContainerID]; ok {
		delete(clients, c)
		if len(clients) == 0 {
			delete(h.clients, c.ContainerID)
		}
	}
	close(c.Send)
}

func (h *Hub) Broadcast(containerID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("ws marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients[containerID] {
		select {
		case c.Send <- data:
		default:
			go h.Unsubscribe(c)
		}
	}
}

func (h *Hub) BroadcastAll(msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("ws marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, clients := range h.clients {
		for c := range clients {
			select {
			case c.Send <- data:
			default:
				go h.Unsubscribe(c)
			}
		}
	}
}

func (h *Hub) ClientCount(containerID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients[containerID])
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
