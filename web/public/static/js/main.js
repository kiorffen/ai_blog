// Global variables
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
const API_BASE_URL = '/api';  // All API requests go through /api
const md = window.markdownit();

// 确保所有DOM操作在页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载初始内容
    loadInitialContent();
});

// Authentication functions
function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateAuthUI();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

async function register(username, password, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        return true;
    } catch (error) {
        console.error('Registration error:', error);
        return false;
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
}

// UI Update functions
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (currentUser) {
        authButtons.innerHTML = `
            <span class="navbar-text me-3">Welcome, ${currentUser.username}</span>
            ${currentUser.id === 1 ? '<a href="/admin.html" class="btn btn-primary me-2">Admin Panel</a>' : ''}
            <button class="btn btn-outline-light" onclick="logout()">Logout</button>
        `;
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-outline-light me-2" onclick="showLoginModal()">Login</button>
        `;
    }
}

// Article functions
async function fetchArticles(page = 1, pageSize = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles?page=${page}&pageSize=${pageSize}`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        return await response.json();
    } catch (error) {
        console.error('Error fetching articles:', error);
        return null;
    }
}

async function fetchArticle(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        return await response.json();
    } catch (error) {
        console.error('Error fetching article:', error);
        return null;
    }
}

function renderArticle(article) {
    const content = article.IsMarkdown ? md.render(article.Content) : article.Content;
    
    // 创建摘要（限制字符数）
    const preview = content.replace(/<[^>]*>/g, ''); // 移除HTML标签
    const maxPreviewLength = 200;
    const hasMore = preview.length > maxPreviewLength;
    const previewText = hasMore ? preview.substring(0, maxPreviewLength) + '...' : preview;
    
    return `
        <div class="article-card mb-4 p-4 border rounded shadow-sm bg-white">
            <div class="article-header mb-3">
                <h2 class="article-title mb-2">
                    <a href="/articles/${article.ID}" class="text-decoration-none text-dark">${article.Title}</a>
                </h2>
                <div class="article-meta text-muted small mb-2">
                    <i class="fas fa-user me-1"></i><span>By ${article.User.Username}</span>
                    <span class="mx-2">•</span>
                    <i class="fas fa-calendar me-1"></i><span>${new Date(article.CreatedAt).toLocaleDateString()}</span>
                </div>
                <div class="article-categories mb-3">
                    ${article.Categories.map(cat => `
                        <span class="badge bg-secondary me-1">${cat.Name}</span>
                    `).join('')}
                </div>
            </div>
            <div class="article-preview mb-3">
                <p class="text-muted">${previewText}</p>
            </div>
            <div class="article-actions d-flex justify-content-between align-items-center">
                <a href="/articles/${article.ID}" class="btn btn-primary btn-sm">
                    <i class="fas fa-book-open me-1"></i>Read More
                </a>
                <div class="article-stats text-muted small">
                    <i class="fas fa-eye me-1"></i>
                    <span>View Details</span>
                </div>
            </div>
        </div>
        <hr class="article-separator my-4" style="border: none; height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent);">
    `;
}

function renderArticleDetail(article) {
    const content = article.IsMarkdown ? md.render(article.Content) : article.Content;
    
    return `
        <article class="article-detail bg-white rounded-3 shadow-sm">
            <div class="article-header p-4 border-bottom">
                <h1 class="article-title display-5 fw-bold text-dark mb-4">${article.Title}</h1>
                <div class="article-meta d-flex flex-wrap align-items-center text-muted mb-3">
                    <div class="me-4 mb-2">
                        <i class="fas fa-user me-2 text-primary"></i>
                        <span class="fw-medium">By ${article.User.Username}</span>
                    </div>
                    <div class="me-4 mb-2">
                        <i class="fas fa-calendar me-2 text-success"></i>
                        <span>${new Date(article.CreatedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="me-4 mb-2">
                        <i class="fas fa-clock me-2 text-info"></i>
                        <span>${new Date(article.CreatedAt).toLocaleTimeString()}</span>
                    </div>
                </div>
                <div class="article-categories">
                    ${article.Categories.map(cat => `
                        <span class="badge bg-primary me-2 mb-2 px-3 py-2 rounded-pill">${cat.Name}</span>
                    `).join('')}
                </div>
            </div>
            <div class="article-content p-4">
                <div class="content-body">
                    ${content}
                </div>
            </div>
        </article>
        
        <!-- 分割线 -->
        <div class="separator my-5">
            <div class="text-center">
                <hr class="border-0" style="height: 2px; background: linear-gradient(to right, transparent, #007bff, transparent);">
                <i class="fas fa-comments text-primary fs-4 bg-white px-3" style="margin-top: -20px;"></i>
            </div>
        </div>
    `;
}

// Comment functions
async function fetchComments(articleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        return await response.json();
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
}

async function postComment(articleId, content) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, ArticleID: articleId })
        });
        if (!response.ok) throw new Error('Failed to post comment');
        return await response.json();
    } catch (error) {
        console.error('Error posting comment:', error);
        return null;
    }
}

function renderComments(comments) {
    return comments.map(comment => `
        <div class="comment-item bg-light p-4 mb-3 rounded-3 border-start border-primary border-4">
            <div class="comment-header d-flex justify-content-between align-items-start mb-3">
                <div class="comment-meta">
                    <strong class="comment-author text-primary fs-6">${comment.UserName || 'Anonymous'}</strong>
                    <div class="text-muted small mt-1">
                        <i class="fas fa-clock me-1"></i>${new Date(comment.CreatedAt).toLocaleString()}
                        ${comment.IP ? `<span class="ms-3"><i class="fas fa-map-marker-alt me-1"></i>IP: ${comment.IP}</span>` : ''}
                    </div>
                </div>
                ${currentUser && currentUser.id === 1 ? `
                    <div class="comment-actions">
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteComment(${comment.ID})" title="删除评论">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="comment-content">
                <p class="mb-0 text-dark">${comment.Content}</p>
            </div>
        </div>
    `).join('');
}

// Delete comment function
async function deleteComment(commentId) {
    if (!confirm('确定要删除这条评论吗？')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }

        // 重新加载评论列表
        const urlParams = new URLSearchParams(window.location.search);
        let articleId = urlParams.get('id');
        
        if (!articleId) {
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'articles' && pathParts[2]) {
                articleId = pathParts[2];
            }
        }

        if (articleId) {
            loadComments(articleId);
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('删除评论失败，请重试。');
    }
}

// Comment loading function
async function loadComments(articleId) {
    const comments = await fetchComments(articleId);
    document.getElementById('comments').innerHTML = renderComments(comments);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Login form handler - 只在存在登录表单时添加监听器
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const success = await login(formData.get('username'), formData.get('password'));
            if (success) {
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            } else {
                alert('Login failed. Please check your credentials.');
            }
        });
    }

    // Register form handler - 只在存在注册表单时添加监听器
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const success = await register(
                formData.get('username'),
                formData.get('password'),
                formData.get('email')
            );
            if (success) {
                bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
                alert('Registration successful! Please login.');
            } else {
                alert('Registration failed. Please try again.');
            }
        });
    }

    // Load initial content
    loadInitialContent();
});

async function loadInitialContent() {
    // 尝试获取content div (首页) 或 article-content div (文章详情页)
    let contentDiv = document.getElementById('content');
    if (!contentDiv) {
        contentDiv = document.getElementById('article-content');
    }
    
    if (!contentDiv) {
        console.error('Content div not found');
        return;
    }

    // 显示加载状态
    contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const urlParams = new URLSearchParams(window.location.search);
    let articleId = urlParams.get('id');
    
    // 如果没有查询参数中的ID，尝试从路径中获取（例如 /articles/123）
    if (!articleId) {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'articles' && pathParts[2]) {
            articleId = pathParts[2];
        }
    }

    if (articleId) {
        // Load single article
        const article = await fetchArticle(articleId);
        if (article) {
            contentDiv.innerHTML = `
                ${renderArticleDetail(article)}
                
                <section class="comment-section bg-white rounded-3 shadow-sm">
                    <div class="comment-header p-4 border-bottom bg-light rounded-top">
                        <h3 class="mb-0 text-dark">
                            <i class="fas fa-comments me-2 text-primary"></i>
                            评论区
                        </h3>
                        <small class="text-muted">欢迎发表您的看法</small>
                    </div>
                    
                    <div class="p-4">
                        <div id="comments" class="comments-list mb-4"></div>
                        
                        <!-- 评论分割线 -->
                        <div class="comment-divider my-4">
                            <hr class="border-0" style="height: 1px; background: linear-gradient(to right, transparent, #dee2e6, transparent);">
                            <div class="text-center">
                                <span class="bg-white px-3 text-muted small">
                                    <i class="fas fa-edit me-1"></i>写下您的评论
                                </span>
                            </div>
                        </div>
                        
                        <div class="comment-form">
                            <div class="mb-3">
                                <label for="commentText" class="form-label fw-medium text-dark">
                                    <i class="fas fa-pencil-alt me-1"></i>发表评论
                                </label>
                                <textarea class="form-control border-2" id="commentText" rows="4" 
                                         placeholder="请输入您的评论内容..."
                                         style="resize: vertical; min-height: 100px;"></textarea>
                            </div>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-primary px-4 py-2" onclick="submitComment(${articleId})">
                                    <i class="fas fa-paper-plane me-2"></i>发布评论
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            const comments = await fetchComments(articleId);
            document.getElementById('comments').innerHTML = renderComments(comments);
        }
    } else {
        // Load article list
        const result = await fetchArticles();
        if (result) {
            const articles = result.data;
            const articlesHtml = articles.map(renderArticle).join('');
            // 移除最后一个分隔符
            const cleanedHtml = articlesHtml.replace(/<hr class="article-separator[^>]*>$/, '');
            
            contentDiv.innerHTML = `
                <div class="articles-container">
                    ${cleanedHtml}
                </div>
                <nav class="mt-5">
                    <ul class="pagination justify-content-center">
                        ${generatePagination(result.page, Math.ceil(result.total / result.pageSize))}
                    </ul>
                </nav>
            `;
        }
    }
}

function generatePagination(currentPage, totalPages) {
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
        pages += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="?page=${i}">${i}</a>
            </li>
        `;
    }
    return pages;
}

async function submitComment(articleId) {
    const content = document.getElementById('commentText').value;
    if (!content.trim()) return;

    const comment = await postComment(articleId, content);
    if (comment) {
        document.getElementById('commentText').value = '';
        // Reload comments
        loadComments(articleId);
    }
}
