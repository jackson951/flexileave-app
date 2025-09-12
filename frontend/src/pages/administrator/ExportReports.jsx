import React, { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ArchiveBoxIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { format, subMonths, addDays, isSameDay, parseISO } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { useAuth } from "../../contexts/AuthContext";

// Mock data generator function
const generateMockReports = () => {
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
  ];
  const reportTypes = [
    "Leave",
    "Attendance",
    "Performance",
    "Expense",
    "Project",
  ];
  const statuses = ["Approved", "Pending", "Rejected", "Cancelled"];
  const employees = [
    {
      id: 1,
      name: "John Doe",
      department: "Engineering",
      role: "Senior Developer",
    },
    {
      id: 2,
      name: "Jane Smith",
      department: "Marketing",
      role: "Marketing Manager",
    },
    {
      id: 3,
      name: "Mike Johnson",
      department: "Sales",
      role: "Sales Representative",
    },
    { id: 4, name: "Sarah Wilson", department: "HR", role: "HR Specialist" },
    {
      id: 5,
      name: "David Brown",
      department: "Finance",
      role: "Financial Analyst",
    },
    {
      id: 6,
      name: "Emily Davis",
      department: "Operations",
      role: "Operations Manager",
    },
    {
      id: 7,
      name: "Robert Miller",
      department: "Engineering",
      role: "Software Engineer",
    },
    {
      id: 8,
      name: "Lisa Anderson",
      department: "Marketing",
      role: "Digital Marketer",
    },
    {
      id: 9,
      name: "James Taylor",
      department: "Sales",
      role: "Sales Executive",
    },
    { id: 10, name: "Jennifer White", department: "HR", role: "Recruiter" },
  ];

  const reports = [];
  const startDate = subMonths(new Date(), 12);
  const endDate = new Date();

  // Generate 100+ mock reports
  for (let i = 0; i < 120; i++) {
    const randomDate = new Date(
      startDate.getTime() +
        Math.random() * (endDate.getTime() - startDate.getTime())
    );
    const employee = employees[Math.floor(Math.random() * employees.length)];

    reports.push({
      id: i + 1,
      type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      role: employee.role,
      date: format(randomDate, "yyyy-MM-dd"),
      periodStart: format(subMonths(randomDate, 1), "yyyy-MM-dd"),
      periodEnd: format(randomDate, "yyyy-MM-dd"),
      amount: Math.floor(Math.random() * 5000) + 100,
      currency: "USD",
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: [
        "Annual leave request for vacation",
        "Sick leave due to illness",
        "Family responsibility day",
        "Business trip expenses",
        "Office supplies purchase",
        "Client entertainment expense",
        "Training course fee",
        "Conference registration",
        "Equipment repair cost",
        "Travel reimbursement",
        "Remote work stipend",
        "Bonus payment",
        "Overtime compensation",
        "Holiday pay adjustment",
        "Payroll correction",
      ][Math.floor(Math.random() * 15)],
      approvedBy: ["Admin", "HR Manager", "Department Head"][
        Math.floor(Math.random() * 3)
      ],
      approvedAt: format(
        addDays(randomDate, Math.floor(Math.random() * 5)),
        "yyyy-MM-dd HH:mm"
      ),
      createdAt: format(randomDate, "yyyy-MM-dd HH:mm:ss"),
      updatedAt: format(
        addDays(randomDate, Math.floor(Math.random() * 3)),
        "yyyy-MM-dd HH:mm:ss"
      ),
      notes: [
        "Approved as per company policy",
        "Requires additional documentation",
        "Not within budget allocation",
        "Submitted after deadline",
        "Duplicate submission",
        "Valid request with proper documentation",
        "Needs manager approval",
        "Funds available",
        "Budget exceeded",
        "Pending verification",
        "Approved with conditions",
        "Rejected due to insufficient notice",
        "Request resubmitted",
        "Processing...",
        "Completed successfully",
      ][Math.floor(Math.random() * 15)],
      category: [
        "Personal",
        "Business",
        "Administrative",
        "Development",
        "Operational",
      ][Math.floor(Math.random() * 5)],
      tags: [
        "urgent",
        "recurring",
        "one-time",
        "high-priority",
        "low-priority",
      ][Math.floor(Math.random() * 5)].split(","),
    });
  }

  return reports;
};

const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReports, setSelectedReports] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("all");
  const [exportFormat, setExportFormat] = useState("pdf"); // pdf, excel, csv
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, add, edit
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    type: "all",
    department: "all",
    status: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    employee: "all",
    tag: "all",
  });

  // Initialize mock data on component mount
  useEffect(() => {
    const mockReports = generateMockReports();
    setTimeout(() => {
      setReports(mockReports);
      setFilteredReports(mockReports);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter logic based on search term and filters
  useMemo(() => {
    let result = [...reports];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (report) =>
          report.employeeName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.id.toString().includes(searchTerm)
      );
    }

    // Apply filters
    if (reportFilters.type !== "all") {
      result = result.filter((report) => report.type === reportFilters.type);
    }
    if (reportFilters.department !== "all") {
      result = result.filter(
        (report) => report.department === reportFilters.department
      );
    }
    if (reportFilters.status !== "all") {
      result = result.filter(
        (report) => report.status === reportFilters.status
      );
    }
    if (reportFilters.category !== "all") {
      result = result.filter(
        (report) => report.category === reportFilters.category
      );
    }
    if (reportFilters.employee !== "all") {
      result = result.filter(
        (report) => report.employeeId === parseInt(reportFilters.employee)
      );
    }
    if (reportFilters.tag !== "all") {
      result = result.filter((report) =>
        report.tags.includes(reportFilters.tag)
      );
    }
    if (reportFilters.dateFrom) {
      result = result.filter(
        (report) => new Date(report.date) >= new Date(reportFilters.dateFrom)
      );
    }
    if (reportFilters.dateTo) {
      result = result.filter(
        (report) => new Date(report.date) <= new Date(reportFilters.dateTo)
      );
    }

    // Apply tab filtering
    if (activeTab === "approved") {
      result = result.filter((report) => report.status === "Approved");
    } else if (activeTab === "pending") {
      result = result.filter((report) => report.status === "Pending");
    } else if (activeTab === "rejected") {
      result = result.filter((report) => report.status === "Rejected");
    } else if (activeTab === "recent") {
      const threeDaysAgo = subMonths(new Date(), 1);
      result = result.filter((report) => new Date(report.date) >= threeDaysAgo);
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    reports,
    searchTerm,
    reportFilters,
    activeTab,
    sortConfig,
    currentPage,
    itemsPerPage,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Sorting handler
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReports(paginatedReports.map((report) => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Action handlers
  const handleViewReport = (report) => {
    setModalMode("view");
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleEditReport = (report) => {
    setModalMode("edit");
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleAddReport = () => {
    setModalMode("add");
    setSelectedReport(null);
    setShowReportModal(true);
  };

  const handleDeleteReport = (report) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
    setFilteredReports((prev) =>
      prev.filter((r) => r.id !== selectedReport.id)
    );
    setShowDeleteModal(false);
    setSelectedReport(null);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} for reports:`, selectedReports);
    if (action === "delete") {
      setReports((prev) => prev.filter((r) => !selectedReports.includes(r.id)));
      setFilteredReports((prev) =>
        prev.filter((r) => !selectedReports.includes(r.id))
      );
    } else if (action === "approve") {
      setReports((prev) =>
        prev.map((r) =>
          selectedReports.includes(r.id) ? { ...r, status: "Approved" } : r
        )
      );
      setFilteredReports((prev) =>
        prev.map((r) =>
          selectedReports.includes(r.id) ? { ...r, status: "Approved" } : r
        )
      );
    } else if (action === "reject") {
      setReports((prev) =>
        prev.map((r) =>
          selectedReports.includes(r.id) ? { ...r, status: "Rejected" } : r
        )
      );
      setFilteredReports((prev) =>
        prev.map((r) =>
          selectedReports.includes(r.id) ? { ...r, status: "Rejected" } : r
        )
      );
    }
    setSelectedReports([]);
    setShowBulkActions(false);
  };

  // Export functions
  const exportToCSV = () => {
    const csvContent = [
      [
        "ID",
        "Type",
        "Employee Name",
        "Department",
        "Role",
        "Date",
        "Currency",
        "Status",
        "Category",
        "Description",
        "Notes",
        "Approved By",
        "Approved At",
        "Created At",
        "Updated At",
        "Tags",
      ],
      ...filteredReports.map((report) => [
        report.id,
        report.type,
        report.employeeName,
        report.department,
        report.role,
        report.date,
        report.amount,
        report.currency,
        report.status,
        report.category,
        report.description,
        report.notes,
        report.approvedBy,
        report.approvedAt,
        report.createdAt,
        report.updatedAt,
        report.tags.join(", "),
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reports_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reports");

    // Add headers
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Type", key: "type", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Department", key: "department", width: 20 },
      { header: "Role", key: "role", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Category", key: "category", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Approved By", key: "approvedBy", width: 20 },
      { header: "Approved At", key: "approvedAt", width: 20 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 },
      { header: "Tags", key: "tags", width: 20 },
    ];

    // Add data rows
    filteredReports.forEach((report) => {
      worksheet.addRow({
        id: report.id,
        type: report.type,
        employeeName: report.employeeName,
        department: report.department,
        role: report.role,
        date: report.date,
        amount: report.amount,
        currency: report.currency,
        status: report.status,
        category: report.category,
        description: report.description,
        notes: report.notes,
        approvedBy: report.approvedBy,
        approvedAt: report.approvedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        tags: report.tags.join(", "),
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };

    // Auto-adjust column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const length = cell.value ? cell.value.toString().length : 0;
        maxLength = Math.max(maxLength, length);
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `reports_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Reports Report", 105, 15, { align: "center" });

    // Add subtitle and metadata
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on: ${format(new Date(), "MMMM d, yyyy HH:mm")}`,
      105,
      25,
      { align: "center" }
    );
    doc.text(
      `Filter: ${
        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
      } | Total: ${filteredReports.length} records`,
      105,
      30,
      { align: "center" }
    );

    // Prepare table data
    const tableData = filteredReports.map((report) => [
      report.id,
      report.type,
      report.employeeName,
      report.department,
      report.role,
      report.date,
      `${report.amount} ${report.currency}`,
      report.status,
      report.category,
      report.description.substring(0, 40) +
        (report.description.length > 40 ? "..." : ""),
      report.notes.substring(0, 40) + (report.notes.length > 40 ? "..." : ""),
      report.approvedBy,
      report.approvedAt,
    ]);

    // Define column widths
    const columnWidths = [10, 15, 30, 25, 25, 20, 20, 20, 20, 40, 40, 25, 25];

    // Add table
    doc.autoTable({
      head: [
        [
          "ID",
          "Type",
          "Employee Name",
          "Department",
          "Role",
          "Date",
          "Status",
          "Category",
          "Description",
          "Notes",
          "Approved By",
          "Approved At",
        ],
      ],
      body: tableData,
      startY: 40,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        halign: "left",
        valign: "middle",
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      columnWidths: columnWidths,
      didParseCell: (data) => {
        // Highlight status cells
        if (data.column.index === 7) {
          const status = data.cell.raw;
          switch (status) {
            case "Approved":
              data.cell.styles.fillColor = [22, 163, 74];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            case "Rejected":
              data.cell.styles.fillColor = [239, 68, 68];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            case "Pending":
              data.cell.styles.fillColor = [245, 158, 11];
              data.cell.styles.textColor = [255, 255, 255];
              break;
          }
        }
      },
    });

    // Add footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(
      `Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()} | Generated by ${
        user?.name
      }`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    // Save PDF
    doc.save(`reports_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  const exportReport = () => {
    if (exportFormat === "pdf") {
      exportToPDF();
    } else if (exportFormat === "excel") {
      exportToExcel();
    } else if (exportFormat === "csv") {
      exportToCSV();
    }
    setShowExportModal(false);
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const values = [...new Set(reports.map((report) => report[field]))];
    return values.filter((val) => val !== undefined && val !== null);
  };

  const uniqueDepartments = getUniqueValues("department");
  const uniqueTypes = getUniqueValues("type");
  const uniqueStatuses = getUniqueValues("status");
  const uniqueCategories = getUniqueValues("category");
  const uniqueEmployees = getUniqueValues("employeeId").map((id) => ({
    id,
    name: reports.find((r) => r.employeeId === id)?.employeeName || "Unknown",
  }));
  const uniqueTags = [...new Set(reports.flatMap((r) => r.tags))];

  // Stats calculations
  const stats = useMemo(() => {
    const totalReports = filteredReports.length;
    const approvedCount = filteredReports.filter(
      (r) => r.status === "Approved"
    ).length;
    const pendingCount = filteredReports.filter(
      (r) => r.status === "Pending"
    ).length;
    const rejectedCount = filteredReports.filter(
      (r) => r.status === "Rejected"
    ).length;
    const totalAmount = filteredReports.reduce((sum, r) => sum + r.amount, 0);
    const avgAmount = totalReports > 0 ? totalAmount / totalReports : 0;

    return {
      total: totalReports,
      approved: approvedCount,
      pending: pendingCount,
      rejected: rejectedCount,
      totalAmount: totalAmount,
      avgAmount: avgAmount,
    };
  }, [filteredReports]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const colors = {
      Approved: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }) => {
    const colors = {
      Leave: "bg-indigo-100 text-indigo-800",
      Attendance: "bg-blue-100 text-blue-800",
      Performance: "bg-purple-100 text-purple-800",
      Expense: "bg-red-100 text-red-800",
      Project: "bg-green-100 text-green-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type]}`}
      >
        {type}
      </span>
    );
  };

  // Category badge component
  const CategoryBadge = ({ category }) => {
    const colors = {
      Personal: "bg-pink-100 text-pink-800",
      Business: "bg-cyan-100 text-cyan-800",
      Administrative: "bg-gray-100 text-gray-800",
      Development: "bg-emerald-100 text-emerald-800",
      Operational: "bg-orange-100 text-orange-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[category]}`}
      >
        {category}
      </span>
    );
  };

  // Tag badge component
  const TagBadge = ({ tag }) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      recurring: "bg-blue-100 text-blue-800",
      "one-time": "bg-gray-100 text-gray-800",
      "high-priority": "bg-purple-100 text-purple-800",
      "low-priority": "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[tag]}`}
      >
        {tag}
      </span>
    );
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column)
      return <ChevronUpDownIcon className="h-4 w-4" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4" />
    ) : (
      <ChevronDownIcon className="h-4 w-4" />
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-lg text-gray-600">
              Comprehensive overview and management of all system reports
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 flex space-x-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={handleAddReport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "all", label: "All Reports", count: reports.length },
            { id: "approved", label: "Approved", count: stats.approved },
            { id: "pending", label: "Pending", count: stats.pending },
            { id: "rejected", label: "Rejected", count: stats.rejected },
            {
              id: "recent",
              label: "Recent",
              count: filteredReports.filter(
                (r) => new Date(r.date) >= subMonths(new Date(), 1)
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span className="ml-1 bg-gray-200 text-gray-800 text-xs rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {/* Total Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        {/* Approved Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        {/* Rejected Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <XMarkIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search reports by employee, description, or ID..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>

              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                CSV
              </button>

              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Excel
              </button>

              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                PDF
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={reportFilters.type}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    value={reportFilters.department}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    value={reportFilters.status}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={reportFilters.category}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={reportFilters.employee}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        employee: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Employees</option>
                    {uniqueEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag
                  </label>
                  <select
                    value={reportFilters.tag}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        tag: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Tags</option>
                    {uniqueTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={reportFilters.dateFrom}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={reportFilters.dateTo}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setReportFilters({
                      type: "all",
                      department: "all",
                      status: "all",
                      category: "all",
                      employee: "all",
                      tag: "all",
                      dateFrom: "",
                      dateTo: "",
                    })
                  }
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary and Bulk Actions */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {filteredReports.length} of {reports.length} reports
              </span>
              {selectedReports.length > 0 && (
                <>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-indigo-600 font-medium">
                    {selectedReports.length} selected
                  </span>
                </>
              )}
            </div>

            {selectedReports.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Bulk Actions
                  <ChevronUpDownIcon className="ml-2 h-4 w-4" />
                </button>

                {showBulkActions && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleBulkAction("approve")}
                        className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                      >
                        <CheckIcon className="h-4 w-4 mr-3" />
                        Approve Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction("reject")}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-3" />
                        Reject Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction("delete")}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-3" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={
                      selectedReports.length === paginatedReports.length &&
                      paginatedReports.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    <SortIcon column="id" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <SortIcon column="type" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("employeeName")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Employee</span>
                    <SortIcon column="employeeName" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Department</span>
                    <SortIcon column="department" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    <SortIcon column="role" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <SortIcon column="date" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Amount</span>
                    <SortIcon column="amount" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <SortIcon column="status" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <SortIcon column="category" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tags
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedReports.map((report) => (
                <tr
                  key={report.id}
                  className={`hover:bg-gray-50 ${
                    selectedReports.includes(report.id) ? "bg-indigo-50" : ""
                  }`}
                >
                  <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => handleSelectReport(report.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{report.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TypeBadge type={report.type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {report.employeeName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {report.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{report.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(report.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${report.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CategoryBadge category={report.category} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {report.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewReport(report)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditReport(report)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit report"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete report"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={handleAddReport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Report
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredReports.length)} of{" "}
                {filteredReports.length} results
              </p>
              <div className="ml-4">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Export Reports
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="pdf"
                        checked={exportFormat === "pdf"}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">PDF</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="excel"
                        checked={exportFormat === "excel"}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Excel (.xlsx)
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="csv"
                        checked={exportFormat === "csv"}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        CSV (.csv)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-500 mb-4">
                    You're exporting {filteredReports.length} reports.
                  </p>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={exportReport}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalMode === "add"
                    ? "Create New Report"
                    : modalMode === "edit"
                    ? "Edit Report"
                    : "View Report"}
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type *
                  </label>
                  <select
                    disabled={modalMode === "view"}
                    value={selectedReport?.type || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  >
                    <option value="">Select type...</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    disabled={modalMode === "view"}
                    value={selectedReport?.employeeId || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        employeeId: Number(e.target.value),
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  >
                    <option value="">Select employee...</option>
                    {uniqueEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === "view"}
                    value={selectedReport?.department || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === "view"}
                    value={selectedReport?.role || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    disabled={modalMode === "view"}
                    value={selectedReport?.date || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    disabled={modalMode === "view"}
                    value={selectedReport?.amount || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        amount: Number(e.target.value),
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    disabled={modalMode === "view"}
                    value={selectedReport?.currency || "USD"}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={modalMode === "view"}
                    value={selectedReport?.status || "Pending"}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    disabled={modalMode === "view"}
                    value={selectedReport?.category || "Personal"}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Development">Development</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    disabled={modalMode === "view"}
                    value={selectedReport?.description || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    disabled={modalMode === "view"}
                    value={selectedReport?.notes || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === "view"}
                    value={selectedReport?.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setSelectedReport((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag),
                      }))
                    }
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      modalMode === "view" ? "bg-gray-50" : ""
                    }`}
                    placeholder="urgent, recurring, high-priority"
                  />
                </div>
              </div>

              {modalMode !== "view" && (
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (modalMode === "add") {
                        const newReport = {
                          id: reports.length + 1,
                          ...selectedReport,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          approvedAt: "",
                          approvedBy: "",
                        };
                        setReports([...reports, newReport]);
                        setFilteredReports([...filteredReports, newReport]);
                      } else if (modalMode === "edit") {
                        setReports((prev) =>
                          prev.map((r) =>
                            r.id === selectedReport.id ? selectedReport : r
                          )
                        );
                        setFilteredReports((prev) =>
                          prev.map((r) =>
                            r.id === selectedReport.id ? selectedReport : r
                          )
                        );
                      }
                      setShowReportModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {modalMode === "add" ? "Create Report" : "Update Report"}
                  </button>
                </div>
              )}

              {modalMode === "view" && (
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedReport(selectedReport);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Delete Report
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this report? This action cannot
                be undone.
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
