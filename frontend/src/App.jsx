import React from "react";
import "./App.css";
import AppRoutes from "./Routes/AppRoutes";
import Header from "./components/header"; // Make sure path is correct

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Universal Header */}
      <Header variant="default" />

      {/* Main Content / Routes */}
      <main className="flex-1">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
