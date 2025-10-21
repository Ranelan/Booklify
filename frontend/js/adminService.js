// Admin API Service
const API_BASE_URL = 'http://localhost:8081/api/admins';

class AdminService {
    // Update book by ID
    static async updateBookById(bookId, updatedBookDto) {
        if (!bookId) throw new Error('Book ID is missing. Cannot update book.');
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/editBook/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedBookDto)
        });
        if (!response.ok) {
            throw new Error('Failed to update book');
        }
        return await response.json();
    }
    // --- Book Management Methods ---
    static async getAllBooks() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/getAllBooks`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch books');
        return await response.json();
    }

    static async deleteBookById(bookId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/deleteBook/${bookId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete book');
        return true;
    }
    static async deleteAdminById(adminId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/deleteAdmin/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete admin');
        return true;
    }

    static async editBookById(bookId, updatedBook) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/editBook/${bookId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBook)
        });
        if (!response.ok) throw new Error('Failed to edit book');
        return await response.json();
    }

    static async getBookById(bookId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch book');
        return await response.json();
    }

    static async searchBooksByTitle(title) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/title?title=${encodeURIComponent(title)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by title');
        return await response.json();
    }

    static async searchBooksByAuthor(author) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/author?author=${encodeURIComponent(author)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by author');
        return await response.json();
    }

    static async searchBooksByIsbn(isbn) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/search/isbn?isbn=${encodeURIComponent(isbn)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to search books by ISBN');
        return await response.json();
    }

    static async findBooksByUserId(userId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/books/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch books for user');
        return await response.json();
    }
    static async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            // Expecting the backend to return the token as plain text and admin info in a header or a follow-up fetch
            const token = await response.text();
            localStorage.setItem('booklifyToken', token);
            localStorage.setItem('booklifyUserRole', 'admin');
            localStorage.setItem('booklifyLoggedIn', 'true');
            localStorage.setItem('booklifyUserEmail', email);
            
            // Store login time for last login tracking
            localStorage.setItem('booklifyLastLogin', new Date().toISOString());

            // Fetch admin profile to get the ID
            const adminProfile = await AdminService.getAdminProfileByEmail(email);
            if (adminProfile && adminProfile.id) {
                localStorage.setItem('booklifyAdminId', adminProfile.id);
            }
            
            // Log the login activity
            if (typeof AdminService.logActivity === 'function') {
                AdminService.logActivity('Admin Login', email, 'Administrator logged into the system', 'admin_login');
            }
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Helper to fetch admin by email (assuming unique email)
    static async getAdminProfileByEmail(email) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/getByEmail?email=${encodeURIComponent(email)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) return null;
        const admin = await response.json();
        return admin;
    }

    static async register(adminData) {
        try {
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(adminData)
            });

            const responseData = await response.text();
            console.log('Registration response:', response.status, responseData);

            if (!response.ok) {
                // Try to parse the error message if it's JSON
                try {
                    const errorData = JSON.parse(responseData);
                    throw new Error(errorData.message || 'Registration failed');
                } catch (e) {
                    throw new Error(responseData || 'Registration failed');
                }
            }

            return responseData ? JSON.parse(responseData) : {};
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    static async getAdminProfile(id) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/getById/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }

    static async updateUser(userId, userData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update user');
            }

            // Since the backend method is void, we don't expect any content
            // Just return a success object
            return {
                success: true,
                message: 'User updated successfully',
                userId: userId,
                ...userData
            };
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    }

    static async updateAdminProfile(id, adminData) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/update/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(adminData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    static async searchUsersByEmail(email) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const response = await fetch(`${API_BASE_URL}/users/email?email=${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to search users');
            }

            return await response.json();
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    static async getUserById(userId) {
        try {
            const token = localStorage.getItem('booklifyToken');
            const isLoggedIn = localStorage.getItem('booklifyLoggedIn');
            const userRole = localStorage.getItem('booklifyUserRole');
            
            console.log('Debug - Admin authentication status:', {
                hasToken: !!token,
                isLoggedIn: isLoggedIn,
                userRole: userRole,
                tokenStart: token ? token.substring(0, 10) + '...' : 'null'
            });

            if (!token) {
                throw new Error('No authentication token found. Please login as admin.');
            }

            if (userRole !== 'admin') {
                throw new Error('Insufficient permissions. Admin access required.');
            }

            // Since /users/{id} endpoint might not exist, fetch all users and filter
            const response = await fetch(`${API_BASE_URL}/users/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access forbidden. Please re-login as admin.');
                }
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please re-login as admin.');
                }
                throw new Error(`Failed to fetch users (Status: ${response.status})`);
            }

            const allUsers = await response.json();
            const user = allUsers.find(u => u.id == userId);
            
            if (!user) {
                throw new Error(`User with ID ${userId} not found.`);
            }

            return user;
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    // Check if admin is properly authenticated
    static isAdminAuthenticated() {
        const token = localStorage.getItem('booklifyToken');
        const isLoggedIn = localStorage.getItem('booklifyLoggedIn');
        const userRole = localStorage.getItem('booklifyUserRole');
        
        return !!(token && isLoggedIn === 'true' && userRole === 'admin');
    }

    // Redirect to login if not authenticated
    static checkAuthAndRedirect() {
        if (!this.isAdminAuthenticated()) {
                    if (window.showToast) window.showToast('Your admin session has expired. Please login again.', 'warning'); else alert('Your admin session has expired. Please login again.');
            window.location.href = 'adminLogIn.html';
            return false;
        }
        return true;
    }

    // --- Order Management Methods ---

    static async viewAllOrders() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orders/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch all orders');
        return await response.json();
    }

    static async viewAllOrderItems() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch all order items');
        return await response.json();
    }

    static async updateOrderItemStatus(orderItemId, newStatus) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/ordersItem/${orderItemId}/status?newStatus=${encodeURIComponent(newStatus)}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to update order item status');
        // Expecting 204 No Content, so no JSON to parse
        return true;
    }

    static async searchOrdersByUserId(userId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orders/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search orders by user ID');
        return await response.json();
    }

    static async searchOrderItemsByOrderId(orderId) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/order/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search order items by order ID');
        return await response.json();
    }

    static async searchOrderItemsByStatus(status) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/orderItems/status?status=${encodeURIComponent(status)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search order items by status');
        return await response.json();
    }

    // --- Revenue Management Methods ---

    static async calculateTotalRevenue() {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/revenue/total`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to calculate total revenue');
        return await response.json();
    }

    static async calculateRevenueByDateRange(startDate, endDate) {
        const token = localStorage.getItem('booklifyToken');
        const response = await fetch(`${API_BASE_URL}/revenue/dateRange?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to calculate revenue by date range');
        return await response.json();
    }

    // Method to get recent activities by aggregating data from multiple sources
    static async getRecentActivities(limit = 10) {
        try {
            console.log('Starting to fetch recent activities...');
            const activities = [];
            
            // Get recent users with better error handling
            try {
                console.log('Fetching recent users...');
                const users = await this.getAllUsers();
                console.log('Users fetched:', users?.length || 0);
                
                if (users && users.length > 0) {
                    // Sort users by date and take most recent
                    const sortedUsers = users.sort((a, b) => {
                        const dateA = new Date(a.dateJoined || a.createdAt || 0);
                        const dateB = new Date(b.dateJoined || b.createdAt || 0);
                        return dateB - dateA;
                    });
                    
                    const recentUsers = sortedUsers.slice(0, 3).map(user => ({
                        action: 'User Registration',
                        user: user.fullName || user.email || 'Unknown User',
                        details: `New user joined: ${user.email || 'Unknown Email'}`,
                        date: user.dateJoined || user.createdAt || new Date().toISOString(),
                        type: 'user_registration',
                        icon: 'bi-person-plus'
                    }));
                    activities.push(...recentUsers);
                    console.log('Added user activities:', recentUsers.length);
                }
            } catch (error) {
                console.warn('Failed to fetch users for activities:', error.message);
            }

            // Get recent books with better error handling
            try {
                console.log('Fetching recent books...');
                const books = await this.getAllBooks();
                console.log('Books fetched:', books?.length || 0);
                
                if (books && books.length > 0) {
                    // Sort books by date and take most recent
                    const sortedBooks = books.sort((a, b) => {
                        const dateA = new Date(a.datePosted || a.createdAt || 0);
                        const dateB = new Date(b.datePosted || b.createdAt || 0);
                        return dateB - dateA;
                    });
                    
                    const recentBooks = sortedBooks.slice(0, 3).map(book => ({
                        action: 'Book Upload',
                        user: book.uploadedBy || book.seller?.fullName || book.seller?.email || 'Unknown User',
                        details: `New book listed: "${book.title || 'Unknown Title'}"`,
                        date: book.datePosted || book.createdAt || new Date().toISOString(),
                        type: 'book_upload',
                        icon: 'bi-book-fill'
                    }));
                    activities.push(...recentBooks);
                    console.log('Added book activities:', recentBooks.length);
                }
            } catch (error) {
                console.warn('Failed to fetch books for activities:', error.message);
            }

            // Get recent orders with better error handling
            try {
                console.log('Fetching recent orders...');
                const orders = await this.viewAllOrders();
                console.log('Orders fetched:', orders?.length || 0);
                
                if (orders && orders.length > 0) {
                    // Sort orders by date and take most recent
                    const sortedOrders = orders.sort((a, b) => {
                        const dateA = new Date(a.orderDate || a.createdAt || 0);
                        const dateB = new Date(b.orderDate || b.createdAt || 0);
                        return dateB - dateA;
                    });
                    
                    const recentOrders = sortedOrders.slice(0, 3).map(order => ({
                        action: 'New Order',
                        user: order.regularUser?.fullName || order.regularUser?.email || order.customerEmail || 'Unknown Customer',
                        details: `Order #${order.orderId || 'N/A'} placed - R${(order.totalAmount || 0).toFixed(2)}`,
                        date: order.orderDate || order.createdAt || new Date().toISOString(),
                        type: 'order_created',
                        icon: 'bi-cart-plus'
                    }));
                    activities.push(...recentOrders);
                    console.log('Added order activities:', recentOrders.length);
                }
            } catch (error) {
                console.warn('Failed to fetch orders for activities:', error.message);
            }

            // Get recent order status updates
            try {
                console.log('Fetching recent order items...');
                const orderItems = await this.viewAllOrderItems();
                console.log('Order items fetched:', orderItems?.length || 0);
                
                if (orderItems && orderItems.length > 0) {
                    const statusUpdates = orderItems
                        .filter(item => item.orderStatus && item.orderStatus !== 'PENDING')
                        .sort((a, b) => {
                            const dateA = new Date(a.updatedAt || a.createdAt || 0);
                            const dateB = new Date(b.updatedAt || b.createdAt || 0);
                            return dateB - dateA;
                        })
                        .slice(0, 2)
                        .map(item => ({
                            action: 'Status Update',
                            user: 'Admin',
                            details: `Order #${item.orderId || 'N/A'} status changed to ${item.orderStatus}`,
                            date: item.updatedAt || item.createdAt || new Date().toISOString(),
                            type: 'status_update',
                            icon: 'bi-arrow-repeat'
                        }));
                    activities.push(...statusUpdates);
                    console.log('Added status update activities:', statusUpdates.length);
                }
            } catch (error) {
                console.warn('Failed to fetch order items for activities:', error.message);
            }

            // If no real activities found, return an empty list so the UI can show the empty state
            // (Avoid adding hard-coded or sample activities here.)
            if (activities.length === 0) {
                console.log('No real activities found for recent activities; returning empty list');
            }
            
            // Sort all activities by date (newest first) and limit results
            activities.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });

            const result = activities.slice(0, limit);
            console.log('Final activities to display:', result.length);
            return result;
            
        } catch (error) {
            console.error('Error fetching recent activities:', error);
            // Return fallback activities on complete failure
            return [
                {
                    action: 'System Error',
                    user: 'System',
                    details: 'Unable to load recent activities',
                    date: new Date().toISOString(),
                    type: 'error',
                    icon: 'bi-exclamation-triangle'
                }
            ];
        }
    }

    // Activity logging system for real-time tracking
    static logActivity(action, user, details, type = 'admin_action') {
        try {
            // Use high precision timestamp to ensure proper ordering
            const now = Date.now();
            // Add a small random offset to prevent identical timestamps
            const preciseTimestamp = now + Math.random();
            
            const activity = {
                action,
                user,
                details,
                date: new Date(now).toISOString(),
                timestamp: preciseTimestamp, // Use precise timestamp for sorting
                type,
                icon: this.getActivityIcon(type),
                id: `activity_${now}_${Math.random().toString(36).substr(2, 5)}`
            };

            // Get existing activities
            let activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
            
            // Remove any very similar activity from the last few seconds
            activities = activities.filter(existing => {
                const timeDiff = Math.abs(existing.timestamp - preciseTimestamp);
                const isSimilar = existing.action === action && 
                                existing.details === details && 
                                timeDiff < 2000; // 2 seconds
                return !isSimilar;
            });
            
            // Add new activity
            activities.push(activity);
            
            // Sort by precise timestamp (newest first) and keep only recent ones
            activities = activities
                .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()))
                .slice(0, 10);
            
            // Save back to localStorage
            localStorage.setItem('recentActivities', JSON.stringify(activities));
            
            console.log('✅ Activity logged with timestamp:', {
                action: activity.action,
                user: activity.user,
                timestamp: activity.timestamp,
                date: activity.date
            });
            
            // Trigger activity refresh if dashboard is open
            setTimeout(() => {
                if (typeof window.loadActivities === 'function') {
                    window.loadActivities();
                }
            }, 100);
            
            return activity;
        } catch (error) {
            console.error('❌ Failed to log activity:', error);
            return null;
        }
    }

    // Test function to create sample activities with precise timing
    static createTestActivities() {
        console.log('🧪 Creating test activities with 2-second intervals...');
        
        const testActivities = [
            { action: 'User Login', user: 'john.doe@email.com', details: 'User logged into the system', type: 'user_action' },
            { action: 'Book Upload', user: 'jane.smith@email.com', details: 'New book "React Guide" uploaded', type: 'book_upload' },
            { action: 'Order Placed', user: 'mike.wilson@email.com', details: 'Order #12345 placed - R299.99', type: 'order_created' },
            { action: 'Profile Update', user: 'sarah.jones@email.com', details: 'User profile information updated', type: 'user_edit' },
            { action: 'System Backup', user: 'System', details: 'Daily backup completed successfully', type: 'system' }
        ];
        
        // Create activities with precise 2-second intervals
        testActivities.forEach((activity, index) => {
            setTimeout(() => {
                console.log(`🕒 Creating activity ${index + 1}: ${activity.action}`);
                this.logActivity(activity.action, activity.user, activity.details, activity.type);
            }, index * 2000); // 2 seconds apart for clear separation
        });
        
        console.log('🚀 Test sequence started - 5 activities will be created over 10 seconds');
    }

    // Get stored activities from localStorage
    static getStoredActivities() {
        try {
            const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
            // Return only the most recent activities, sorted by timestamp then date
            return activities
                .sort((a, b) => {
                    // Use timestamp if available, otherwise fall back to date
                    const timeA = a.timestamp || new Date(a.date).getTime();
                    const timeB = b.timestamp || new Date(b.date).getTime();
                    return timeB - timeA;
                })
                .slice(0, 12); // Keep only top 12 stored activities
        } catch (error) {
            console.error('Failed to get stored activities:', error);
            return [];
        }
    }

    // Clean old activities from localStorage (keep only recent ones)
    static cleanOldActivities() {
        try {
            const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
            const now = new Date();
            
            // Keep only activities from the last 24 hours and the most recent 15
            const cleanedActivities = activities
                .filter(activity => {
                    const activityDate = new Date(activity.date);
                    const hoursDiff = (now - activityDate) / (1000 * 60 * 60);
                    return hoursDiff <= 24; // Keep activities from last 24 hours
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 15); // Keep only top 15
                
            localStorage.setItem('recentActivities', JSON.stringify(cleanedActivities));
            console.log(`Cleaned activities: kept ${cleanedActivities.length} out of ${activities.length}`);
        } catch (error) {
            console.error('Failed to clean old activities:', error);
        }
    }

    // Get appropriate icon for activity type
    static getActivityIcon(type) {
        const icons = {
            'user_registration': 'bi-person-plus',
            'book_upload': 'bi-book-fill',
            'order_created': 'bi-cart-plus',
            'status_update': 'bi-arrow-repeat',
            'admin_action': 'bi-gear',
            'user_edit': 'bi-person-gear',
            'book_edit': 'bi-pencil-square',
            'book_delete': 'bi-trash',
            'user_delete': 'bi-person-x',
            'system': 'bi-check-circle',
            'error': 'bi-exclamation-triangle'
        };
        return icons[type] || 'bi-info-circle';
    }

    // Enhanced getRecentActivities that combines API data with stored activities
    static async getRecentActivitiesEnhanced(limit = 8) {
        try {
            console.log('🔄 Starting getRecentActivitiesEnhanced with limit:', limit);
            
            // Step 1: Get all stored activities from localStorage
            const storedActivities = this.getStoredActivities();
            console.log('📦 Stored activities retrieved:', storedActivities.length);
            
            // Step 2: Get API activities but don't mix them immediately
            let apiActivities = [];
            try {
                apiActivities = await this.getRecentActivities(limit);
                console.log('🌐 API activities retrieved:', apiActivities.length);
            } catch (error) {
                console.warn('⚠️ API activities failed:', error.message);
                apiActivities = [];
            }

            // Step 3: Create a unified list with clear timestamps
            const allActivities = [];
            
            // Add stored activities with priority
            storedActivities.forEach(activity => {
                allActivities.push({
                    ...activity,
                    source: 'localStorage',
                    sortKey: activity.timestamp || new Date(activity.date).getTime() || 0
                });
            });
            
            // Add API activities only if we don't have enough stored activities
            if (allActivities.length < limit) {
                apiActivities.forEach(activity => {
                    allActivities.push({
                        ...activity,
                        source: 'api', 
                        sortKey: new Date(activity.date).getTime() || 0
                    });
                });
            }
            
            // Step 4: Sort everything by timestamp (newest first)
            const sortedActivities = allActivities
                .sort((a, b) => b.sortKey - a.sortKey) // Descending order (newest first)
                .slice(0, limit); // Take only the requested number
                
            console.log('✅ Final activities sorted:', sortedActivities.length);
            console.log('📋 Activities preview:', sortedActivities.map(a => ({
                action: a.action,
                date: a.date,
                source: a.source
            })));

            // Step 5: Clean up the response (remove our helper properties)
            const cleanActivities = sortedActivities.map(activity => {
                const { source, sortKey, ...cleanActivity } = activity;
                return cleanActivity;
            });

            // Step 6: Return results or fallback
            if (cleanActivities.length === 0) {
                console.log('📝 No activities found in enhanced fetch; returning empty list');
                return [];
            }

            console.log('🎯 Returning', cleanActivities.length, 'activities');
            return cleanActivities;
            
        } catch (error) {
            console.error('Error in getRecentActivitiesEnhanced:', error);
            
            // Return stored activities if available, otherwise return default activities
            const stored = this.getStoredActivities();
            if (stored.length > 0) {
                return stored.slice(0, limit);
            }
            
            // Final fallback - return error activity
            return [{
                action: 'System Error',
                user: 'System',
                details: 'Unable to load activities: ' + error.message,
                date: new Date().toISOString(),
                type: 'error',
                icon: 'bi-exclamation-triangle'
            }];
        }
    }
}