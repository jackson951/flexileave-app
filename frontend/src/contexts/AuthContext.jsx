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

const SESSION_HINT_KEY = "auth_session";
const TENANT_SLUG_KEY = "flexileave_tenantSlug";

const hasSessionHint = () => localStorage.getItem(SESSION_HINT_KEY) === "1";
const setSessionHint = () => localStorage.setItem(SESSION_HINT_KEY, "1");
const clearSessionHint = () => localStorage.removeItem(SESSION_HINT_KEY);

const getStoredTenantSlug = () => localStorage.getItem(TENANT_SLUG_KEY) || "";
const persistTenantSlug = (slug) => {
  if (slug) {
    localStorage.setItem(TENANT_SLUG_KEY, slug);
  } else {
    localStorage.removeItem(TENANT_SLUG_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [tenantSlug, setTenantSlugState] = useState(getStoredTenantSlug());
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
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
          if (response.data.user?.tenant?.slug) {
            setTenantSlugState(response.data.user.tenant.slug);
            persistTenantSlug(response.data.user.tenant.slug);
          }
        } else {
          clearSessionHint();
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
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

  const handleAuthSuccess = (userData, slug) => {
    setUser(userData);
    setIsLoggedIn(true);
    setSessionHint();
    const persistedSlug =
      slug || userData?.tenant?.slug || getStoredTenantSlug() || "";
    setTenantSlugState(persistedSlug);
    persistTenantSlug(persistedSlug);
  };

  const login = async ({ email, password, tenantSlug: slug }) => {
    const response = await ApiService.post(
      "/auth/login",
      { email, password, tenantSlug: slug },
      { withCredentials: true }
    );
    handleAuthSuccess(response.data.user, slug);
    return response.data.user;
  };

  const registerTenant = async (payload) => {
    const response = await ApiService.post("/tenants/register", payload, {
      withCredentials: true,
    });
    const slugFromResponse = response.data.user?.tenant?.slug;
    handleAuthSuccess(response.data.user, slugFromResponse || payload.tenantSlug);
    return response.data;
  };

  const acceptInvite = async (payload) => {
    const response = await ApiService.post("/auth/accept-invite", payload, {
      withCredentials: true,
    });
    const slugFromResponse = response.data.user?.tenant?.slug;
    handleAuthSuccess(response.data.user, slugFromResponse);
    return response.data;
  };

  const logout = async () => {
    setLogoutLoading(true);

    try {
      await ApiService.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout request failed:", err.message);
    } finally {
      clearSessionHint();
      setUser(null);
      setIsLoggedIn(false);
      setLogoutLoading(false);
      setTenantSlugState("");
      persistTenantSlug("");
      navigate("/login");
    }
  };

  const updateUserProfile = async (id, updatedData) => {
    const response = await ApiService.put(`/users/${id}`, updatedData, {
      withCredentials: true,
    });
    const updatedUser = response.data;
    setUser(updatedUser);
    return updatedUser;
  };

  const value = {
    isLoggedIn,
    user,
    tenantSlug,
    loading,
    logoutLoading,
    login,
    logout,
    registerTenant,
    acceptInvite,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
