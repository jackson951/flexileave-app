import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginPage from "../pages/Login";
import DashboardLayout from "../components/DashboardLayout";
import UserDashboard from "../pages/user/Dashboard";
import AdminDashboard from "../pages/administrator/Dashboard";
import NewLeaveRequest from "../pages/leave/NewLeaveRequest";
import LeaveHistory from "../pages/leave/LeaveHistory";
import LeaveApprovals from "../pages/administrator/LeaveApproval";
import UserManagement from "../pages/administrator/UserManagement"; // Import the UserManagement component
import ReportsPage from "../pages/administrator/ExportReports";

// Role-based protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-only protected route wrapper
const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based component switcher
const RoleBased = ({ user, userComponent, adminComponent }) => {
  if (user?.role === "admin") {
    return adminComponent;
  }
  return userComponent;
};

const AppRoutes = () => {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout
              user={user}
              userType={user?.role}
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      >
        {/* Dashboard home: admin and user see different UIs */}
        <Route
          index
          element={
            <RoleBased
              user={user}
              userComponent={<UserDashboard />}
              adminComponent={<AdminDashboard />}
            />
          }
        />
        {/* Reports - Admin only */}
        <Route
          path="reports"
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          }
        />

        {/* Leave requests */}
        <Route
          path="leave/new"
          element={
            <RoleBased
              user={user}
              userComponent={<NewLeaveRequest />}
              adminComponent={<NewLeaveRequest />}
            />
          }
        />

        {/* Leave history (user) / approvals (admin) */}
        <Route
          path="leave"
          element={
            <RoleBased
              user={user}
              userComponent={<LeaveHistory />}
              adminComponent={<LeaveApprovals />}
            />
          }
        />

        {/* User Management - Admin only */}
        <Route
          path="users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        {/* Calendar (both see same placeholder for now) */}
        <Route
          path="calendar"
          element={<div className="p-6">📅 Calendar coming soon</div>}
        />

        {/* Settings (both see same placeholder for now) */}
        <Route
          path="settings"
          element={<div className="p-6">⚙️ Settings coming soon</div>}
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
