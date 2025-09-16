import React from "react";
import "./App.css";
import AppRoutes from "./Routes/AppRoutes";
import Header from "./components/header"; // Make sure path is correct
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { isLoggedIn } = useAuth();

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
