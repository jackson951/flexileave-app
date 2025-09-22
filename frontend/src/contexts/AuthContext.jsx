// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { ApiService } from "../api/web-api-service";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const safeParseUser = (value) => {
    try {
      if (!value || value === "undefined" || value === "null") return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
  const [user, setUser] = useState(safeParseUser(localStorage.getItem("user")));
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // -------------------- INITIAL LOAD --------------------
  useEffect(() => {
    if (authToken) setIsLoggedIn(true);
    setLoading(false);
  }, [authToken]);

  // -------------------- LOGIN --------------------
  const login = async ({ token, userData, rememberMe = false }) => {
    setAuthToken(token);
    setUser(userData);
    setIsLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData)); // keep user always
    }
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    setLogoutLoading(true);

    try {
      // Call backend logout (clears refresh token + cookie)
      await ApiService.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    } finally {
      setAuthToken(null);
      setUser(null);
      setIsLoggedIn(false);

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");

      setLogoutLoading(false);
      navigate("/login");
    }
  };

  // -------------------- UPDATE PROFILE --------------------
  const updateUserProfile = async (id, updatedData) => {
    if (!authToken) throw new Error("No auth token found");

    const response = await ApiService.put(`/users/${id}`, updatedData);
    const updatedUser = response.data;

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  };

  // -------------------- PROVIDER VALUE --------------------
  const value = {
    isLoggedIn,
    authToken,
    user,
    loading,
    logoutLoading,
    login,
    logout,
    updateUserProfile,
    setAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
