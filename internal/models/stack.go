package models

import (
	"time"

	"gorm.io/gorm"
)

type DeployStatus string

const (
	StatusSuccess DeployStatus = "success"
	StatusFailed  DeployStatus = "failed"
	StatusPending DeployStatus = "pending"
)

type Stack struct {
	gorm.Model
	Name           string       `gorm:"uniqueIndex;not null" json:"name"`
	RepoURL        string       `gorm:"not null" json:"repoUrl"`
	Branch         string       `gorm:"not null;default:'main'" json:"branch"`
	ComposePath    string       `gorm:"not null;default:'docker-compose.yml'" json:"composePath"`
	LastStatus     DeployStatus `gorm:"default:'pending'" json:"lastStatus"`
	LastCommit     string       `json:"lastCommit"`
	LastDeployedAt *time.Time   `json:"lastDeployedAt"`
	WebhookID      string       `gorm:"uniqueIndex" json:"webhookId"`
	WebhookSecret  string       `json:"-"`
}
