package repository

import (
	"github.com/dockerpilot/dockerpilot/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SettingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

func (r *SettingsRepository) Get(key string) (string, error) {
	var s models.AppSetting
	if err := r.db.Where("key = ?", key).First(&s).Error; err != nil {
		return "", err
	}
	return s.Value, nil
}

func (r *SettingsRepository) Set(key, value string) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(&models.AppSetting{Key: key, Value: value}).Error
}

func (r *SettingsRepository) GetMulti(keys []string) (map[string]string, error) {
	var settings []models.AppSetting
	if err := r.db.Where("key IN ?", keys).Find(&settings).Error; err != nil {
		return nil, err
	}
	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	return result, nil
}

func (r *SettingsRepository) SetMulti(pairs map[string]string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for k, v := range pairs {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.AssignmentColumns([]string{"value"}),
			}).Create(&models.AppSetting{Key: k, Value: v}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
