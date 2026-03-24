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

// ⭐ localStorage key — holds "1" when a session exists, absent otherwise.
// Unlike the cookie approach, this always lives on the frontend domain
// so it's readable regardless of where the API is hosted.
const SESSION_HINT_KEY = "auth_session";

const hasSessionHint = () => {
  return localStorage.getItem(SESSION_HINT_KEY) === "1";
};

const setSessionHint = () => {
  localStorage.setItem(SESSION_HINT_KEY, "1");
};

const clearSessionHint = () => {
  localStorage.removeItem(SESSION_HINT_KEY);
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
      // ⭐ No hint = definitely not logged in, skip the network call
      if (!hasSessionHint()) {
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await ApiService.get("/auth/verify", {
          withCredentials: true,
        });

        if (response.data.valid) {
          setIsLoggedIn(true);
          setUser(response.data.user);
        } else {
          // Backend invalidated the session (e.g. token tampered)
          clearSessionHint();
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        // 401/403 means the httpOnly accessToken is missing or expired.
        // Clear the stale hint so we don't loop on next refresh.
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          clearSessionHint();
        }
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // -------------------- LOGIN --------------------
  const login = async ({ userData }) => {
    // ⭐ Backend has already set the httpOnly cookies — we just stamp
    // the localStorage hint so the next page load knows to call /verify
    setSessionHint();
    setUser(userData);
    setIsLoggedIn(true);
  };

  // -------------------- LOGOUT --------------------
  const logout = async () => {
    setLogoutLoading(true);

    try {
      // Backend clears httpOnly cookies
      await ApiService.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    } finally {
      // ⭐ Always clear the hint even if the backend call fails,
      // otherwise the user stays "stuck" calling /verify forever
      clearSessionHint();
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
