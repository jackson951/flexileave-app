// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import LeaveApprovals from "../pages/administrator/LeaveApproval";

// Create context
const AuthContext = createContext();

// Custom hook for easier access
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState({
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@digititan.com",
    password: "password123",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    role: "admin",
    department: "Marketing",
    position: "Marketing Manager",
    leaveBalance: 22,
    joinDate: "2021-08-10",
  });
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true); // Loading while checking local storage / session

  // On mount, check localStorage for token/session
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = user;

    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }

    if (userData) {
      setUser(userData);
    }

    setLoading(false);
  }, []);

  // Login function
  const login = ({ token, userData, rememberMe = false }) => {
    setAuthToken(token);
    setUser(userData);
    setIsLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  // Logout function
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
  };

  // Context value
  const value = {
    isLoggedIn,
    user,
    authToken,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
