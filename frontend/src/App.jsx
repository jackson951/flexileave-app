import React, { lazy } from "react";
import "./App.css";
import AppRoutes from "./Routes/AppRoutes";
import { useAuth } from "./contexts/AuthContext";
import ThemeProvider from "./components/ThemeProvider";

const Header = lazy(() => import("./components/header"));

import { useApiInterceptors } from "./api/web-api-service";

function App() {
  const { isLoggedIn } = useAuth();
  useApiInterceptors();

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        {/* Show header for authenticated users */}
        {!isLoggedIn && <Header variant="default" />}

        {/* Main Content / Routes */}
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
