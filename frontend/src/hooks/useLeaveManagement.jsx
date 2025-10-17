// src/hooks/useLeaveManagement.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiService } from "../api/web-api-service";

export const useLeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
    searchTerm: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userBalances, setUserBalances] = useState({
    AnnualLeave: 0,
    SickLeave: 0,
    FamilyResponsibility: 0,
    UnpaidLeave: 0,
    Other: 0,
  });

  // Map display names to backend values
  const leaveTypeMapping = {
    "Annual Leave": "AnnualLeave",
    "Sick Leave": "SickLeave",
    "Family Responsibility": "FamilyResponsibility",
    "Unpaid Leave": "UnpaidLeave",
    Other: "Other",
  };

  // Reverse mapping for display
  const reverseLeaveTypeMapping = {
    AnnualLeave: "Annual Leave",
    SickLeave: "Sick Leave",
    FamilyResponsibility: "Family Responsibility",
    UnpaidLeave: "Unpaid Leave",
    Other: "Other",
  };

  // Fetch user's leave history
  const fetchLeaves = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get("/leaves/my");

      // Process leaves to include display names and ensure actionedByUser
      const processedLeaves = response.data.map((leave) => ({
        ...leave,
        leaveType: reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
        actionedByUser: leave.actionedByUser || null,
      }));

      setLeaves(processedLeaves);
      setFilteredLeaves(processedLeaves);

      // Set user balances from auth context
      if (user?.leaveBalances) {
        setUserBalances(user.leaveBalances);
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave requests"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all leaves (for managers/admins)
  const fetchAllLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.get("/leaves");

      // Process leaves to include display names and ensure actionedByUser
      const processedLeaves = response.data.map((leave) => ({
        ...leave,
        leaveType: reverseLeaveTypeMapping[leave.leaveType] || leave.leaveType,
        actionedByUser: leave.actionedByUser || null,
      }));

      setLeaves(processedLeaves);
      setFilteredLeaves(processedLeaves);
    } catch (err) {
      console.error("Error fetching all leaves:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch leave requests"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new leave request
  const createLeave = async (leaveData) => {
    try {
      const response = await ApiService.post("/leaves", leaveData);
      await fetchLeaves(); // Refresh the list
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error creating leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to create leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Update a leave request
  const updateLeave = async (leaveId, updateData) => {
    try {
      const response = await ApiService.put(`/leaves/${leaveId}`, updateData);
      await fetchLeaves(); // Refresh the list
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error updating leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Delete a leave request
  const deleteLeave = async (leaveId) => {
    try {
      await ApiService.delete(`/leaves/${leaveId}`);
      await fetchLeaves(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error("Error deleting leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to delete leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Cancel a leave request
  const cancelLeave = async (leaveId) => {
    try {
      await ApiService.put(`/leaves/${leaveId}/cancel`);
      await fetchLeaves(); // Refresh the list
      return { success: true };
    } catch (err) {
      console.error("Error cancelling leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to cancel leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Approve a leave request (for managers/admins)
  const approveLeave = async (leaveId, approvalData = {}) => {
    try {
      const response = await ApiService.put(
        `/leaves/${leaveId}/approve`,
        approvalData
      );
      await fetchAllLeaves(); // Refresh all leaves for admin view
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error approving leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to approve leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Reject a leave request (for managers/admins)
  const rejectLeave = async (leaveId, rejectionData) => {
    try {
      const response = await ApiService.put(
        `/leaves/${leaveId}/reject`,
        rejectionData
      );
      await fetchAllLeaves(); // Refresh all leaves for admin view
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error rejecting leave:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to reject leave request";
      return { success: false, error: errorMessage };
    }
  };

  // Upload files for leave request
  const uploadFiles = async (files) => {
    try {
      const uploadFormData = new FormData();
      files.forEach((file) => {
        uploadFormData.append("files", file);
      });

      const response = await ApiService.post("/leaves/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error uploading files:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to upload files";
      return { success: false, error: errorMessage };
    }
  };

  // Delete a file
  const deleteFile = async (fileId) => {
    try {
      await ApiService.delete(`/leaves/file/${fileId}`);
      return { success: true };
    } catch (err) {
      console.error("Error deleting file:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to delete file";
      return { success: false, error: errorMessage };
    }
  };

  // Get leave balance for a specific type
  const getLeaveBalance = (leaveTypeDisplayName) => {
    if (!userBalances) return 0;
    const backendType = leaveTypeMapping[leaveTypeDisplayName];
    return userBalances[backendType] || 0;
  };

  // Calculate days between dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset time part to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  // Check if sufficient leave balance exists
  const hasSufficientLeaveBalance = (leaveType, requestedDays) => {
    if (!leaveType || leaveType === "Unpaid Leave") return true;
    const availableBalance = getLeaveBalance(leaveType);
    return requestedDays <= availableBalance;
  };

  // Filter and search logic
  useEffect(() => {
    let result = [...leaves];

    // Apply search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (leave) =>
          (leave.leaveType && leave.leaveType.toLowerCase().includes(term)) ||
          (leave.reason && leave.reason.toLowerCase().includes(term)) ||
          (leave.user?.name && leave.user.name.toLowerCase().includes(term)) ||
          (leave.actionedByUser?.name &&
            leave.actionedByUser.name.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter((leave) => leave.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== "all") {
      result = result.filter(
        (leave) =>
          leave.leaveType === filters.type ||
          leave.leaveType === leaveTypeMapping[filters.type]
      );
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(
        (leave) => new Date(leave.startDate) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      result = result.filter(
        (leave) => new Date(leave.endDate) <= new Date(filters.dateTo)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested properties
        if (sortConfig.key.includes(".")) {
          const keys = sortConfig.key.split(".");
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }

        // Handle date sorting
        if (sortConfig.key.includes("Date")) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredLeaves(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [leaves, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "all",
      type: "all",
      dateFrom: "",
      dateTo: "",
      searchTerm: "",
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color for badges
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if leave can be edited
  const canEditLeave = (leave) => {
    if (leave.status !== "pending") return false;

    const endDate = new Date(leave.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return today <= endDate;
  };

  // Check for overlapping leave requests
  const hasOverlappingLeave = (startDate, endDate, excludeLeaveId = null) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return leaves.some(
      (leave) =>
        leave.id !== excludeLeaveId &&
        leave.status !== "rejected" &&
        leave.status !== "cancelled" &&
        new Date(leave.startDate) <= end &&
        new Date(leave.endDate) >= start
    );
  };

  // Get statistics
  const getStatistics = () => {
    const stats = {
      total: leaves.length,
      pending: leaves.filter((l) => l.status === "pending").length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
      cancelled: leaves.filter((l) => l.status === "cancelled").length,
    };

    return stats;
  };

  // Get leave type statistics
  const getLeaveTypeStatistics = () => {
    const typeStats = {};
    leaves.forEach((leave) => {
      if (!typeStats[leave.leaveType]) {
        typeStats[leave.leaveType] = {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          cancelled: 0,
        };
      }
      typeStats[leave.leaveType].total++;
      typeStats[leave.leaveType][leave.status]++;
    });

    return typeStats;
  };

  // Initial fetch
  useEffect(() => {
    if (user?.role === "admin") {
      fetchAllLeaves();
    } else {
      fetchLeaves();
    }
  }, [user, fetchLeaves, fetchAllLeaves]);

  return {
    // State
    leaves,
    filteredLeaves,
    paginatedLeaves,
    loading,
    error,
    filters,
    sortConfig,
    currentPage,
    totalPages,
    itemsPerPage,
    userBalances,

    // Actions
    fetchLeaves,
    fetchAllLeaves,
    createLeave,
    updateLeave,
    deleteLeave,
    cancelLeave,
    approveLeave,
    rejectLeave,
    uploadFiles,
    deleteFile,
    updateFilters,
    clearFilters,
    handleSort,
    setCurrentPage,

    // Utilities
    getLeaveBalance,
    calculateDays,
    hasSufficientLeaveBalance,
    formatDate,
    formatDateTime,
    getStatusColor,
    canEditLeave,
    hasOverlappingLeave,
    getStatistics,
    getLeaveTypeStatistics,

    // Mappings
    leaveTypeMapping,
    reverseLeaveTypeMapping,

    // Constants
    leaveTypes: Object.keys(leaveTypeMapping),
  };
};

export default useLeaveManagement;
