import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "../pages/Login";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Login as the only route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Redirect root path to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Catch-all route redirects to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
