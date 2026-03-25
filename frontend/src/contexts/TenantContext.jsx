import React, { createContext, useContext, useState, useEffect } from "react";
import { ApiService } from "../api/web-api-service";

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    try {
      const response = await ApiService.get("/tenants/me", {
        withCredentials: true,
      });
      setTenant(response.data.tenant);
      console.log("Fetched tenant:", response.data.tenant);
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const updateTenant = (updatedTenant) => {
    setTenant(updatedTenant);
  };

  const value = {
    tenant,
    loading,
    fetchTenant,
    updateTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {!loading && children}
    </TenantContext.Provider>
  );
};