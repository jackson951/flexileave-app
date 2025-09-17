// src/services/api.js
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { checkTokenExpiration } from "./auth";

// Express API base URL
const BASE_URL = "http://localhost:5000/api/";

// Create Axios instance
export const ApiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Custom hook to attach interceptors
export const useApiInterceptors = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-logout timer if expiration is stored
    const expiration = localStorage.getItem("tokenExpiration");
    if (expiration) {
      const timeout = parseInt(expiration, 10) - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
        }, timeout);
        return () => clearTimeout(timer);
      } else {
        logout();
        navigate("/login");
      }
    }

    // ✅ Request interceptor: dynamically attach token
    const requestInterceptor = ApiService.interceptors.request.use(
      (config) => {
        // read token fresh every request
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken") ||
          null;

        if (token && checkTokenExpiration()) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ Response interceptor: handle 401
    const responseInterceptor = ApiService.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error(
            "Your session is invalid or expired. Please log in again.",
            { position: "top-right", autoClose: 3000 }
          );
          logout();
          navigate("/login");
        }
        return Promise.reject(error);
      }
    );

    // Cleanup on unmount
    return () => {
      ApiService.interceptors.request.eject(requestInterceptor);
      ApiService.interceptors.response.eject(responseInterceptor);
    };
  }, [logout, navigate]);

  return ApiService;
};
