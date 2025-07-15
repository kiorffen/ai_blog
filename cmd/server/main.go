package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/kiorffen/ai_blog/config"
	"github.com/kiorffen/ai_blog/internal/handler"
	"github.com/kiorffen/ai_blog/internal/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Initialize database
	config.InitDB()

	// Create Gin router
	r := gin.Default()

	// Add CORS middleware
	r.Use(middleware.CORSMiddleware())

	// Initialize handlers
	authHandler := handler.NewAuthHandler()
	articleHandler := handler.NewArticleHandler()
	commentHandler := handler.NewCommentHandler()
	categoryHandler := handler.NewCategoryHandler()

	// API routes
	api := r.Group("/api")
	{
		// Public routes
		api.POST("/auth/login", authHandler.Login) // 仅用于管理员登录
		api.GET("/articles", articleHandler.GetArticles)
		api.GET("/articles/:id", articleHandler.GetArticle)
		api.GET("/articles/:id/comments", commentHandler.GetComments)
		api.POST("/articles/:id/comments", commentHandler.CreateComment) // 允许匿名评论
		api.GET("/categories", categoryHandler.GetCategories)

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.POST("/articles", articleHandler.CreateArticle)
			admin.PUT("/articles/:id", articleHandler.UpdateArticle)
			admin.DELETE("/articles/:id", articleHandler.DeleteArticle)
			admin.POST("/categories", categoryHandler.CreateCategory)
			admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)
			admin.PUT("/change-password", authHandler.ChangePassword)
			admin.DELETE("/comments/:id", commentHandler.DeleteComment) // 删除评论
		}
	}

	// Serve static files
	r.Static("/static", "./web/public/static") // 所有静态文件都通过 /static 路径访问

	// Serve HTML files
	r.StaticFile("/", "./web/public/index.html")
	r.StaticFile("/admin", "./web/public/admin.html")
	r.StaticFile("/admin.html", "./web/public/admin.html")
	r.StaticFile("/categories", "./web/public/categories.html")
	r.StaticFile("/categories.html", "./web/public/categories.html")
	r.StaticFile("/login", "./web/public/login.html")
	r.StaticFile("/login.html", "./web/public/login.html")

	// Handle article pages
	r.GET("/articles/:id", func(c *gin.Context) {
		c.File("./web/public/articles/index.html")
	})

	// Start server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8090"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
