# 📚 Booklify

> **Affordable Textbooks for University Students**

Booklify is a comprehensive online marketplace platform that connects students and educators with quality textbooks at unbeatable prices. Whether you're buying, selling, or managing your academic materials, Booklify provides a user-friendly solution for all your textbook needs.

![Booklify Banner](frontend/assets/images/students.jpg)

## ✨ Features

### 🛒 **Buy Textbooks**
- Browse an extensive collection of second-hand and brand-new textbooks
- Advanced filtering by subject, condition, and price range
- Detailed condition ratings and reports for every book
- Compare prices from multiple sellers
- Save up to 70% on textbook costs

### 📤 **Sell Your Books**
- Easy book listing with ISBN, title, and author search
- Upload photos and detailed condition descriptions
- Set competitive pricing based on market rates
- Track listing views and buyer interest
- Manage availability and edit details through seller dashboard

### 👤 **User Profiles & Dashboards**
- **Buyer Dashboard**: Track orders, manage cart, view purchase history
- **Seller Dashboard**: Manage listings, track sales performance, view analytics
- **Admin Dashboard**: Monitor platform activity, manage users, view system analytics
- Personalized profiles with bio and seller ratings
- Review system for buyers and sellers

### 🔒 **Quality & Security**
- Every textbook includes detailed condition ratings
- Secure payment processing
- User authentication and authorization
- 24/7 customer support
- Quality guarantee on all purchases

### 📊 **Analytics & Insights**
- Sales performance tracking
- Listing view analytics
- Revenue insights for sellers
- User engagement metrics

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with Bootstrap framework
- **JavaScript (Vanilla)** - Client-side interactivity
- **Bootstrap 5.3.0** - Responsive design and UI components
- **Bootstrap Icons** - Icon library

### Development Tools
- **http-server** - Local development server
- **Node.js & npm** - Package management

### Architecture
- **SPA (Single Page Application)** principles
- **RESTful API** integration (Backend API endpoint: `http://localhost:8081/api`)
- **Service-based architecture** for separation of concerns
- **Modular JavaScript** with dedicated service files

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ranelan/Booklify.git
   cd Booklify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The application should now be running!

## 📖 Usage

### For Buyers
1. Browse the **Shop Textbooks** page
2. Use filters to find books by subject, condition, or price
3. View detailed book information and seller ratings
4. Add books to your cart
5. Complete secure checkout
6. Track your orders in your profile

### For Sellers
1. Create an account or log in
2. Navigate to **Sell Your Books**
3. Enter book details (ISBN, title, author)
4. Upload clear photos and describe the condition
5. Set your competitive price
6. Manage your listings through the seller dashboard

### For Admins
1. Log in with admin credentials
2. Access the admin dashboard
3. Monitor platform activity and user management
4. View analytics and system performance

## 📁 Project Structure

```
Booklify/
├── frontend/
│   ├── assets/
│   │   ├── icons/          # Favicon and app icons
│   │   └── images/         # Product and promotional images
│   ├── css/
│   │   ├── analytics.css   # Analytics dashboard styling
│   │   └── style.css       # Main stylesheet
│   ├── js/
│   │   ├── addressService.js      # Address management
│   │   ├── admin.js               # Admin functionality
│   │   ├── adminAnalytics.js      # Admin analytics
│   │   ├── adminService.js        # Admin API service
│   │   ├── auth.js                # Authentication logic
│   │   ├── cart.js                # Shopping cart UI
│   │   ├── cartService.js         # Cart API service
│   │   ├── chartService.js        # Chart visualizations
│   │   ├── checkout.js            # Checkout process
│   │   ├── dashboard.js           # User dashboard
│   │   ├── emailService.js        # Email functionality
│   │   ├── invoiceService.js      # Invoice generation
│   │   ├── myReviews.js           # User reviews management
│   │   ├── navbar.js              # Navigation component
│   │   ├── orderService.js        # Order management
│   │   ├── ordersPage.js          # Orders page UI
│   │   ├── payment.js             # Payment processing
│   │   ├── paymentService.js      # Payment API service
│   │   ├── product-detail.js      # Product details UI
│   │   ├── products.js            # Products listing UI
│   │   ├── profile.js             # User profile management
│   │   ├── profileListings.js     # Seller listings
│   │   ├── reviewComponent.js     # Review components
│   │   ├── reviewService.js       # Review API service
│   │   ├── reviewsPage.js         # Reviews page UI
│   │   ├── sell.js                # Sell books functionality
│   │   ├── toastHelper.js         # Toast notifications
│   │   ├── userAnalytics.js       # User analytics
│   │   └── userService.js         # User API service
│   ├── pages/
│   │   ├── about.html             # About page
│   │   ├── admin-dashboard.html   # Admin dashboard
│   │   ├── admin-profile.html     # Admin profile
│   │   ├── adminLogIn.html        # Admin login
│   │   ├── cart.html              # Shopping cart
│   │   ├── checkout.html          # Checkout page
│   │   ├── login.html             # User login/register
│   │   ├── my-reviews.html        # User's reviews
│   │   ├── orders.html            # Orders history
│   │   ├── payment.html           # Payment page
│   │   ├── product-detail.html    # Product details
│   │   ├── products.html          # Product listing
│   │   ├── profile.html           # User profile
│   │   ├── reviews.html           # Product reviews
│   │   └── sell.html              # Sell books form
│   ├── examples/                  # Example files
│   ├── index.html                 # Landing page
│   └── test-activities.html       # Testing page
├── node_modules/                  # Dependencies (gitignored)
├── package.json                   # Project configuration
├── package-lock.json              # Dependency lock file
└── README.md                      # This file

```

## 🔧 Development

### Available Scripts

- `npm start` - Start the development server on port 3000
- `npm test` - Run tests (to be configured)

### Backend API

The application expects a backend API running on `http://localhost:8081/api`. The API should provide endpoints for:

- User authentication (`/regular-user/login`, `/regular-user/create`)
- Admin operations (`/admin/*`)
- Product management
- Order processing
- Review management
- Payment processing

## 🤝 Contributing

We welcome contributions to Booklify! To contribute:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/YourFeatureName
   ```
3. **Make your changes**
   - Follow the existing code style
   - Ensure your code is well-documented
   - Test your changes thoroughly
4. **Commit your changes**
   ```bash
   git commit -m "Add: Your feature description"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/YourFeatureName
   ```
6. **Open a Pull Request**

### Code Style Guidelines
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing file structure
- Ensure responsive design for all new UI components
- Test across multiple browsers

## 📝 License

This project is part of a Group Assignment for 2025. All rights reserved.

## 📞 Support

- **Issues**: For bug reports and feature requests, please use [GitHub Issues](https://github.com/Ranelan/Booklify/issues)

## 🙏 Acknowledgments

- Bootstrap team for the excellent UI framework
- All contributors and testers who helped improve Booklify

### Upcoming Features
- [ ] Advanced search with AI-powered recommendations
- [ ] Integration with major book publishers
- [ ] Multiple payment gateway options
- [ ] Book condition verification with image recognition

---

**Made with ❤️ for students by students**
