# FlexiLeave App

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

A modern, enterprise-grade **Leave Management System** designed for organizations to streamline employee leave requests, approvals, and tracking. Built with cutting-edge technologies and featuring an intuitive, professional interface.

---

## 🌟 Key Features

### For Employees
- **Easy Leave Requests**: Submit leave requests with multiple leave types
- **Real-time Tracking**: Monitor request status from submission to approval
- **Leave Balance**: View remaining leave days and entitlements
- **Leave History**: Access complete leave history and past requests
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### For Administrators
- **User Management**: Add, edit, and manage employee accounts
- **Leave Approvals**: Review and approve/reject leave requests
- **Analytics Dashboard**: View system-wide leave statistics and trends
- **Role-based Access**: Secure admin controls with proper permissions
- **Bulk Operations**: Efficiently manage multiple requests at once

### System Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and Employee roles with appropriate permissions
- **Data Validation**: Comprehensive input validation and error handling
- **Modern UI/UX**: Clean, intuitive interface built with Tailwind CSS
- **RESTful API**: Well-structured backend API for seamless frontend integration

---

## 🚀 Tech Stack

### Frontend
- **React 18+** - Modern UI library with hooks and context
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router** - Client-side routing for SPA navigation
- **Axios** - HTTP client for API communication
- **React Context** - State management without external libraries
- **React Hook Form** - Form validation and handling
- **React Calendar** - Date selection components

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Prisma ORM** - Modern database toolkit and ORM
- **PostgreSQL** - Enterprise-grade relational database
- **JWT** - JSON Web Token for secure authentication
- **Bcrypt** - Password hashing and security
- **Multer** - File upload handling
- **Nodemailer** - Email notifications

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting and consistency
- **Vite** - Fast build tool and development server
- **Git** - Version control and collaboration
- **Docker** - Containerization for deployment
- **Railway** - Cloud deployment platform

---

## 📸 Application Screenshots

### Dashboard & Overview
![Dashboard Overview](frontend/src/assets/app-images/dashboard-1.png)
*Main dashboard with system overview and quick actions*

![Detailed Dashboard](frontend/src/assets/app-images/dashboard-2.png)
*Comprehensive dashboard with analytics and metrics*

### Employee Management
![Employee Directory](frontend/src/assets/app-images/eemployee-management.png)
*Complete employee directory with search and filtering capabilities*

### Leave Management
![Leave Requests Overview](frontend/src/assets/app-images/leaves-1.png)
*Overview of all leave requests with status indicators and filtering*

![Leave Request Details](frontend/src/assets/app-images/leaves-2.png)
*Detailed view of individual leave requests with approval workflow*

### Team Calendar
![Team Calendar Overview](frontend/src/assets/app-images/team-calendar-1.png)
*Visual overview of team availability and scheduled leaves*

![Calendar Details](frontend/src/assets/app-images/team-calendar-2.png)
*Interactive calendar with detailed view and planning tools*

### Analytics & Reports
![Reports Dashboard](frontend/src/assets/app-images/reports-page-1.png)
*System-wide statistics and trend analysis with interactive charts*

![Advanced Analytics](frontend/src/assets/app-images/reports-page-2.png)
*Advanced reporting with customizable filters and export options*

### User Profile & Settings
![Profile Overview](frontend/src/assets/app-images/profile-page-1.png)
*User profile with basic information and quick settings*

![Profile Details](frontend/src/assets/app-images/profile-page-2.png)
*Detailed user information and account preferences*

![Profile Configuration](frontend/src/assets/app-images/profile-page-3.png)
*Account management, notification preferences, and security settings*

### Notifications & Alerts
![Notifications Center](frontend/src/assets/app-images/notifications-page.png)
*Real-time notifications and alerts with action buttons*

### Company Administration
![Company Settings](frontend/src/assets/app-images/company-settings.png)
*Organization-wide settings, policies, and system configurations*

---

## 🏗️ Architecture Overview

### System Architecture
```
flexileave-app/
├── backend/                    # Node.js + Express API server
│   ├── prisma/                # Database schema and migrations
│   ├── src/
│   │   ├── controllers/       # Request handlers and business logic
│   │   ├── middleware/        # Authentication, validation, and security
│   │   ├── routes/           # API route definitions and endpoints
│   │   ├── services/         # Business logic and data processing
│   │   ├── utils/            # Utility functions and helpers
│   │   └── models/           # Data models and validation schemas
│   ├── config/               # Configuration files
│   ├── scripts/              # Database scripts and utilities
│   └── package.json
├── frontend/                   # React application
│   ├── public/                # Static assets and favicon
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components and views
│   │   ├── context/          # State management with React Context
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Frontend utilities and helpers
│   │   ├── services/         # API service calls and data fetching
│   │   ├── styles/           # Global styles and theme
│   │   └── assets/           # Images, icons, and other assets
│   ├── eslint.config.js      # ESLint configuration
│   ├── vite.config.js        # Vite build configuration
│   └── package.json
├── uploads/                   # File upload directory
├── docker/                    # Docker configuration files
├── docs/                      # Documentation and API specs
└── README.md                  # This comprehensive documentation
```

### Database Schema
The application uses Prisma ORM with a PostgreSQL database featuring:
- **Users**: Employee information, roles, and authentication
- **Leaves**: Leave requests, status, and approval workflow
- **Departments**: Organizational structure and team management
- **Notifications**: Real-time alerts and system messages
- **Audit Logs**: Security and compliance tracking

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Quick Start

#### 1. Clone the Repository
```bash
git clone https://github.com/jackson951/flexileave-app.git
cd flexileave-app
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your environment
# Edit .env with your database credentials and JWT secret
```

#### 3. Database Configuration
```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

#### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure frontend environment
# Edit .env with your API base URL
```

#### 5. Start Development Servers
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in a new terminal)
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/flexileave?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Application
PORT=5000
NODE_ENV=development

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@yourcompany.com"

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH="./uploads"
```

#### Frontend (.env)
```env
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_APP_NAME="FlexiLeave"
VITE_APP_VERSION="1.0.0"
VITE_APP_DESCRIPTION="Enterprise Leave Management System"
```

### CORS Configuration
Update allowed origins in `backend/src/middleware/cors.js` for production:
```javascript
const allowedOrigins = [
  'https://your-frontend-domain.com',
  'https://your-admin-domain.com'
];
```

---

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication with email and password
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/logout` - User logout and token invalidation
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Leave Management Endpoints
- `GET /api/leaves` - Get all leaves (admin) or user's leaves
- `POST /api/leaves` - Create new leave request
- `GET /api/leaves/:id` - Get specific leave request details
- `PUT /api/leaves/:id` - Update leave status (admin)
- `DELETE /api/leaves/:id` - Delete leave request
- `GET /api/leaves/balance` - Get user's leave balance

### User Management Endpoints
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create new user (admin)
- `GET /api/users/:id` - Get specific user details
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/departments` - Get department list

### Analytics & Reports Endpoints
- `GET /api/analytics/overview` - System-wide overview statistics
- `GET /api/analytics/leaves` - Leave analytics and trends
- `GET /api/analytics/users` - User activity and engagement metrics
- `GET /api/reports/leaves` - Generate leave reports
- `GET /api/reports/users` - Generate user reports
- `GET /api/reports/departments` - Generate department reports

### Notifications Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread notification count

### File Upload Endpoints
- `POST /api/uploads` - Upload files (avatars, documents)
- `GET /api/uploads/:filename` - Download files
- `DELETE /api/uploads/:filename` - Delete uploaded files

### Department Management Endpoints
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

For detailed API documentation with request/response examples, refer to the OpenAPI specification in `backend/docs/api.yaml`.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
# Using Cypress
npm run cypress:open
```

### Performance Testing
```bash
# Load testing with Artillery
npm run test:load
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write clear, concise comments for complex logic
- Maintain consistent formatting
- Follow Git commit message conventions

---

## 📋 Project Roadmap

### ✅ Completed
- User authentication and authorization
- Leave request submission and tracking
- Admin dashboard for user and leave management
- Responsive frontend design
- Database schema and migrations

### 🚧 In Progress
- Email notifications for leave updates
- Leave balance calculations and policies
- Advanced analytics and reporting
- Mobile application development

### 📅 Planned
- Integration with calendar applications
- Multi-tenant support for multiple organizations
- Advanced leave policy configuration
- Performance optimization and caching

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Jackson Khuto** - [GitHub Profile](https://github.com/jackson951)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - For the amazing UI library
- [Tailwind CSS](https://tailwindcss.com/) - For the fantastic CSS framework
- [Prisma](https://www.prisma.io/) - For the excellent ORM
- [Express.js](https://expressjs.com/) - For the robust backend framework

---

## 📞 Support

For support, email jackson.khuto@example.com or create an issue on the GitHub repository.

---

**Made with ❤️ by Jackson Khuto**