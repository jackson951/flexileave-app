import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

// Express API base URL - remove trailing slash to prevent double slashes
const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

// Create Axios instance
export const ApiService = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // allows cookies (both access and refresh tokens)
});

// Custom hook to set up interceptors
export const useApiInterceptors = () => {
  const { logout, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ REQUEST INTERCEPTOR — No need to manually attach token, it's in cookies
    const requestInterceptor = ApiService.interceptors.request.use(
      (config) => {
        // Cookies are automatically sent with withCredentials: true
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
          !originalRequest.url.includes("/auth/refresh") &&
          !originalRequest.url.includes("/auth/login") &&
          !originalRequest.url.includes("/auth/logout")
        ) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh the tokens
            const refreshResponse = await ApiService.post(
              "/auth/refresh",
              {},
              {
                withCredentials: true,
              }
            );

            if (refreshResponse.status === 200) {
              // Tokens refreshed successfully, retry original request
              return ApiService(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);

            // Clear local state and force logout
            logout();

            // Notify user
            toast.error("Session expired. Please log in again.", {
              position: "top-right",
              autoClose: 3000,
              theme: "colored",
            });

            // Redirect to login
            setTimeout(() => {
              navigate("/login", { replace: true });
            }, 100);

            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        if (error.response?.status === 403) {
          toast.error("Access forbidden. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
          logout();
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 100);
        }

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

// Optional: Export a logout utility
export const logoutUser = async () => {
  try {
    await ApiService.post("/auth/logout", {}, { withCredentials: true });
  } catch (err) {
    console.warn("Logout API call failed, proceeding with local logout");
  }
};

// Re-export for direct use
export default ApiService;
