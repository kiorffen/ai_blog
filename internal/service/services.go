package service

import (
	"errors"

	"github.com/kiorffen/ai_blog/config"
	"github.com/kiorffen/ai_blog/internal/model"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct{}

func (s *UserService) CreateUser(user *model.User) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)
	return config.DB.Create(user).Error
}

func (s *UserService) ValidateUser(username, password string) (*model.User, error) {
	var user model.User
	if err := config.DB.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid password")
	}

	return &user, nil
}

func (s *UserService) GetUserByID(id uint) (*model.User, error) {
	var user model.User
	if err := config.DB.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateUserPassword(user *model.User, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return config.DB.Model(user).Update("password", string(hashedPassword)).Error
}

type ArticleService struct{}

func (s *ArticleService) CreateArticle(article *model.Article) error {
	return config.DB.Create(article).Error
}

func (s *ArticleService) GetArticles(page, pageSize int) ([]model.Article, int64, error) {
	var articles []model.Article
	var total int64

	tx := config.DB.Model(&model.Article{})
	tx.Count(&total)

	err := tx.Preload("User").Preload("Categories").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&articles).Error

	return articles, total, err
}

func (s *ArticleService) GetArticleByID(id uint) (*model.Article, error) {
	var article model.Article
	err := config.DB.Preload("User").Preload("Categories").Preload("Comments").
		First(&article, id).Error
	if err != nil {
		return nil, err
	}
	return &article, nil
}

func (s *ArticleService) UpdateArticle(article *model.Article) error {
	return config.DB.Save(article).Error
}

func (s *ArticleService) DeleteArticle(id uint) error {
	return config.DB.Delete(&model.Article{}, id).Error
}

type CategoryService struct{}

func (s *CategoryService) CreateCategory(category *model.Category) error {
	return config.DB.Create(category).Error
}

func (s *CategoryService) GetCategories() ([]model.Category, error) {
	var categories []model.Category
	err := config.DB.Find(&categories).Error
	return categories, err
}

func (s *CategoryService) DeleteCategory(id uint) error {
	return config.DB.Delete(&model.Category{}, id).Error
}

type CommentService struct{}

func (s *CommentService) CreateComment(comment *model.Comment) error {
	return config.DB.Create(comment).Error
}

func (s *CommentService) GetCommentsByArticleID(articleID uint) ([]model.Comment, error) {
	var comments []model.Comment
	err := config.DB.Where("article_id = ?", articleID).
		Preload("User").
		Order("created_at DESC").
		Find(&comments).Error
	return comments, err
}

func (s *CommentService) DeleteComment(id uint) error {
	return config.DB.Delete(&model.Comment{}, id).Error
}
