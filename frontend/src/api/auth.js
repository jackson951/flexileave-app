// src/services/auth.js
import { jwtDecode } from "jwt-decode";

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
