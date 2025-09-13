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
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { format, subDays, parseISO } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
// Import SheetJS for Excel export
import * as XLSX from "xlsx";

// Mock data generator for leave reports
const generateMockLeaveReports = () => {
  const departments = ["Engineering", "Marketing", "HR", "Operations"];
  const leaveTypes = [
    "Annual Leave",
    "Sick Leave",
    "Maternity/Paternity",
    "Emergency Leave",
    "Unpaid Leave",
  ];
  const statuses = ["Pending", "Approved", "Rejected"];
  const employees = [
    { id: 1, name: "John Doe", department: "Engineering" },
    { id: 2, name: "Jane Smith", department: "Marketing" },
    { id: 3, name: "Mike Johnson", department: "HR" },
    { id: 4, name: "Sarah Wilson", department: "Operations" },
  ];
  const reports = [];
  const startDate = subDays(new Date(), 90);
  for (let i = 0; i < 50; i++) {
    const randomDays = Math.floor(Math.random() * 10) + 1;
    const start = new Date(
      startDate.getTime() +
        Math.random() * (new Date().getTime() - startDate.getTime())
    );
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + randomDays);

    const employee = employees[Math.floor(Math.random() * employees.length)];
    reports.push({
      id: `LV-${1000 + i}`,
      type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      days: randomDays,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reason: [
        "Family vacation",
        "Medical appointment",
        "Personal reasons",
        "Family emergency",
        "Mental health day",
      ][Math.floor(Math.random() * 5)],
      submittedAt: format(start, "yyyy-MM-dd HH:mm"),
      approvedBy: ["HR Manager", "Team Lead", "Department Head"][
        Math.floor(Math.random() * 3)
      ],
      notes: [
        "Approved as per policy",
        "Requires doctor's note",
        "Pending team coverage",
        "Approved with reduced days",
        "Rejected - insufficient notice",
      ][Math.floor(Math.random() * 5)],
    });
  }
  return reports;
};

const LeaveReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
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

  // Initialize mock data
  useEffect(() => {
    const mockReports = generateMockLeaveReports();
    setReports(mockReports);
    setFilteredReports(mockReports);
    setLoading(false);
  }, []);
    // Filters state
  const [filters, setFilters] = useState({
    type: "all",
    department: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Filter and sort reports
  useEffect(() => {
    let result = [...reports];

    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (report) =>
          report.employeeName.toLowerCase().includes(term) ||
          report.id.toLowerCase().includes(term) ||
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
      result = result.filter((report) => report.status === "Pending");
    } else if (activeTab === "approved") {
      result = result.filter((report) => report.status === "Approved");
    } else if (activeTab === "rejected") {
      result = result.filter((report) => report.status === "Rejected");
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredReports(result);
    setCurrentPage(1);
  }, [reports, searchTerm, filters, activeTab, sortConfig]);

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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(18);
    doc.text("Leave Reports", 105, 20, { align: "center" });
    // Subtitle
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy")}`, 105, 30, {
      align: "center",
    });

    // Prepare table data with selected columns
    const headers = [
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
    const columnKeys = [
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

    const tableData = filteredReports.map((report) => {
      return visibleColumnKeys.map((key) => {
        if (key === "reason") {
          return report[key].substring(0, 30); // Truncate reason for readability
        }
        return report[key];
      });
    });

    // Add table
    doc.autoTable({
      head: [visibleHeaders],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
      },
      columnStyles: visibleColumnKeys.reduce((acc, key, idx) => {
        const widthMap = {
          id: 20,
          employeeName: 25,
          department: 25,
          type: 25,
          startDate: 20,
          endDate: 20,
          days: 15,
          status: 20,
          reason: 30,
        };
        acc[idx] = { cellWidth: widthMap[key] || 20 };
        return acc;
      }, {}),
    });

    // Save PDF
    doc.save(`leave_reports_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
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
    const columnKeys = [
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

    const data = filteredReports.map((report) => {
      return visibleColumnKeys.map((key) => report[key]);
    });

    const csvContent = Papa.unparse([visibleHeaders, ...data], {
      quotes: true,
      delimiter: ",",
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leave_reports_${format(new Date(), "yyyyMMdd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel
  const exportToExcel = () => {
    const headers = [
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
    const columnKeys = [
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

    // Create worksheet data
    const worksheetData = [visibleHeaders];
    filteredReports.forEach((report) => {
      const row = visibleColumnKeys.map((key) => report[key]);
      worksheetData.push(row);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Reports");

    // Convert to Excel file
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // Create download link
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leave_reports_${format(new Date(), "yyyyMMdd")}.xlsx`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique values for filters
  const uniqueDepartments = [...new Set(reports.map((r) => r.department))];
  const uniqueTypes = [...new Set(reports.map((r) => r.type))];
  const uniqueStatuses = [...new Set(reports.map((r) => r.status))];

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      Approved: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
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



  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Reports</h1>
          <p className="mt-2 text-gray-600">
            Manage and track employee leave requests
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
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
                    tab === "all" ? true : r.status.toLowerCase() === tab
                  ).length
                }
              </span>
            </button>
          ))}
        </nav>
      </div>

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
                  placeholder="Search leave requests..."
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
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
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
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
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
                    <option key={status} value={status}>
                      {status}
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
                  <span className="flex items-center text-gray-500">to</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
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
              {paginatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
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
                      {format(new Date(report.startDate), "MMM d")} -{" "}
                      {format(new Date(report.endDate), "MMM d, yyyy")}
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
                        onClick={() => {
                          // Since admin can't view details, this could be removed or kept for future use
                          // For now, we'll just log it
                          console.log("View details for:", report.id);
                        }}
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

          {/* Empty State */}
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <UserIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No leave requests found
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Export Leave Reports
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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Columns to Export
                </label>
                <div className="space-y-2">
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
