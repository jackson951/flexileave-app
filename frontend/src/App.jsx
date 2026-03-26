import React, { lazy } from "react";
import "./App.css";
import AppRoutes from "./Routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import ThemeProvider from "./components/ThemeProvider";
import { useLocation } from "react-router-dom";

const Header = lazy(() => import("./components/header"));

import { useApiInterceptors } from "./api/web-api-service";

function App() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  useApiInterceptors();

  const hideHeaderPaths = new Set([
    "/",
    "/features",
    "/pricing",
    "/about",
    "/contact",
    "/accept-invite",
    "/login",
    "/register",
    "/forgot-password",
  ]);
  const showDefaultHeader =
    !isLoggedIn && !hideHeaderPaths.has(location.pathname);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        {/* Show header for public auth flows */}
        {/* {showDefaultHeader && <Header variant="default" />} */}

        {/* Main Content / Routes */}
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
