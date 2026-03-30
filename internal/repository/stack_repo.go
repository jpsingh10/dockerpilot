package repository

import (
	"github.com/dockerpilot/dockerpilot/internal/models"
	"gorm.io/gorm"
)

type StackRepository struct {
	db *gorm.DB
}

func NewStackRepository(db *gorm.DB) *StackRepository {
	return &StackRepository{db: db}
}

func (r *StackRepository) FindAll() ([]models.Stack, error) {
	var stacks []models.Stack
	err := r.db.Order("created_at desc").Find(&stacks).Error
	return stacks, err
}

func (r *StackRepository) FindByID(id uint) (*models.Stack, error) {
	var stack models.Stack
	err := r.db.First(&stack, id).Error
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

func (r *StackRepository) FindByWebhookID(webhookID string) (*models.Stack, error) {
	var stack models.Stack
	err := r.db.Where("webhook_id = ?", webhookID).First(&stack).Error
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

func (r *StackRepository) Create(stack *models.Stack) error {
	return r.db.Create(stack).Error
}

func (r *StackRepository) Update(stack *models.Stack) error {
	return r.db.Save(stack).Error
}

func (r *StackRepository) Delete(id uint) error {
	return r.db.Delete(&models.Stack{}, id).Error
}

func (r *StackRepository) FindByName(name string) (*models.Stack, error) {
	var stack models.Stack
	err := r.db.Where("name = ?", name).First(&stack).Error
	if err != nil {
		return nil, err
	}
	return &stack, nil
}

func (r *StackRepository) FindByStackType(stackType models.StackType) ([]models.Stack, error) {
	var stacks []models.Stack
	err := r.db.Where("stack_type = ?", stackType).Find(&stacks).Error
	return stacks, err
}
