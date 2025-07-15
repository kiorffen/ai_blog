// Global variables
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));
const API_BASE_URL = '';  // Same domain
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
            <button class="btn btn-light" onclick="showRegisterModal()">Register</button>
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
    return `
        <div class="article-card">
            <h2 class="article-title">${article.Title}</h2>
            <div class="article-meta">
                <span>By ${article.User.Username}</span>
                <span>・</span>
                <span>${new Date(article.CreatedAt).toLocaleDateString()}</span>
            </div>
            <div class="article-categories">
                ${article.Categories.map(cat => `
                    <span class="category-badge">${cat.Name}</span>
                `).join('')}
            </div>
            <div class="article-content">${content}</div>
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
        <div class="comment">
            <div class="comment-meta">
                <span>${comment.User ? comment.User.Username : 'Anonymous'}</span>
                <span>・</span>
                <span>${new Date(comment.CreatedAt).toLocaleDateString()}</span>
            </div>
            <div class="comment-content">${comment.Content}</div>
        </div>
    `).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();

    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const success = await login(formData.get('username'), formData.get('password'));
        if (success) {
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    });

    // Register form handler
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
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

    // Load initial content
    loadInitialContent();
});

async function loadInitialContent() {
    const contentDiv = document.getElementById('content');
    if (!contentDiv) {
        console.error('Content div not found');
        return;
    }

    // 显示加载状态
    contentDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
        // Load single article
        const article = await fetchArticle(articleId);
        if (article) {
            contentDiv.innerHTML = `
                ${renderArticle(article)}
                <div class="comment-section">
                    <h3>Comments</h3>
                    <div id="comments"></div>
                    <div class="mt-4">
                        <textarea class="form-control" id="commentText" rows="3" placeholder="Write your comment here..."></textarea>
                        <button class="btn btn-primary mt-2" onclick="submitComment(${articleId})">Post Comment</button>
                    </div>
                </div>
            `;
            const comments = await fetchComments(articleId);
            document.getElementById('comments').innerHTML = renderComments(comments);
        }
    } else {
        // Load article list
        const result = await fetchArticles();
        if (result) {
            const articles = result.data;
            document.getElementById('content').innerHTML = `
                <div class="articles">
                    ${articles.map(renderArticle).join('')}
                </div>
                <nav class="mt-4">
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
        const comments = await fetchComments(articleId);
        document.getElementById('comments').innerHTML = renderComments(comments);
    }
}
