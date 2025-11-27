// public/app.js

const BACKEND_BASE = "http://shortline.proxy.rlwy.net:24579";
const API_BASE = BACKEND_BASE + "/api/books";


// ================= AUTH HELPERS =================

const TOKEN_KEY = "library_token";
const USER_KEY = "library_user";

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
}

function setUsername(u) {
    if (u) localStorage.setItem(USER_KEY, u);
    else localStorage.removeItem(USER_KEY);
}

function getUsername() {
    return localStorage.getItem(USER_KEY);
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: "Bearer " + token } : {};
}

function handleUnauthorized() {
    setToken(null);
    setUsername(null);
    alert("Session expired or not authorized. Please login.");
    window.location.href = "login.html";
}


// ================= DOM HELPERS =================

const $ = (sel) => document.querySelector(sel);

function getBooksContainer() {
    return $('#booksList') || $('#bookList') || $('#books') || document.createElement('div');
}

function getAddForm() {
    return $('#addBookForm') || $('#addForm');
}

function getInputValue(idOrName) {
    const elById = document.getElementById(idOrName);
    if (elById) return elById.value.trim();

    const form = getAddForm();
    if (form) {
        const el = form.querySelector(`[name="${idOrName}"]`);
        if (el) return el.value.trim();
    }
    return '';
}


// ================= LOAD BOOKS =================

async function loadBooks() {
    const container = getBooksContainer();
    container.innerHTML = 'Loading...';

    try {
        const res = await fetch(API_BASE, { headers: getAuthHeaders() });

        if (res.status === 401) return handleUnauthorized();

        if (!res.ok) {
            container.innerHTML = `<div style="color:red">Failed to load books</div>`;
            return;
        }

        const books = await res.json();

        if (!Array.isArray(books) || books.length === 0) {
            container.innerHTML = '<p>No books available.</p>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="book-item" style="border:1px solid #ddd;padding:10px;margin:8px 0;border-radius:6px;">
                <h3>${escapeHtml(book.title)}</h3>
                <p><b>Author:</b> ${escapeHtml(book.author)}</p>
                <p><b>Category:</b> ${escapeHtml(book.category)}</p>
                <p>${escapeHtml(book.description)}</p>
                ${book.pdf_url ? `<a href="${escapeAttr(book.pdf_url)}" target="_blank">Open PDF</a>` : ''}
                <br><br>
                <button onclick="deleteBook(${book.id})">Delete</button>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        container.innerHTML = 'Error loading books';
    }
}


// ================= ADD BOOK =================

async function addBook(event) {
    event.preventDefault();

    const body = {
        title: getInputValue('title'),
        author: getInputValue('author'),
        category: getInputValue('category'),
        description: getInputValue('description'),
        pdf_url: getInputValue('pdf_url')
    };

    if (!body.title) {
        alert('Title is required');
        return;
    }

    const res = await fetch(API_BASE + '/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(body)
    });

    if (res.status === 401) return handleUnauthorized();

    if (!res.ok) {
        alert('Failed to add book');
        return;
    }

    alert('Book added successfully ✅');
    if (getAddForm()) getAddForm().reset();
    loadBooks();
}


// ================= DELETE BOOK =================

async function deleteBook(id) {
    if (!confirm('Delete this book?')) return;

    const res = await fetch(`${API_BASE}/delete/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (res.status === 401) return handleUnauthorized();

    if (!res.ok) {
        alert('Failed to delete');
        return;
    }

    alert('Book deleted ✅');
    loadBooks();
}


// ================= LOGIN =================

async function handleLogin(event) {
    event.preventDefault();

    const username = $('#username')?.value.trim();
    const password = $('#password')?.value.trim();

    if (!username || !password) {
        alert('Enter username and password');
        return;
    }

    try {
        const res = await fetch(BACKEND_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        console.log("Login response:", res.status, data);

        if (!res.ok) {
            alert(data.message || 'Login failed');
            return;
        }

        setToken(data.token);
        setUsername(username);

        alert('Login successful ✅');

        // ✅ Redirect after login
        window.location.href = "index.html";

    } catch (err) {
        console.error('Login error:', err);
        alert('Server error');
    }
}

function initLoginPage() {
    const form = $('#loginForm') || document.querySelector('form');
    if (form) form.addEventListener('submit', handleLogin);
}


// ================= AUTH UI =================

function initAuthUI() {
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            setToken(null);
            setUsername(null);
            window.location.href = "login.html";
        };
    }

    const userDisplay = $('#userDisplay');
    if (userDisplay) {
        const u = getUsername();
        if (u) userDisplay.textContent = `Hi, ${u}`;
    }

    const addForm = getAddForm();
    if (addForm) addForm.addEventListener('submit', addBook);
}


// ================= BOOT =================

document.addEventListener('DOMContentLoaded', () => {

    const isLoginPage = window.location.pathname.includes('login');

    if (!getToken()) {
        if (!isLoginPage) {
            window.location.href = "login.html";
            return;
        }
    } else {
        if (isLoginPage) {
            window.location.href = "index.html";
            return;
        }
    }

    initAuthUI();

    if (!isLoginPage) {
        loadBooks();
    } else {
        initLoginPage();
    }
});


// ================= UTILITIES =================

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(str = '') {
    return escapeHtml(str);
}


// Expose globally
window.deleteBook = deleteBook;
window.addBook = addBook;