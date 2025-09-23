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
import { useApiInterceptors } from "../api/web-api-service";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Public route wrapper - only accessible when NOT logged in
const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Protected route wrapper - only accessible when logged in
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-only protected route wrapper
const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

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
  return user?.role === "admin" ? adminComponent : userComponent;
};

const AppRoutes = () => {
  const { user, logout } = useAuth();
  
  // Initialize API interceptors
  useApiInterceptors();

  return (
    <Routes>
      {/* Public Routes - Only accessible when NOT logged in */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } 
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Dashboard Routes */}
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
        {/* Dashboard home - role-based default view */}
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

        {/* Leave Management Routes */}
        <Route path="leave/new" element={<NewLeaveRequest />} />
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

        {/* Admin-Only Routes */}
        <Route
          path="calendar"
          element={
            <AdminRoute>
              <TeamCalender />
            </AdminRoute>
          }
        />
        <Route
          path="reports"
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        {/* Profile - Available to all authenticated users */}
        <Route path="profile" element={<ProfilePage user={user} />} />

        {/* Dashboard 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Global 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;