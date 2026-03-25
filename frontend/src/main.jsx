import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { LeaveRequestProvider } from "./contexts/LeaveRequestContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import { TenantProvider } from "./contexts/TenantContext.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <LeaveRequestProvider>
          <TenantProvider>
            <AuthProvider>
              <App />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </AuthProvider>
          </TenantProvider>
        </LeaveRequestProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
