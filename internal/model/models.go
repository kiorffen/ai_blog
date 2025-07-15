package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username     string `gorm:"size:50;not null;unique"`
	Password     string `gorm:"size:255;not null"`
	Email        string `gorm:"size:100"`
	AuthProvider string `gorm:"size:20"`  // local, google, github etc
	AuthID       string `gorm:"size:100"` // ID from auth provider
}

type Category struct {
	gorm.Model
	Name     string    `gorm:"size:50;not null;unique"`
	Articles []Article `gorm:"many2many:article_categories;"`
}

type Article struct {
	gorm.Model
	Title      string     `gorm:"size:200;not null"`
	Content    string     `gorm:"type:text;not null"`
	IsMarkdown bool       `gorm:"default:true"`
	UserID     uint       `gorm:"not null"`
	User       User       `gorm:"foreignkey:UserID"`
	Categories []Category `gorm:"many2many:article_categories;"`
	Comments   []Comment  `gorm:"foreignkey:ArticleID"`
}

type Comment struct {
	gorm.Model
	Content   string  `gorm:"type:text;not null"`
	ArticleID uint    `gorm:"not null"`
	UserID    *uint   // nullable for anonymous comments
	UserName  string  `gorm:"size:100"` // for anonymous users
	IP        string  `gorm:"size:45"`  // to store IPv4/IPv6 addresses
	User      *User   `gorm:"foreignkey:UserID"`
	Article   Article `gorm:"foreignkey:ArticleID"`
}

type AuthToken struct {
	gorm.Model
	UserID    uint      `gorm:"not null"`
	Token     string    `gorm:"size:255;not null"`
	ExpiredAt time.Time `gorm:"not null"`
	User      User      `gorm:"foreignkey:UserID"`
}
