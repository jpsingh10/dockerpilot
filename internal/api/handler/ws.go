package handler

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/dockerpilot/dockerpilot/internal/service"
	internalws "github.com/dockerpilot/dockerpilot/internal/ws"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024, WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub       *internalws.Hub
	logMgr    *service.LogManager
	metricCol *service.MetricsCollector
}

func NewWSHandler(hub *internalws.Hub, logMgr *service.LogManager, metricCol *service.MetricsCollector) *WSHandler {
	return &WSHandler{hub: hub, logMgr: logMgr, metricCol: metricCol}
}

func (h *WSHandler) Stream(w http.ResponseWriter, r *http.Request) {
	containerID := mux.Vars(r)["containerID"]
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}
	client := &internalws.Client{
		Conn: conn, Send: make(chan []byte, 256),
		ContainerID: containerID, Hub: h.hub,
	}
	h.hub.Subscribe(client)
	go client.WritePump()

	ctx, cancel := context.WithCancel(r.Context())

	logCh, err := h.logMgr.StreamLogs(ctx, containerID)
	if err != nil {
		log.Printf("log stream error for %s: %v", containerID, err)
	} else {
		go func() {
			for line := range logCh {
				h.hub.Broadcast(containerID, internalws.Message{
					Type: internalws.MsgLog, Payload: line, Timestamp: time.Now(),
				})
			}
		}()
	}

	metricCh, err := h.metricCol.StreamMetrics(ctx, containerID, 2*time.Second)
	if err != nil {
		log.Printf("metrics stream error for %s: %v", containerID, err)
	} else {
		go func() {
			for snapshot := range metricCh {
				h.hub.Broadcast(containerID, internalws.Message{
					Type: internalws.MsgMetric, Payload: snapshot, Timestamp: time.Now(),
				})
			}
		}()
	}

	defer func() {
		cancel()
		h.hub.Unsubscribe(client)
		conn.Close()
	}()

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
