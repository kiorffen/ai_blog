// Admin authentication and UI logic
const API_BASE_URL = '/api';
let easyMDE = null;

// 将认证检查包装在一个函数中
function checkAuth() {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    
    if (!token || !userRaw) {
        return null;
    }

    try {
        const currentUser = JSON.parse(userRaw);
        if (currentUser.id !== 1) {
            alert('Access denied. Admin privileges required.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
            return null;
        }
        return { token, currentUser };
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return null;
    }
}

// 进行认证检查
const auth = checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    if (!auth) {
        window.location.href = '/login.html';
        return;
    }
    
    updateAuthUI();
    initializeEditor();
    loadArticles();
    loadCategories();

    document.getElementById('articleForm').addEventListener('submit', handleArticleSubmit);
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('isMarkdown').addEventListener('change', toggleEditor);
});

function initializeEditor() {
    easyMDE = new EasyMDE({
        element: document.getElementById('articleContent'),
        spellChecker: false,
        autosave: { enabled: true, delay: 1000 },
    });
}

function toggleEditor() {
    const isMarkdown = document.getElementById('isMarkdown').checked;
    if (isMarkdown) {
        if (!easyMDE) initializeEditor();
    } else {
        if (easyMDE) {
            easyMDE.toTextArea();
            easyMDE = null;
        }
    }
}

function showCreateArticleModal() {
    document.getElementById('articleModalTitle').textContent = 'Create Article';
    document.getElementById('articleForm').reset();
    document.getElementById('articleId').value = '';
    if (easyMDE) easyMDE.value('');
    new bootstrap.Modal(document.getElementById('articleModal')).show();
}

function showEditArticleModal(article) {
    document.getElementById('articleModalTitle').textContent = 'Edit Article';
    document.getElementById('articleId').value = article.ID;
    document.getElementById('articleForm').elements.title.value = article.Title;
    document.getElementById('isMarkdown').checked = article.IsMarkdown;
    if (article.IsMarkdown) {
        if (!easyMDE) initializeEditor();
        easyMDE.value(article.Content);
    } else {
        if (easyMDE) {
            easyMDE.toTextArea();
            easyMDE = null;
        }
        document.getElementById('articleContent').value = article.Content;
    }
    // Set categories
    const categorySelect = document.getElementById('articleForm').elements.categories;
    Array.from(categorySelect.options).forEach(option => {
        option.selected = article.Categories.some(cat => cat.ID === parseInt(option.value));
    });
    new bootstrap.Modal(document.getElementById('articleModal')).show();
}

function showCreateCategoryModal() {
    document.getElementById('categoryForm').reset();
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
}

async function loadArticles() {
    try {
        const response = await fetch(`${API_BASE_URL}/articles`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        const result = await response.json();
        document.getElementById('articlesList').innerHTML = result.data.map(article => `
            <tr>
                <td>${article.Title}</td>
                <td>${article.Categories.map(cat => cat.Name).join(', ')}</td>
                <td>${new Date(article.CreatedAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="handleEditArticle(${article.ID})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="handleDeleteArticle(${article.ID})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();
        document.getElementById('articleForm').elements.categories.innerHTML = categories.map(category => `
            <option value="${category.ID}">${category.Name}</option>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function handleArticleSubmit(e) {
    e.preventDefault();
    const title = document.querySelector('input[name="title"]').value;
    const isMarkdown = document.getElementById('isMarkdown').checked;
    const content = easyMDE ? easyMDE.value() : document.getElementById('articleContent').value;
    const categories = Array.from(document.querySelector('select[name="categories"]').selectedOptions).map(option => ({ ID: parseInt(option.value) }));
    const articleId = document.getElementById('articleId').value;
    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }
    const article = { Title: title, Content: content, IsMarkdown: isMarkdown, Categories: categories };
    try {
        const url = articleId ? `${API_BASE_URL}/admin/articles/${articleId}` : `${API_BASE_URL}/admin/articles`;
        const response = await fetch(url, {
            method: articleId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify(article)
        });
        if (!response.ok) throw new Error('Failed to save article');
        bootstrap.Modal.getInstance(document.getElementById('articleModal')).hide();
        loadArticles();
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Failed to save article');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({ Name: formData.get('name') })
        });
        if (!response.ok) throw new Error('Failed to create category');
        bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        loadCategories();
    } catch (error) {
        console.error('Error creating category:', error);
        alert('Failed to create category');
    }
}

async function handleEditArticle(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch article');
        const article = await response.json();
        showEditArticleModal(article);
    } catch (error) {
        console.error('Error loading article:', error);
        alert('Failed to load article');
    }
}

async function handleDeleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/admin/articles/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (!response.ok) throw new Error('Failed to delete article');
        loadArticles();
    } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article');
    }
}

function updateAuthUI() {
    if (!auth) {
        window.location.href = '/login.html';
        return;
    }
    
    const authButtons = document.getElementById('authButtons');
    authButtons.innerHTML = `
        <span class="navbar-text me-3">Welcome, ${auth.currentUser.username}</span>
        <button class="btn btn-outline-light" onclick="logout()">Logout</button>
    `;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}
