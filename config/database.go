package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"github.com/kiorffen/ai_blog/internal/model"
)

var DB *gorm.DB

func InitDB() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 自动迁移数据库模式
	err = db.AutoMigrate(
		&model.User{},
		&model.Category{},
		&model.Article{},
		&model.Comment{},
		&model.AuthToken{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// 创建初始管理员用户
	var adminUser model.User
	result := db.Where("username = ?", "haiyu").First(&adminUser)
	if result.RowsAffected == 0 {
		// 使用 bcrypt 加密密码
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Tang777"), bcrypt.DefaultCost)
		if err != nil {
			log.Fatal("Failed to hash password:", err)
		}

		adminUser = model.User{
			Username:     "haiyu",
			Password:     string(hashedPassword),
			AuthProvider: "local",
		}
		db.Create(&adminUser)
	}

	DB = db
}
