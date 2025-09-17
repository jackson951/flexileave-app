import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ApiService } from "../api/web-api-service";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const safeParseUser = (value) => {
    try {
      if (!value || value === "undefined" || value === "null") return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(safeParseUser(localStorage.getItem("user")));
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage/sessionStorage on mount
  useEffect(() => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const storedUser = safeParseUser(localStorage.getItem("user"));

    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }

    if (storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  // Login handler
  const login = async ({ token, userData, rememberMe = false }) => {
    setAuthToken(token);
    setUser(userData);
    setIsLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("authToken", token);
      // still store user in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Logout handler
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);

    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
  };

  // ✅ Update user profile
  const updateUserProfile = async (id, updatedData) => {
    if (!authToken) throw new Error("No auth token found");

    const response = await ApiService.put(`/users/${id}`, updatedData);

    const updatedUser = response.data;

    // update state + storage so UI reflects immediately
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  };

  const value = {
    isLoggedIn,
    authToken,
    user,
    loading,
    login,
    logout,
    updateUserProfile, // ✅ exposed here
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
