# FlexiLeave App

A modern **Leave Management System** that allows organizations to manage employee leave requests efficiently. Employees can submit and track their leave, while admins can manage users and leave approvals.

---

## 🚀 Tech Stack

* **Frontend:** React + Tailwind CSS
* **Backend:** Node.js + Express
* **Database:** PostgreSQL (Prisma ORM)
* **Authentication:** JWT-based authentication with role-based access control

---

## ✨ Features

* Employee leave submission and real-time tracking
* Admin dashboard for managing users and leave requests
* Role-based access control (Admin / Employee)
* Secure JWT authentication
* Responsive, modern UI with Tailwind CSS
* Monorepo structure (Frontend + Backend in one repository)

---

## 🖼️ Application Screenshots

Below are example screenshots of the FlexiLeave application. These images are stored in the **frontend/public** folder of the repository.

### Login & Authentication

![Login Screen](frontend/public/ex-6.png)

### Employee Management 

![Employee Dashboard](frontend/public/ex-2.png)

### Leave Request Form

![Leave Request](frontend/public/ex-4.png)
![Leave Request](frontend/public/ex-5.png)

### Leave Tracking & History

![Leave History](frontend/public/ex-7.png)

### Leave Reports Page

![Leave History](frontend/public/ex-3.png)
![Leave History](frontend/public/ex-8.png)

### Admin Dashboard-Approval and Rejection

![Admin Dashboard](frontend/public/ex-1.png)
![Admin Dashboard](frontend/public/ex-9.png)

---

## 📁 Project Structure

```text
flexileave-app/
│
├── backend/          # Node.js + Express backend
│   ├── prisma/       # Prisma schema & migrations
│   ├── src/          # Controllers, routes, services
│   └── package.json
│
├── frontend/         # React + Tailwind CSS frontend
│   ├── public/       # Static assets & screenshots (ex-1.png ... ex-5.png)
│   ├── src/          # Components, pages, context
│   └── package.json
│
├── README.md         # Project documentation
└── package.json      # Root config (monorepo)
```

---

## 🛠️ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/jackson951/flexileave-app.git
cd flexileave-app
```

---

### 2️⃣ Install dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

---

### 3️⃣ Environment Variables

Create a `.env` file in the **backend** directory and configure the following:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flexileave
JWT_SECRET=your_jwt_secret
```

---

### 4️⃣ Run the application

#### Start Backend

```bash
cd backend
npm run dev
```

#### Start Frontend

```bash
cd frontend
npm run dev
```

The app should now be running locally 🎉

---

## 🔐 Roles & Access

* **Employee**: Submit leave requests, view leave history, track approval status
* **Admin**: Manage users, approve/reject leave requests, view system-wide data

---

## 📌 Future Improvements

* Email notifications for leave approvals/rejections
* Public holidays & leave balance rules
* Manager-level approvals
* Audit logs and reporting

---

## 👤 Author

**Jackson Khuto**
GitHub: [https://github.com/jackson951](https://github.com/jackson951)
