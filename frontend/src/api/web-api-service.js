// src/services/api.js
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

// Express API base URL
const BASE_URL = "http://localhost:5000/api/";

// Create Axios instance
export const ApiService = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // allows cookies (refresh token)
});

// Helper: Decode JWT to check expiration
const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Helper: Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Helper: Get token from storage (localStorage first, then sessionStorage)
const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

// Helper: Clear all auth tokens
const clearAuthTokens = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
};

// Custom hook to set up interceptors
export const useApiInterceptors = () => {
  const { logout, login } = useAuth(); // assuming logout clears user state
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ REQUEST INTERCEPTOR — Attach token only if valid
    const requestInterceptor = ApiService.interceptors.request.use(
      (config) => {
        const token = getAuthToken();

        // Only attach token if it exists and is NOT expired
        if (token && !isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // If expired, don't attach — will trigger 401 → refresh flow
          delete config.headers.Authorization;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // ✅ RESPONSE INTERCEPTOR — Handle 401, refresh token, auto-logout
    const responseInterceptor = ApiService.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and if not already retried
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/auth/refresh") // avoid refresh loop
        ) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh the token
            const { data } = await axios.post(
              `${BASE_URL}auth/refresh`,
              {},
              { withCredentials: true } // Send refresh token cookie
            );

            const newAccessToken = data.token;

            if (!newAccessToken) {
              throw new Error("No token returned from refresh");
            }

            // Save new token to localStorage
            localStorage.setItem("authToken", newAccessToken);

            // Update the original request header
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Retry the original request
            return ApiService(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);

            // Clear tokens and force logout
            clearAuthTokens();
            logout(); // update context state

            // Notify user
            toast.error("Session expired. Please log in again.", {
              position: "top-right",
              autoClose: 3000,
              theme: "colored",
            });

            // Redirect to login — use setTimeout to avoid React state update on unmounted component
            setTimeout(() => {
              navigate("/login", { replace: true });
            }, 100);

            // Reject original error so UI can handle it (optional)
            return Promise.reject(error);
          }
        }

        // For non-401 errors or already retried, just reject
        return Promise.reject(error);
      }
    );

    // Cleanup on unmount
    return () => {
      ApiService.interceptors.request.eject(requestInterceptor);
      ApiService.interceptors.response.eject(responseInterceptor);
    };
  }, [logout, navigate, login]);

  return ApiService;
};

// Optional: Export a logout utility that also clears API state
export const logoutUser = async () => {
  try {
    // Optional: Call backend logout to invalidate refresh token
    await ApiService.post("/auth/logout", {}, { withCredentials: true });
  } catch (err) {
    console.warn("Logout API call failed, proceeding with local logout");
  } finally {
    clearAuthTokens();
  }
};

// Optional: Re-export for direct use
export default ApiService;
