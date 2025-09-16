import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginPage from "../pages/Login";
import DashboardLayout from "../components/DashboardLayout";
import NewLeaveRequest from "../pages/leave/NewLeaveRequest";
import LeaveHistory from "../pages/leave/LeaveHistory";
import LeaveApprovals from "../pages/administrator/LeaveApproval";
import UserManagement from "../pages/administrator/UserManagement";
import ReportsPage from "../pages/administrator/ExportReports";
import ProfilePage from "../pages/profilePage";
import NotFoundPage from "../pages/NotFoundPage";
import TeamCalender from "../pages/administrator/TeamCalender";
import ForgotPasswordPage from "../pages/ForgotPassword";

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
              userComponent={<LeaveHistory />}
              adminComponent={<LeaveApprovals />}
            />
          }
        />

        <Route
          path="calendar"
          element={
            <AdminRoute>
              <TeamCalender />
            </AdminRoute>
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

        {/* Leave requests - accessible to both users and admins */}
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

        {/* Profile Page - accessible to all authenticated users */}
        <Route path="profile" element={<ProfilePage user={user} />} />

        {/* Catch-all 404 Not Found inside dashboard */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Catch-all 404 Not Found for all other unknown routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
