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

export const useApiInterceptors = () => {
  const { logout, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Request interceptor — attach access token
    const requestInterceptor = ApiService.interceptors.request.use(
      (config) => {
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ Response interceptor — handle 401 and refresh token
    const responseInterceptor = ApiService.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry // avoid infinite loops
        ) {
          originalRequest._retry = true;
          try {
            // Attempt refresh
            const { data } = await axios.post(
              `${BASE_URL}auth/refresh`,
              {},
              { withCredentials: true }
            );

            const newAccessToken = data.token;

            // Save to storage
            localStorage.setItem("authToken", newAccessToken);

            // Update headers for retried request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // ✅ Re-dispatch request with new token
            return ApiService(originalRequest);
          } catch (refreshErr) {
            // Refresh failed → force logout
            toast.error("Session expired. Please log in again.", {
              position: "top-right",
              autoClose: 3000,
            });
            logout();
            navigate("/login");
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      ApiService.interceptors.request.eject(requestInterceptor);
      ApiService.interceptors.response.eject(responseInterceptor);
    };
  }, [logout, navigate, login]);

  return ApiService;
};
