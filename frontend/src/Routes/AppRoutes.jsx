import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useApiInterceptors } from "../api/web-api-service";

// Lazy load all pages for faster initial paint
const LoginPage = lazy(() => import("../pages/Login"));
const DashboardLayout = lazy(() => import("../components/DashboardLayout"));
const LeaveWorkspace = lazy(() => import("../pages/leaves/LeaveWorkspace"));
const NotificationsList = lazy(() =>
  import("../pages/notifications/NotificationsList")
);
const EmployeeManagement = lazy(() =>
  import("../pages/employees/EmployeeManagement")
);
const ReportsPage = lazy(() => import("../pages/administrator/ExportReports"));
const TenantDashboardPage = lazy(() =>
  import("../pages/administrator/TenantDashboard")
);
const TenantRegisterPage = lazy(() => import("../pages/TenantRegister"));
const AcceptInvitePage = lazy(() => import("../pages/AcceptInvite"));
const CompanySettings = lazy(() => import("../pages/settings/CompanySettings"));
const ProfilePage = lazy(() => import("../pages/profilePage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const TeamCalender = lazy(() => import("../pages/administrator/TeamCalender"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPassword"));
const NewLeaveRequest = lazy(() => import("../components/NewLeaveRequest"));

//Global Loading Spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Route Guards
const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (isLoggedIn) return <Navigate to="/dashboard/stats" replace />;
  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const privileged = ["admin", "owner", "manager"];
  if (!privileged.includes(user?.role?.toLowerCase() || "")) {
    return <Navigate to="/dashboard/leave" replace />;
  }
  return children;
};

const ManagementRoute = ({ children }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const allowed = ["admin", "manager", "owner"];
  if (loading) return <LoadingSpinner />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!allowed.includes(user?.role?.toLowerCase() || "")) {
    return <Navigate to="/dashboard/leave" replace />;
  }
  return children;
};

// Role-Based Rendering
const RoleBased = ({ user, userComponent, adminComponent }) => {
  const adminRoles = ["admin", "owner"];
  if (adminRoles.includes(user?.role?.toLowerCase() || "")) {
    return adminComponent;
  }
  return userComponent;
};

const AppRoutes = () => {
  const { user, logout, loading } = useAuth();

  // Initialize API interceptors
  useApiInterceptors();

  // Prevent white flash when auth is initializing
  if (loading) return <LoadingSpinner />;

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
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
        <Route
          path="/register"
          element={
            <PublicRoute>
              <TenantRegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/accept-invite"
          element={
            <PublicRoute>
              <AcceptInvitePage />
            </PublicRoute>
          }
        />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/dashboard/leave" replace />} />

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
          <Route path="stats" element={
              <ManagementRoute>
                <TenantDashboardPage />
              </ManagementRoute>
            } />
          <Route
            index
            element={<LeaveWorkspace />}
          />

          <Route path="leave/new" element={<NewLeaveRequest />} />
          <Route path="leave" element={<LeaveWorkspace />} />
          <Route path="notifications" element={<NotificationsList />} />
          <Route
            path="users"
            element={
              <ManagementRoute>
                <EmployeeManagement />
              </ManagementRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ManagementRoute>
                <CompanySettings />
              </ManagementRoute>
            }
          />

          {/* Admin-only */}
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
          {/* Profile */}
          <Route path="profile" element={<ProfilePage user={user} />} />

          {/* Dashboard 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Global 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
