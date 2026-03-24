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

// ⭐ Reads the non-httpOnly cookie the backend sets on login/refresh.
// Returns true only if "auth_session=1" is present in document.cookie.
// Since this cookie has no sensitive data, reading it is perfectly safe.
const hasSessionHint = () => {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("auth_session="));
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // -------------------- INITIAL AUTH CHECK --------------------
  useEffect(() => {
    const checkAuthStatus = async () => {
      // ⭐ Gate: if the hint cookie is absent, we know for certain no
      // httpOnly accessToken was set by our backend — skip the network
      // call entirely and resolve immediately as logged-out.
      if (!hasSessionHint()) {
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Hint exists → accessToken *probably* exists → confirm with backend
      try {
        const response = await ApiService.get("/auth/verify", {
          withCredentials: true,
        });

        if (response.data.valid) {
          setIsLoggedIn(true);
          setUser(response.data.user);
        } else {
          // Backend said token is invalid (e.g. tampered) — clear state
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        // 401 = accessToken missing/expired, 403 = invalid token
        // In both cases, treat the user as logged out
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
  // userData comes from the POST /auth/login response.
  // The hint cookie is already set by the backend at this point.
  const login = async ({ userData }) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    setLogoutLoading(true);

    try {
      // Backend clears accessToken, refreshToken, AND auth_session cookies
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