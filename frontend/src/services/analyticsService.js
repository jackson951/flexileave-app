import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Create axios instance for analytics
const analyticsApi = axios.create({
  baseURL: `${API_BASE_URL}/analytics`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to handle auth
analyticsApi.interceptors.request.use(
  (config) => {
    // Cookies are automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
analyticsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Analytics API error:", error);
    return Promise.reject(error);
  }
);

// Analytics API methods
export const analyticsService = {
  // Leave Overview
  async getLeaveOverview(period = "month") {
    try {
      const response = await analyticsApi.get("/leave-overview", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching leave overview:", error);
      throw error;
    }
  },

  // Leave Trends
  async getLeaveTrends(period = "month", interval = "week") {
    try {
      const response = await analyticsApi.get("/leave-trends", {
        params: { period, interval },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching leave trends:", error);
      throw error;
    }
  },

  // User/Team Stats
  async getUserStats() {
    try {
      const response = await analyticsApi.get("/user-stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  // Notifications
  async getNotifications() {
    try {
      const response = await analyticsApi.get("/notifications");
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Dashboard Summary (all data at once)
  async getDashboardSummary(period = "month") {
    try {
      const response = await analyticsApi.get("/dashboard-summary", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      throw error;
    }
  },
};

export default analyticsService;