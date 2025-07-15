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
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
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
    
    // 清空分类选择 - 取消选中所有复选框
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
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
    // Set categories - 根据文章的分类设置复选框
    const categoryCheckboxes = document.querySelectorAll('input[name="categories"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.checked = article.Categories.some(cat => cat.ID === parseInt(checkbox.value));
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
        
        // 为文章表单加载分类复选框
        const categoriesContainer = document.getElementById('categoriesCheckboxes');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = categories.map(category => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="categories" value="${category.ID}" id="category_${category.ID}">
                    <label class="form-check-label" for="category_${category.ID}">
                        ${category.Name}
                    </label>
                </div>
            `).join('');
        }
        
        // 为分类管理表格加载分类列表
        const categoriesListTable = document.getElementById('categoriesList');
        if (categoriesListTable) {
            categoriesListTable.innerHTML = categories.map(category => `
                <tr>
                    <td>${category.Name}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="handleDeleteCategory(${category.ID})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function handleArticleSubmit(e) {
    e.preventDefault();
    const title = document.querySelector('input[name="title"]').value;
    const isMarkdown = document.getElementById('isMarkdown').checked;
    const content = easyMDE ? easyMDE.value() : document.getElementById('articleContent').value;
    
    // 获取选中的分类 - 从复选框获取
    const selectedCategories = Array.from(document.querySelectorAll('input[name="categories"]:checked'))
        .map(checkbox => ({ ID: parseInt(checkbox.value) }));
    
    const articleId = document.getElementById('articleId').value;
    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }
    const article = { Title: title, Content: content, IsMarkdown: isMarkdown, Categories: selectedCategories };
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
        loadCategories(); // 重新加载分类列表和下拉选项
        alert('Category created successfully');
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

async function handleDeleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete category');
        
        // 重新加载分类列表
        loadCategories();
        alert('Category deleted successfully');
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category: ' + error.message);
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

function showChangePasswordModal() {
    document.getElementById('changePasswordForm').reset();
    new bootstrap.Modal(document.getElementById('changePasswordModal')).show();
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    // 检查认证状态
    if (!auth || !auth.token) {
        alert('Authentication required. Please login again.');
        window.location.href = '/login.html';
        return;
    }
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    try {
        console.log('Sending change password request with token:', auth.token ? 'token exists' : 'no token');
        
        const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Response status:', response.status, 'Error:', error);
            throw new Error(error);
        }

        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        alert('Password changed successfully');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to change password: ' + error.message);
    }
}
