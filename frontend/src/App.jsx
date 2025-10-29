import React, { lazy } from "react";
import "./App.css";
import AppRoutes from "./Routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";

const Header = lazy(() => import("./components/header"));

import { useApiInterceptors } from "./api/web-api-service";

function App() {
  const { isLoggedIn } = useAuth();
  useApiInterceptors();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Show header ONLY when not logged in */}
      {!isLoggedIn && <Header variant="default" />}

      {/* Main Content / Routes */}
      <main className="flex-1">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
