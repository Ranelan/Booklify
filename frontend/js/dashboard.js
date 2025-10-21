document.addEventListener('DOMContentLoaded', function() {
    // Initial load
        console.log('dashboard.js loaded');
    loadUsers();
    loadBooks();
    setupEventListeners();

    function setupEventListeners() {
        document.getElementById('searchButton').addEventListener('click', handleSearch);
        document.getElementById('resetSearch').addEventListener('click', () => {
            loadUsers();
            loadBooks();
        });
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        document.getElementById('saveUserChanges').addEventListener('click', handleUserUpdate);
        // Book event listeners (if you have edit/delete buttons for books)
        if (document.getElementById('searchBookButton')) {
            document.getElementById('searchBookButton').addEventListener('click', handleBookSearch);
        }
    }

    // Load all users
    async function loadUsers() {
        try {
            const users = await AdminService.getAllUsers();
            displayUsers(users);
        } catch (error) {
            showToast('error', 'Failed to load users');
        }
    }

    // Load all books
    async function loadBooks() {
        try {
            const books = await AdminService.getAllBooks();
                console.log('Books fetched from AdminService:', books);
            displayBooks(books);
        } catch (error) {
            showToast('error', 'Failed to load books');
        }
    }

    // Handle user search (by email or name)
    async function handleSearch() {
        const searchInput = document.getElementById('searchInput').value.trim();
        const searchType = document.getElementById('searchType').value;

        if (!searchInput) {
            loadUsers();
            return;
        }

        try {
            let users;
            if (searchType === 'email') {
                users = await AdminService.searchUsersByEmail(searchInput);
            } else if (searchType === 'name') {
                users = await AdminService.searchUsersByName(searchInput);
            } else {
                users = await AdminService.getAllUsers();
            }
            displayUsers(users);
        } catch (error) {
            showToast('error', 'Search failed');
        }
    }

    // Handle book search
    async function handleBookSearch() {
        const searchBookInput = document.getElementById('searchBookInput').value.trim();
        const searchBookType = document.getElementById('searchBookType').value;
        if (!searchBookInput) {
            loadBooks();
            return;
        }
        try {
            let books;
            if (searchBookType === 'title') {
                books = await AdminService.searchBooksByTitle(searchBookInput);
            } else if (searchBookType === 'author') {
                books = await AdminService.searchBooksByAuthor(searchBookInput);
            } else if (searchBookType === 'isbn') {
                books = await AdminService.searchBooksByIsbn(searchBookInput);
            } else {
                books = await AdminService.getAllBooks();
            }
            displayBooks(books);
        } catch (error) {
            showToast('error', 'Book search failed');
        }
    }

    // Display users in the table
    function displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.email}</td>
        <td>${new Date(user.dateJoined || user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary custom-btn-outline me-2" onclick="editUser(${user.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger custom-btn-outline-danger" onclick="deleteUser(${user.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    // Update total users count in dashboard overview
    const userCountElem = document.querySelector('.card-text.display-6');
    if (userCountElem) userCountElem.textContent = users.length;
    }

    // Display books in the table
    function displayBooks(books) {
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        console.log('Books received for display:', books);
        books.forEach(book => {
            let uploaderDisplay = 'N/A';
            if (book.uploaderName || book.uploaderEmail) {
                uploaderDisplay = `${book.uploaderName || ''}<br><small>${book.uploaderEmail || ''}</small>`;
            } else if (book.uploader) {
                uploaderDisplay = book.uploader.fullName || book.uploader.email || book.uploader.id;
            } else if (book.userId) {
                uploaderDisplay = book.userId;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.bookID || book.id}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>${book.price}</td>
                <td>${uploaderDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editBook(${book.bookID || book.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${book.bookID || book.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Update total books count in dashboard overview
        const bookCountElem = document.querySelectorAll('.card-text.display-6')[1];
        if (bookCountElem) bookCountElem.textContent = books.length;
    }

    // Handle user edit
    window.editUser = function(userId) {
        // Find user in table
        const row = Array.from(document.getElementById('usersTableBody').children)
            .find(r => r.children[0].textContent == userId);
        if (row) {
            document.getElementById('editUserId').value = row.children[0].textContent;
            document.getElementById('editFullName').value = row.children[1].textContent;
            document.getElementById('editEmail').value = row.children[2].textContent;
            new bootstrap.Modal(document.getElementById('editUserModal')).show();
        }
    };

    // Handle book edit
    window.editBook = function(bookId) {
        // Find book in table
        const row = Array.from(document.getElementById('booksTableBody').children)
            .find(r => r.children[0].textContent == bookId);
        if (row) {
            document.getElementById('editBookId').value = row.children[0].textContent;
            document.getElementById('editBookTitle').value = row.children[1].textContent;
            document.getElementById('editBookAuthor').value = row.children[2].textContent;
            document.getElementById('editBookIsbn').value = row.children[3].textContent;
            document.getElementById('editBookPrice').value = row.children[4].textContent;
            new bootstrap.Modal(document.getElementById('editBookModal')).show();
        }
    };

    // Handle user update
    async function handleUserUpdate() {
        const userId = document.getElementById('editUserId').value;
        const userData = {
            fullName: document.getElementById('editFullName').value,
            email: document.getElementById('editEmail').value
        };
        try {
            await AdminService.updateUser(userId, userData);
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            showToast('success', 'User updated successfully');
            loadUsers();
        } catch (error) {
            showToast('error', 'Failed to update user');
        }
    }

    // Handle book update
    window.saveBookChanges = async function() {
        const bookId = document.getElementById('editBookId').value;
        const bookData = {
            title: document.getElementById('editBookTitle').value,
            author: document.getElementById('editBookAuthor').value,
            isbn: document.getElementById('editBookIsbn').value,
            price: document.getElementById('editBookPrice').value
        };
        try {
            await AdminService.editBookById(bookId, bookData);
            bootstrap.Modal.getInstance(document.getElementById('editBookModal')).hide();
            showToast('success', 'Book updated successfully');
            loadBooks();
        } catch (error) {
            showToast('error', 'Failed to update book');
        }
    }

    // Handle user deletion
    window.deleteUser = async function(userId) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('Are you sure you want to delete this user?', async () => {
                try {
                    await AdminService.deleteUser(userId);
                    showToast('success', 'User deleted successfully');
                    loadUsers();
                } catch (error) {
                    showToast('error', 'Failed to delete user');
                }
            }, 'Delete User');
        } else {
            if (!confirm('Are you sure you want to delete this user?')) return;
            try {
                await AdminService.deleteUser(userId);
                showToast('success', 'User deleted successfully');
                loadUsers();
            } catch (error) {
                showToast('error', 'Failed to delete user');
            }
        }
    };

    // Handle book deletion
    window.deleteBook = async function(bookId) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('Are you sure you want to delete this book?', async () => {
                try {
                    await AdminService.deleteBookById(bookId);
                    showToast('success', 'Book deleted successfully');
                    loadBooks();
                } catch (error) {
                    showToast('error', 'Failed to delete book');
                }
            }, 'Delete Book');
        } else {
            if (!confirm('Are you sure you want to delete this book?')) return;
            try {
                await AdminService.deleteBookById(bookId);
                showToast('success', 'Book deleted successfully');
                loadBooks();
            } catch (error) {
                showToast('error', 'Failed to delete book');
            }
        }
    };

    // Toast notification helper
    function showToast(type, message) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        document.body.appendChild(toastEl);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }
});
