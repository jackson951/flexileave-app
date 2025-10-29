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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // -------------------- INITIAL AUTH CHECK --------------------
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await ApiService.get("/auth/verify", {
          withCredentials: true,
        });

        if (response.data.valid) {
          setIsLoggedIn(true);
          // Update user data from verify endpoint
          const userData = response.data.user;
          setUser(userData);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // -------------------- LOGIN --------------------
  const login = async ({ userData, rememberMe = false }) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    setLogoutLoading(true);

    try {
      // Call backend logout (clears cookies + refresh token)
      await ApiService.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      setLogoutLoading(false);
      navigate("/login");
    }
  };

  // -------------------- UPDATE PROFILE --------------------
  const updateUserProfile = async (id, updatedData) => {
    const response = await ApiService.put(`/users/${id}`, updatedData, {
      withCredentials: true,
    });
    const updatedUser = response.data;

    setUser(updatedUser);

    return updatedUser;
  };

  // -------------------- PROVIDER VALUE --------------------
  const value = {
    isLoggedIn,
    user,
    loading,
    logoutLoading,
    login,
    logout,
    updateUserProfile,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
