# FlexiLeave App

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

A modern, feature-rich **Leave Management System** designed for organizations to streamline employee leave requests, approvals, and tracking. Built with a modern tech stack and intuitive user interface.

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
- **React 18+** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Context** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma ORM** - Database ORM and schema management
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vite** - Fast build tool and dev server
- **Git** - Version control

---

## 📸 Screenshots

### Authentication & Onboarding
![Login Screen](frontend/public/ex-6.png)
*Secure login with role-based access*

### Employee Dashboard
![Employee Dashboard](frontend/public/ex-2.png)
*Overview of leave balance and recent requests*

### Leave Request Form
![Leave Request Form](frontend/public/ex-4.png)
*Comprehensive form with date picker and reason input*

![Leave Request Details](frontend/public/ex-5.png)
*Additional options and attachments*

### Leave Tracking
![Leave History](frontend/public/ex-7.png)
*Detailed view of all leave requests and their status*

### Analytics & Reports
![Analytics Dashboard](frontend/public/ex-3.png)
*System-wide statistics and trends*

![Detailed Reports](frontend/public/ex-8.png)
*Advanced reporting and filtering options*

### Admin Management
![Admin Dashboard](frontend/public/ex-1.png)
*Overview of pending requests and system metrics*

![Approval Workflow](frontend/public/ex-9.png)
*Streamlined approval and rejection process*

---

## 🏗️ Architecture

```
flexileave-app/
├── backend/                    # Node.js + Express API server
│   ├── prisma/                # Database schema and migrations
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Authentication and validation
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   └── package.json
├── frontend/                   # React application
│   ├── public/                # Static assets and images
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── context/          # State management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Frontend utilities
│   │   └── styles/           # Global styles
│   └── package.json
├── uploads/                   # File upload directory
└── README.md                  # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/jackson951/flexileave-app.git
cd flexileave-app
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:
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
```

#### Database Setup
```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

#### Start Backend Server
```bash
npm run dev
```
The API will be available at `http://localhost:5000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_APP_NAME="FlexiLeave"
VITE_APP_VERSION="1.0.0"
```

#### Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

---

## 🔧 Configuration

### Database Configuration
The application uses Prisma ORM for database management. The database schema is defined in `backend/prisma/schema.prisma`.

### Environment Variables
Both frontend and backend require environment variables for proper configuration. Refer to the `.env.example` files in each directory for complete configuration options.

### CORS Configuration
CORS is configured in the backend to allow requests from the frontend. Update the allowed origins in `backend/src/middleware/cors.js` for production use.

---

## 📊 API Documentation

The API follows RESTful conventions and includes comprehensive error handling.

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/logout` - User logout

### Leave Management Endpoints
- `GET /api/leaves` - Get all leaves (admin) or user's leaves
- `POST /api/leaves` - Create new leave request
- `PUT /api/leaves/:id` - Update leave status (admin)
- `DELETE /api/leaves/:id` - Delete leave request

### User Management Endpoints
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create new user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

For detailed API documentation, refer to the OpenAPI specification in `backend/docs/api.yaml`.

---

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Railway Deployment
The application includes a `railway.json` configuration file for easy deployment to Railway.

### Vercel Deployment
Frontend can be deployed to Vercel with the included `vercel.json` configuration.

### Production Considerations
- Use environment-specific configuration
- Set up proper SSL/TLS certificates
- Configure database backups
- Set up monitoring and logging
- Implement proper security headers

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