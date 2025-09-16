import React, { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PrinterIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  DocumentTextIcon,
  EyeIcon,
  ChartBarIcon,
  TableCellsIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, subDays, parseISO } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const LeaveReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
  const [reportType, setReportType] = useState("detailed"); // detailed, summary, balances, department

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf"); // pdf, csv, excel
  const [exportColumns, setExportColumns] = useState([
    "id",
    "employeeName",
    "department",
    "type",
    "startDate",
    "endDate",
    "days",
    "status",
    "reason",
  ]);

  // View Detail Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    employee: "all",
  });

  // Fetch leave reports and users from API
  useEffect(() => {
    const fetchLeaveData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        // Fetch leave reports
        const leavesResponse = await fetch("http://localhost:5000/api/leaves", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!leavesResponse.ok) {
          const errorData = await leavesResponse.json();
          throw new Error(errorData.message || "Failed to fetch leave reports");
        }

        const leavesData = await leavesResponse.json();

        // Fetch users for leave balance information
        const usersResponse = await fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!usersResponse.ok) {
          const errorData = await usersResponse.json();
          throw new Error(errorData.message || "Failed to fetch users");
        }

        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Map backend data to match frontend expectations
        const mappedReports = leavesData.map((report) => ({
          id: report.id,
          employeeName: report.user?.name || "Unknown",
          employeeId: report.userId,
          department: report.user?.department || "Unknown",
          type: report.leaveType,
          startDate: report.startDate,
          endDate: report.endDate,
          days: report.days,
          status: report.status.toLowerCase(),
          reason: report.reason || "",
          submittedAt: report.submittedAt,
          approvedBy: report.approvedBy || "System",
          notes: report.notes || "",
        }));

        setReports(mappedReports);
        setFilteredReports(mappedReports);
      } catch (err) {
        console.error("Error fetching leave reports:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveData();
  }, []);

  // Get user by ID
  const getUserById = (userId) => {
    return users.find((user) => user.id === userId) || null;
  };

  // Calculate leave balances for a user
  const calculateUserLeaveBalances = (userId) => {
    const user = getUserById(userId);
    if (!user || !user.leaveBalances) return null;

    // Get all leave requests for this user
    const userLeaves = reports.filter((report) => report.employeeId === userId);

    // Calculate used days by leave type
    const usedDays = {};
    userLeaves.forEach((leave) => {
      if (leave.status === "approved") {
        usedDays[leave.type] = (usedDays[leave.type] || 0) + leave.days;
      }
    });

    // Calculate remaining balances
    const balances = {};
    Object.keys(user.leaveBalances).forEach((type) => {
      const originalBalance = user.leaveBalances[type];
      const used = usedDays[type] || 0;
      balances[type] = {
        original: originalBalance,
        used: used,
        remaining: originalBalance - used,
        percentageUsed:
          originalBalance > 0 ? Math.round((used / originalBalance) * 100) : 0,
      };
    });

    return balances;
  };

  // Generate summary report data
  const generateSummaryReport = () => {
    const summary = {};

    // Group by employee
    reports.forEach((report) => {
      if (!summary[report.employeeId]) {
        summary[report.employeeId] = {
          employeeName: report.employeeName,
          employeeId: report.employeeId,
          department: report.department,
          totalRequests: 0,
          approvedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          totalDays: 0,
          approvedDays: 0,
          leaveTypes: {},
        };
      }

      const employee = summary[report.employeeId];
      employee.totalRequests++;
      employee.totalDays += report.days;

      if (report.status === "approved") {
        employee.approvedRequests++;
        employee.approvedDays += report.days;
      } else if (report.status === "pending") {
        employee.pendingRequests++;
      } else if (report.status === "rejected") {
        employee.rejectedRequests++;
      }

      // Track by leave type
      if (!employee.leaveTypes[report.type]) {
        employee.leaveTypes[report.type] = {
          requests: 0,
          days: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }

      employee.leaveTypes[report.type].requests++;
      employee.leaveTypes[report.type].days += report.days;

      if (report.status === "approved") {
        employee.leaveTypes[report.type].approved++;
      } else if (report.status === "pending") {
        employee.leaveTypes[report.type].pending++;
      } else if (report.status === "rejected") {
        employee.leaveTypes[report.type].rejected++;
      }
    });

    return Object.values(summary);
  };

  // Generate leave balances report
  const generateBalancesReport = () => {
    return users.map((user) => {
      const balances = calculateUserLeaveBalances(user.id);
      const totalOriginal = balances
        ? Object.values(balances).reduce((sum, b) => sum + b.original, 0)
        : 0;
      const totalUsed = balances
        ? Object.values(balances).reduce((sum, b) => sum + b.used, 0)
        : 0;
      const totalRemaining = balances
        ? Object.values(balances).reduce((sum, b) => sum + b.remaining, 0)
        : 0;

      return {
        employeeName: user.name,
        employeeId: user.id,
        department: user.department,
        position: user.position,
        totalOriginal,
        totalUsed,
        totalRemaining,
        percentageUsed:
          totalOriginal > 0 ? Math.round((totalUsed / totalOriginal) * 100) : 0,
        leaveBalances: balances,
      };
    });
  };

  // Generate department summary report
  const generateDepartmentReport = () => {
    const departments = {};

    // Group by department
    reports.forEach((report) => {
      if (!departments[report.department]) {
        departments[report.department] = {
          department: report.department,
          totalEmployees: 0,
          totalRequests: 0,
          approvedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          totalDays: 0,
          approvedDays: 0,
          leaveTypes: {},
        };
      }

      const dept = departments[report.department];
      dept.totalRequests++;
      dept.totalDays += report.days;

      if (report.status === "approved") {
        dept.approvedRequests++;
        dept.approvedDays += report.days;
      } else if (report.status === "pending") {
        dept.pendingRequests++;
      } else if (report.status === "rejected") {
        dept.rejectedRequests++;
      }

      // Track by leave type
      if (!dept.leaveTypes[report.type]) {
        dept.leaveTypes[report.type] = {
          requests: 0,
          days: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }

      dept.leaveTypes[report.type].requests++;
      dept.leaveTypes[report.type].days += report.days;

      if (report.status === "approved") {
        dept.leaveTypes[report.type].approved++;
      } else if (report.status === "pending") {
        dept.leaveTypes[report.type].pending++;
      } else if (report.status === "rejected") {
        dept.leaveTypes[report.type].rejected++;
      }
    });

    // Count employees per department
    users.forEach((user) => {
      if (departments[user.department]) {
        departments[user.department].totalEmployees++;
      } else {
        departments[user.department] = {
          department: user.department,
          totalEmployees: 1,
          totalRequests: 0,
          approvedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0,
          totalDays: 0,
          approvedDays: 0,
          leaveTypes: {},
        };
      }
    });

    return Object.values(departments);
  };

  // Filter and sort reports based on report type
  useEffect(() => {
    let result = [];

    if (reportType === "detailed") {
      result = [...reports];
    } else if (reportType === "summary") {
      result = generateSummaryReport();
    } else if (reportType === "balances") {
      result = generateBalancesReport();
    } else if (reportType === "department") {
      result = generateDepartmentReport();
    }

    // Apply filters based on report type
    if (reportType === "detailed") {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (report) =>
            report.employeeName.toLowerCase().includes(term) ||
            report?.id?.toString().toLowerCase().includes(term) || // Convert id to string
            report.reason.toLowerCase().includes(term)
        );
      }
      // Apply filters
      if (filters.type !== "all") {
        result = result.filter((report) => report.type === filters.type);
      }
      if (filters.department !== "all") {
        result = result.filter(
          (report) => report.department === filters.department
        );
      }
      if (filters.status !== "all") {
        result = result.filter((report) => report.status === filters.status);
      }
      if (filters.employee !== "all") {
        result = result.filter(
          (report) => report.employeeId === parseInt(filters.employee)
        );
      }
      if (filters.dateFrom) {
        result = result.filter(
          (report) => new Date(report.startDate) >= new Date(filters.dateFrom)
        );
      }
      if (filters.dateTo) {
        result = result.filter(
          (report) => new Date(report.endDate) <= new Date(filters.dateTo)
        );
      }

      // Apply tab filtering
      if (activeTab === "pending") {
        result = result.filter((report) => report.status === "pending");
      } else if (activeTab === "approved") {
        result = result.filter((report) => report.status === "approved");
      } else if (activeTab === "rejected") {
        result = result.filter((report) => report.status === "rejected");
      }
    } else if (reportType === "summary" || reportType === "balances") {
      // Apply search and department filters for summary and balances
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(
          (item) =>
            item.employeeName.toLowerCase().includes(term) ||
            (item.employeeId && item.employeeId.toString().includes(term))
        );
      }

      if (filters.department !== "all") {
        result = result.filter(
          (item) => item.department === filters.department
        );
      }

      if (filters.employee !== "all") {
        result = result.filter(
          (item) => item.employeeId === parseInt(filters.employee)
        );
      }
    } else if (reportType === "department") {
      // Apply search filter for department report
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter((item) =>
          item.department.toLowerCase().includes(term)
        );
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested objects for summary report
        if (reportType === "summary" && sortConfig.key.includes(".")) {
          const keys = sortConfig.key.split(".");
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
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

    setFilteredReports(result);
    setCurrentPage(1);
  }, [reports, users, searchTerm, filters, activeTab, sortConfig, reportType]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
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

  // Get sorted icon based on current sort config
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400 ml-1" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 text-indigo-600 ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-indigo-600 ml-1" />
    );
  };

  // Handle view details
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedReport(null);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title based on report type
    let title = "Leave Reports";
    if (reportType === "summary") title = "Leave Summary Report";
    else if (reportType === "balances") title = "Leave Balances Report";
    else if (reportType === "department") title = "Department Leave Report";

    // Title
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy")}`, 105, 30, {
      align: "center",
    });

    // Prepare table data based on report type
    let headers = [];
    let columnKeys = [];
    let tableData = [];

    if (reportType === "detailed") {
      headers = [
        "ID",
        "Employee",
        "Department",
        "Type",
        "Start",
        "End",
        "Days",
        "Status",
        "Reason",
      ];
      columnKeys = [
        "id",
        "employeeName",
        "department",
        "type",
        "startDate",
        "endDate",
        "days",
        "status",
        "reason",
      ];

      // Map headers and data based on selected columns
      const visibleHeaders = [];
      const visibleColumnKeys = [];
      exportColumns.forEach((key) => {
        const index = columnKeys.indexOf(key);
        if (index !== -1) {
          visibleHeaders.push(headers[index]);
          visibleColumnKeys.push(key);
        }
      });

      tableData = filteredReports.map((report) => {
        return visibleColumnKeys.map((key) => {
          if (key === "reason") {
            return report[key].substring(0, 30); // Truncate reason for readability
          }
          if (key === "status") {
            return report[key].charAt(0).toUpperCase() + report[key].slice(1);
          }
          if (key === "startDate" || key === "endDate") {
            return format(new Date(report[key]), "MMM d, yyyy");
          }
          return report[key];
        });
      });

      headers = visibleHeaders;
    } else if (reportType === "summary") {
      headers = [
        "Employee Name",
        "Department",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      tableData = filteredReports.map((report) => [
        report.employeeName,
        report.department,
        report.totalRequests,
        report.approvedRequests,
        report.pendingRequests,
        report.rejectedRequests,
        report.totalDays,
        report.approvedDays,
      ]);
    } else if (reportType === "balances") {
      headers = [
        "Employee Name",
        "Department",
        "Position",
        "Original Balance",
        "Used Days",
        "Remaining Balance",
        "Utilization %",
      ];

      tableData = filteredReports.map((report) => [
        report.employeeName,
        report.department,
        report.position,
        report.totalOriginal,
        report.totalUsed,
        report.totalRemaining,
        `${report.percentageUsed}%`,
      ]);
    } else if (reportType === "department") {
      headers = [
        "Department",
        "Employees",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      tableData = filteredReports.map((report) => [
        report.department,
        report.totalEmployees,
        report.totalRequests,
        report.approvedRequests,
        report.pendingRequests,
        report.rejectedRequests,
        report.totalDays,
        report.approvedDays,
      ]);
    }

    // Add table
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
      },
      columnStyles: headers.reduce((acc, header, idx) => {
        const widthMap = {
          ID: 15,
          Employee: 25,
          "Employee Name": 25,
          Department: 25,
          Position: 20,
          Type: 20,
          Start: 20,
          End: 20,
          Days: 15,
          Status: 20,
          Reason: 30,
          "Total Requests": 20,
          "Approved Requests": 20,
          "Pending Requests": 20,
          "Rejected Requests": 20,
          "Total Days": 20,
          "Approved Days": 20,
          "Original Balance": 25,
          "Used Days": 20,
          "Remaining Balance": 25,
          "Utilization %": 20,
          Employees: 20,
        };
        acc[idx] = { cellWidth: widthMap[header] || 20 };
        return acc;
      }, {}),
    });

    // Save PDF
    const filename = `${title.toLowerCase().replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyyMMdd"
    )}.pdf`;
    doc.save(filename);
  };

  // Export to CSV
  const exportToCSV = () => {
    let headers = [];
    let columnKeys = [];
    let data = [];

    if (reportType === "detailed") {
      headers = [
        "Leave ID",
        "Employee Name",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Number of Days",
        "Status",
        "Reason",
        "Submitted At",
        "Approved By",
        "Notes",
      ];
      columnKeys = [
        "id",
        "employeeName",
        "department",
        "type",
        "startDate",
        "endDate",
        "days",
        "status",
        "reason",
        "submittedAt",
        "approvedBy",
        "notes",
      ];

      // Map headers and data based on selected columns
      const visibleHeaders = [];
      const visibleColumnKeys = [];
      exportColumns.forEach((key) => {
        const index = columnKeys.indexOf(key);
        if (index !== -1) {
          visibleHeaders.push(headers[index]);
          visibleColumnKeys.push(key);
        }
      });

      data = filteredReports.map((report) => {
        return visibleColumnKeys.map((key) => {
          if (key === "status") {
            return report[key].charAt(0).toUpperCase() + report[key].slice(1);
          }
          if (key === "startDate" || key === "endDate") {
            return format(new Date(report[key]), "yyyy-MM-dd");
          }
          return report[key];
        });
      });

      headers = visibleHeaders;
    } else if (reportType === "summary") {
      headers = [
        "Employee Name",
        "Department",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      data = filteredReports.map((report) => [
        report.employeeName,
        report.department,
        report.totalRequests,
        report.approvedRequests,
        report.pendingRequests,
        report.rejectedRequests,
        report.totalDays,
        report.approvedDays,
      ]);
    } else if (reportType === "balances") {
      headers = [
        "Employee Name",
        "Department",
        "Position",
        "Original Balance",
        "Used Days",
        "Remaining Balance",
        "Utilization %",
      ];

      data = filteredReports.map((report) => [
        report.employeeName,
        report.department,
        report.position,
        report.totalOriginal,
        report.totalUsed,
        report.totalRemaining,
        `${report.percentageUsed}%`,
      ]);
    } else if (reportType === "department") {
      headers = [
        "Department",
        "Number of Employees",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      data = filteredReports.map((report) => [
        report.department,
        report.totalEmployees,
        report.totalRequests,
        report.approvedRequests,
        report.pendingRequests,
        report.rejectedRequests,
        report.totalDays,
        report.approvedDays,
      ]);
    }

    // Add leave type breakdown for summary report
    if (reportType === "summary") {
      // Add a separator row
      data.push([]);
      data.push(["Leave Type Breakdown", "", "", "", "", "", "", ""]);

      filteredReports.forEach((report) => {
        data.push([]);
        data.push([
          `Employee: ${report.employeeName}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        Object.entries(report.leaveTypes).forEach(([leaveType, stats]) => {
          data.push([
            leaveType,
            "Requests: " + stats.requests,
            "Days: " + stats.days,
            "Approved: " + stats.approved,
            "Pending: " + stats.pending,
            "Rejected: " + stats.rejected,
            "",
            "",
          ]);
        });
      });
    }

    // Add leave balances breakdown for balances report
    if (reportType === "balances") {
      // Add a separator row
      data.push([]);
      data.push(["Leave Type Breakdown", "", "", "", "", "", ""]);

      filteredReports.forEach((report) => {
        data.push([]);
        data.push([`Employee: ${report.employeeName}`, "", "", "", "", "", ""]);

        if (report.leaveBalances) {
          Object.entries(report.leaveBalances).forEach(
            ([leaveType, balance]) => {
              data.push([
                leaveType,
                "Original: " + balance.original,
                "Used: " + balance.used,
                "Remaining: " + balance.remaining,
                "Utilization: " + balance.percentageUsed + "%",
                "",
                "",
              ]);
            }
          );
        }
      });
    }

    const csvContent = Papa.unparse([headers, ...data], {
      quotes: true,
      delimiter: ",",
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    let filename = `leave_report_${format(new Date(), "yyyyMMdd")}.csv`;
    if (reportType === "summary")
      filename = `leave_summary_${format(new Date(), "yyyyMMdd")}.csv`;
    else if (reportType === "balances")
      filename = `leave_balances_${format(new Date(), "yyyyMMdd")}.csv`;
    else if (reportType === "department")
      filename = `department_leave_report_${format(
        new Date(),
        "yyyyMMdd"
      )}.csv`;

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const exportToExcel = () => {
    let headers = [];
    let columnKeys = [];
    let worksheetData = [];

    if (reportType === "detailed") {
      headers = [
        "Leave ID",
        "Employee Name",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Number of Days",
        "Status",
        "Reason",
        "Submitted At",
        "Approved By",
        "Notes",
      ];
      columnKeys = [
        "id",
        "employeeName",
        "department",
        "type",
        "startDate",
        "endDate",
        "days",
        "status",
        "reason",
        "submittedAt",
        "approvedBy",
        "notes",
      ];

      // Map headers and data based on selected columns
      const visibleHeaders = [];
      const visibleColumnKeys = [];
      exportColumns.forEach((key) => {
        const index = columnKeys.indexOf(key);
        if (index !== -1) {
          visibleHeaders.push(headers[index]);
          visibleColumnKeys.push(key);
        }
      });

      worksheetData = [visibleHeaders];
      filteredReports.forEach((report) => {
        const row = visibleColumnKeys.map((key) => {
          if (key === "status") {
            return report[key].charAt(0).toUpperCase() + report[key].slice(1);
          }
          if (key === "startDate" || key === "endDate") {
            return format(new Date(report[key]), "yyyy-MM-dd");
          }
          return report[key];
        });
        worksheetData.push(row);
      });
    } else if (reportType === "summary") {
      headers = [
        "Employee Name",
        "Department",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      worksheetData = [headers];
      filteredReports.forEach((report) => {
        worksheetData.push([
          report.employeeName,
          report.department,
          report.totalRequests,
          report.approvedRequests,
          report.pendingRequests,
          report.rejectedRequests,
          report.totalDays,
          report.approvedDays,
        ]);
      });

      // Add leave type breakdown
      worksheetData.push([]);
      worksheetData.push(["Leave Type Breakdown", "", "", "", "", "", "", ""]);

      filteredReports.forEach((report) => {
        worksheetData.push([]);
        worksheetData.push([
          `Employee: ${report.employeeName}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        Object.entries(report.leaveTypes).forEach(([leaveType, stats]) => {
          worksheetData.push([
            leaveType,
            "Requests: " + stats.requests,
            "Days: " + stats.days,
            "Approved: " + stats.approved,
            "Pending: " + stats.pending,
            "Rejected: " + stats.rejected,
            "",
            "",
          ]);
        });
      });
    } else if (reportType === "balances") {
      headers = [
        "Employee Name",
        "Department",
        "Position",
        "Original Balance",
        "Used Days",
        "Remaining Balance",
        "Utilization %",
      ];

      worksheetData = [headers];
      filteredReports.forEach((report) => {
        worksheetData.push([
          report.employeeName,
          report.department,
          report.position,
          report.totalOriginal,
          report.totalUsed,
          report.totalRemaining,
          `${report.percentageUsed}%`,
        ]);
      });

      // Add leave type breakdown
      worksheetData.push([]);
      worksheetData.push(["Leave Type Breakdown", "", "", "", "", "", ""]);

      filteredReports.forEach((report) => {
        worksheetData.push([]);
        worksheetData.push([
          `Employee: ${report.employeeName}`,
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        if (report.leaveBalances) {
          Object.entries(report.leaveBalances).forEach(
            ([leaveType, balance]) => {
              worksheetData.push([
                leaveType,
                "Original: " + balance.original,
                "Used: " + balance.used,
                "Remaining: " + balance.remaining,
                "Utilization: " + balance.percentageUsed + "%",
                "",
                "",
              ]);
            }
          );
        }
      });
    } else if (reportType === "department") {
      headers = [
        "Department",
        "Number of Employees",
        "Total Requests",
        "Approved Requests",
        "Pending Requests",
        "Rejected Requests",
        "Total Days",
        "Approved Days",
      ];

      worksheetData = [headers];
      filteredReports.forEach((report) => {
        worksheetData.push([
          report.department,
          report.totalEmployees,
          report.totalRequests,
          report.approvedRequests,
          report.pendingRequests,
          report.rejectedRequests,
          report.totalDays,
          report.approvedDays,
        ]);
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");

    // Convert to Excel file
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // Create download link
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    let filename = `leave_report_${format(new Date(), "yyyyMMdd")}.xlsx`;
    if (reportType === "summary")
      filename = `leave_summary_${format(new Date(), "yyyyMMdd")}.xlsx`;
    else if (reportType === "balances")
      filename = `leave_balances_${format(new Date(), "yyyyMMdd")}.xlsx`;
    else if (reportType === "department")
      filename = `department_leave_report_${format(
        new Date(),
        "yyyyMMdd"
      )}.xlsx`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique values for filters
  const uniqueDepartments = [...new Set(reports.map((r) => r.department))];
  const uniqueTypes = [...new Set(reports.map((r) => r.type))];
  const uniqueStatuses = [...new Set(reports.map((r) => r.status))];
  const uniqueEmployees = Array.from(
    new Map(
      reports.map((r) => [
        r.employeeId,
        { id: r.employeeId, name: r.employeeName },
      ])
    ).values()
  );

  const StatusBadge = ({ status }) => {
    if (!status) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
    }

    const colors = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  // Progress bar component for utilization
  const ProgressBar = ({ percentage, color = "bg-blue-500" }) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Advanced Leave Reports
          </h1>
          <p className="mt-2 text-gray-600">
            Generate and export comprehensive leave reports with advanced
            analytics
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType("detailed")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              reportType === "detailed"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <TableCellsIcon className="h-4 w-4 mr-2" />
            Detailed Report
          </button>
          <button
            onClick={() => setReportType("summary")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              reportType === "summary"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Summary Report
          </button>
          <button
            onClick={() => setReportType("balances")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              reportType === "balances"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <AcademicCapIcon className="h-4 w-4 mr-2" />
            Leave Balances
          </button>
          <button
            onClick={() => setReportType("department")}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              reportType === "department"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            Department Report
          </button>
        </div>
      </div>

      {/* Status Tabs (only for detailed report) */}
      {reportType === "detailed" && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {["all", "pending", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-2 py-0.5">
                  {
                    filteredReports.filter((r) =>
                      tab === "all" ? true : r.status === tab
                    ).length
                  }
                </span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={
                    reportType === "detailed"
                      ? "Search by employee, ID, or reason..."
                      : reportType === "department"
                      ? "Search by department..."
                      : "Search by employee name or ID..."
                  }
                />
              </div>
            </div>
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              {reportType === "detailed" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                      }
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Types</option>
                      {uniqueTypes.map((type) => (
                        <option key={`type-${type}`} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All Statuses</option>
                      {uniqueStatuses.map((status) => (
                        <option key={`status-${status}`} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) =>
                          setFilters({ ...filters, dateFrom: e.target.value })
                        }
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      />
                      <span className="flex items-center text-gray-500">
                        to
                      </span>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) =>
                          setFilters({ ...filters, dateTo: e.target.value })
                        }
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {uniqueDepartments.map((dept) => (
                    <option key={`dept-${dept}`} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {reportType !== "department" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={filters.employee}
                    onChange={(e) =>
                      setFilters({ ...filters, employee: e.target.value })
                    }
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Employees</option>
                    {uniqueEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {reportType === "detailed" && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      <span>Leave ID</span>
                      {getSortIcon("id")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("employeeName")}
                  >
                    <div className="flex items-center">
                      <span>Employee</span>
                      {getSortIcon("employeeName")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center">
                      <span>Department</span>
                      {getSortIcon("department")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      <span>Leave Type</span>
                      {getSortIcon("type")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("startDate")}
                  >
                    <div className="flex items-center">
                      <span>Dates</span>
                      {getSortIcon("startDate")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("days")}
                  >
                    <div className="flex items-center">
                      <span>Days</span>
                      {getSortIcon("days")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report, index) => (
                  <tr
                    key={`${report.id}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {report.startDate
                          ? format(new Date(report.startDate), "MMM d")
                          : "N/A"}{" "}
                        -{" "}
                        {report.endDate
                          ? format(new Date(report.endDate), "MMM d")
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.days} {report.days === 1 ? "day" : "days"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "summary" && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("employeeName")}
                  >
                    <div className="flex items-center">
                      <span>Employee</span>
                      {getSortIcon("employeeName")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center">
                      <span>Department</span>
                      {getSortIcon("department")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalRequests")}
                  >
                    <div className="flex items-center">
                      <span>Total Requests</span>
                      {getSortIcon("totalRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("approvedRequests")}
                  >
                    <div className="flex items-center">
                      <span>Approved</span>
                      {getSortIcon("approvedRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("pendingRequests")}
                  >
                    <div className="flex items-center">
                      <span>Pending</span>
                      {getSortIcon("pendingRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("rejectedRequests")}
                  >
                    <div className="flex items-center">
                      <span>Rejected</span>
                      {getSortIcon("rejectedRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalDays")}
                  >
                    <div className="flex items-center">
                      <span>Total Days</span>
                      {getSortIcon("totalDays")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("approvedDays")}
                  >
                    <div className="flex items-center">
                      <span>Approved Days</span>
                      {getSortIcon("approvedDays")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report, index) => (
                  <tr
                    key={`${report.userId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {report.approvedRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {report.pendingRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {report.rejectedRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {report.approvedDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "balances" && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("employeeName")}
                  >
                    <div className="flex items-center">
                      <span>Employee</span>
                      {getSortIcon("employeeName")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center">
                      <span>Department</span>
                      {getSortIcon("department")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("position")}
                  >
                    <div className="flex items-center">
                      <span>Position</span>
                      {getSortIcon("position")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalOriginal")}
                  >
                    <div className="flex items-center">
                      <span>Original Balance</span>
                      {getSortIcon("totalOriginal")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalUsed")}
                  >
                    <div className="flex items-center">
                      <span>Used Days</span>
                      {getSortIcon("totalUsed")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalRemaining")}
                  >
                    <div className="flex items-center">
                      <span>Remaining</span>
                      {getSortIcon("totalRemaining")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <span>Utilization</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report, index) => (
                  <tr
                    key={`${report.employeeId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalOriginal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {report.totalUsed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {report.totalRemaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 mr-2">
                          <ProgressBar
                            percentage={report.percentageUsed}
                            color={
                              report.percentageUsed > 80
                                ? "bg-red-500"
                                : report.percentageUsed > 50
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {report.percentageUsed}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "department" && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("department")}
                  >
                    <div className="flex items-center">
                      <span>Department</span>
                      {getSortIcon("department")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalEmployees")}
                  >
                    <div className="flex items-center">
                      <span>Employees</span>
                      {getSortIcon("totalEmployees")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalRequests")}
                  >
                    <div className="flex items-center">
                      <span>Total Requests</span>
                      {getSortIcon("totalRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("approvedRequests")}
                  >
                    <div className="flex items-center">
                      <span>Approved</span>
                      {getSortIcon("approvedRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("pendingRequests")}
                  >
                    <div className="flex items-center">
                      <span>Pending</span>
                      {getSortIcon("pendingRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("rejectedRequests")}
                  >
                    <div className="flex items-center">
                      <span>Rejected</span>
                      {getSortIcon("rejectedRequests")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalDays")}
                  >
                    <div className="flex items-center">
                      <span>Total Days</span>
                      {getSortIcon("totalDays")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("approvedDays")}
                  >
                    <div className="flex items-center">
                      <span>Approved Days</span>
                      {getSortIcon("approvedDays")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedReports.map((report, index) => (
                  <tr
                    key={`${report.department}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalEmployees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {report.approvedRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {report.pendingRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {report.rejectedRequests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {report.approvedDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Empty State */}
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <ChartBarIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No data found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredReports.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredReports.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">First</span>
                    <ChevronUpIcon className="h-4 w-4 transform rotate-90" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Last</span>
                    <ChevronUpIcon className="h-4 w-4 transform -rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Leave Request Details
                </h3>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-500"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave ID
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedReport.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedReport.employeeName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <p className="text-gray-900">{selectedReport.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type
                  </label>
                  <p className="text-gray-900">{selectedReport.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(selectedReport.startDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <p className="text-gray-900">
                    {format(new Date(selectedReport.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <p className="text-gray-900">
                    {selectedReport.days} day
                    {selectedReport.days !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedReport.reason || "No reason provided"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Submitted At
                  </label>
                  <p className="text-gray-900">
                    {format(
                      new Date(selectedReport.submittedAt),
                      "MMM d, yyyy hh:mm a"
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved By
                  </label>
                  <p className="text-gray-900">{selectedReport.approvedBy}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedReport.notes || "No notes provided"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseViewModal}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Export{" "}
                  {reportType === "detailed"
                    ? "Detailed"
                    : reportType === "summary"
                    ? "Summary"
                    : reportType === "balances"
                    ? "Leave Balances"
                    : "Department"}{" "}
                  Report
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Export Format
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setExportFormat("pdf")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      exportFormat === "pdf"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <DocumentTextIcon className="h-8 w-8 text-red-500" />
                      <span className="mt-2 text-sm font-medium">PDF</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      exportFormat === "csv"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <DocumentTextIcon className="h-8 w-8 text-green-500" />
                      <span className="mt-2 text-sm font-medium">CSV</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportFormat("excel")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      exportFormat === "excel"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
                      <span className="mt-2 text-sm font-medium">Excel</span>
                    </div>
                  </button>
                </div>
              </div>

              {reportType === "detailed" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Columns to Export
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {[
                      { key: "id", label: "Leave ID" },
                      { key: "employeeName", label: "Employee Name" },
                      { key: "department", label: "Department" },
                      { key: "type", label: "Leave Type" },
                      { key: "startDate", label: "Start Date" },
                      { key: "endDate", label: "End Date" },
                      { key: "days", label: "Number of Days" },
                      { key: "status", label: "Status" },
                      { key: "reason", label: "Reason" },
                      { key: "submittedAt", label: "Submitted At" },
                      { key: "approvedBy", label: "Approved By" },
                      { key: "notes", label: "Notes" },
                    ].map((column) => (
                      <div key={column.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={column.key}
                          checked={exportColumns.includes(column.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportColumns([...exportColumns, column.key]);
                            } else {
                              setExportColumns(
                                exportColumns.filter((c) => c !== column.key)
                              );
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={column.key}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {column.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    switch (exportFormat) {
                      case "pdf":
                        exportToPDF();
                        break;
                      case "csv":
                        exportToCSV();
                        break;
                      case "excel":
                        exportToExcel();
                        break;
                      default:
                        exportToPDF();
                    }
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveReportsPage;
