import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { LeaveRequestProvider } from "./contexts/LeaveRequestContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <LeaveRequestProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LeaveRequestProvider>
    </BrowserRouter>
  </StrictMode>
);
