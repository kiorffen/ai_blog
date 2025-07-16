package model

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel 自定义基础模型，避免零日期问题
type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"ID"`
	CreatedAt time.Time      `json:"CreatedAt"`
	UpdatedAt time.Time      `json:"UpdatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"DeletedAt,omitempty"`
}

type User struct {
	BaseModel
	Username     string `gorm:"size:50;not null;unique"`
	Password     string `gorm:"size:255;not null"`
	Email        string `gorm:"size:100"`
	AuthProvider string `gorm:"size:20"`  // local, google, github etc
	AuthID       string `gorm:"size:100"` // ID from auth provider
}

type Category struct {
	BaseModel
	Name     string    `gorm:"size:50;not null;unique"`
	Articles []Article `gorm:"many2many:article_categories;"`
}

type Article struct {
	BaseModel
	Title      string     `gorm:"size:200;not null"`
	Content    string     `gorm:"type:text;not null"`
	IsMarkdown bool       `gorm:"default:true"`
	UserID     uint       `gorm:"not null"`
	User       User       `gorm:"foreignkey:UserID"`
	Categories []Category `gorm:"many2many:article_categories;"`
	Comments   []Comment  `gorm:"foreignkey:ArticleID"`
}

type Comment struct {
	BaseModel
	Content   string  `gorm:"type:text;not null"`
	ArticleID uint    `gorm:"not null"`
	UserID    *uint   // nullable for anonymous comments
	UserName  string  `gorm:"size:100"` // for anonymous users
	IP        string  `gorm:"size:45"`  // to store IPv4/IPv6 addresses
	User      *User   `gorm:"foreignkey:UserID"`
	Article   Article `gorm:"foreignkey:ArticleID"`
}

type AuthToken struct {
	BaseModel
	UserID    uint      `gorm:"not null"`
	Token     string    `gorm:"size:255;not null"`
	ExpiredAt time.Time `gorm:"not null"`
	User      User      `gorm:"foreignkey:UserID"`
}
