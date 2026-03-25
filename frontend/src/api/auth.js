// src/services/auth.js
import { jwtDecode } from "jwt-decode";
import { ApiService } from "./web-api-service";

/**
 * Check if stored JWT is still valid (not expired).
 * Returns true if valid, false if expired or missing.
 */
export const checkTokenExpiration = () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // seconds

    return decoded.exp && decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * Remove token + clear user data.
 */
export const logoutUser = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("tokenExpiration"); // if you store it separately
};

export const authApi = {
  login: (credentials) => ApiService.post("/auth/login", credentials),
  register: (userData) => ApiService.post("/auth/register", userData),
  registerTenant: (tenantData) => ApiService.post("/tenants/register", tenantData),
  logout: () => ApiService.post("/auth/logout"),
  refreshToken: () => ApiService.post("/auth/refresh"),
  verify: () => ApiService.get("/auth/verify"),
  forgotPassword: (email) => ApiService.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    ApiService.post("/auth/reset-password", { token, password }),
};
