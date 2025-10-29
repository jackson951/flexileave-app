import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { ApiService, useApiInterceptors } from "../../api/web-api-service";

const API_BASE_URL = "http://localhost:5000/api";

// Define leave types
const LEAVE_TYPES = [
  "AnnualLeave",
  "SickLeave",
  "FamilyResponsibility",
  "UnpaidLeave",
  "Other",
];

const UserManagement = () => {
  const { user, isLoggedIn, setUser } = useAuth();

  useApiInterceptors();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    role: "employee",
    avatar: "",
    password: "",
    confirmPassword: "",
    leaveBalances: {
      AnnualLeave: 0,
      SickLeave: 0,
      FamilyResponsibility: 0,
      UnpaidLeave: 0,
      Other: 0,
    },
  });

  // Departments for filtering and selection
  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "IT",
    "Customer Support",
  ];

  // Fetch employees from backend
  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Axios automatically attaches token & parses JSON
      const response = await ApiService.get("/users");

      // Axios puts parsed data in response.data
      const data = response.data;

      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      // Axios error handling
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch employees";
      setError(message);
      console.error("Error fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
    } else {
      setError("Authentication required. Please log in.");
    }
  }, [isLoggedIn]);

  // Filter employees based on search term and department
  useEffect(() => {
    let result = employees;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (employee) =>
          employee.name?.toLowerCase().includes(term) ||
          employee.email?.toLowerCase().includes(term) ||
          employee.position?.toLowerCase().includes(term) ||
          employee.department?.toLowerCase().includes(term)
      );
    }

    if (departmentFilter !== "all") {
      result = result.filter(
        (employee) => employee.department === departmentFilter
      );
    }

    setFilteredEmployees(result);
  }, [searchTerm, departmentFilter, employees]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Check if this is a leave balance field
    if (name.startsWith("leaveBalance_")) {
      const leaveType = name.replace("leaveBalance_", "");
      setFormData({
        ...formData,
        leaveBalances: {
          ...formData.leaveBalances,
          [leaveType]: parseInt(value) || 0,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Only validate passwords when creating a new user
      if (!editingEmployee && formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!editingEmployee && !formData.password) {
        throw new Error("Password is required");
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        joinDate: formData.joinDate || new Date().toISOString().split("T")[0],
        role: formData.role,
        leaveBalances: formData.leaveBalances,
        avatar:
          formData.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            formData.name || "User"
          )}&background=random&size=128`,
        // Only include password if it's being set/changed
        ...(!editingEmployee && { password: formData.password }),
      };

      let savedEmployee;

      if (editingEmployee) {
        // Update existing employee using ApiService
        const response = await ApiService.put(
          `/users/${editingEmployee.id}`,
          payload
        );
        savedEmployee = response.data; // Axios response data is in response.data

        if (editingEmployee.id === user.id) {
          setUser((prevUser) => {
            const hasNameChanged = savedEmployee.name !== prevUser.name;

            return {
              ...prevUser,
              ...savedEmployee,
              avatar: hasNameChanged
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    formData.name || "User"
                  )}&background=random&size=128`
                : prevUser.avatar,
            };
          });
        }
      } else {
        // Create new employee using ApiService for consistency
        const response = await ApiService.post("/users", payload);
        savedEmployee = response.data;
      }

      if (editingEmployee) {
        setEmployees(
          employees.map((emp) =>
            emp.id === editingEmployee.id ? savedEmployee : emp
          )
        );
      } else {
        setEmployees([...employees, savedEmployee]);
      }

      setIsModalOpen(false);
      setEditingEmployee(null);
      resetForm();
    } catch (err) {
      // Handle Axios errors
      const errorMessage =
        err.response?.data?.message || err.message || "Operation failed";
      setError(errorMessage);
      console.error("Error saving employee:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      joinDate: "",
      role: "employee",
      avatar: "",
      password: "",
      confirmPassword: "",
      leaveBalances: {
        AnnualLeave: 0,
        SickLeave: 0,
        FamilyResponsibility: 0,
        UnpaidLeave: 0,
        Other: 0,
      },
    });
    setError(null);
  };

  // Edit employee
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      joinDate: employee.joinDate
        ? new Date(employee.joinDate).toISOString().split("T")[0]
        : "",
      role: employee.role || "employee",
      avatar: employee.avatar || "",
      password: "", // Don't pre-fill password fields
      confirmPassword: "",
      leaveBalances: employee.leaveBalances || {
        AnnualLeave: 0,
        SickLeave: 0,
        FamilyResponsibility: 0,
        UnpaidLeave: 0,
        Other: 0,
      },
    });
    setIsModalOpen(true);
  };

  // Delete employee
  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    setIsLoading(true);
    setError(null);

    try {
      await ApiService.delete(`/users/${id}`);
      setEmployees(employees.filter((employee) => employee.id !== id));
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete employee";
      setError(errorMessage);
      console.error("Error deleting employee:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    resetForm();
  };

  // Calculate total leave balance for display in table
  const calculateTotalLeaveBalance = (leaveBalances) => {
    if (!leaveBalances) return 0;
    return Object.values(leaveBalances).reduce(
      (sum, balance) => sum + (balance || 0),
      0
    );
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="ml-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mt-2"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all employees in your organization
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start">
          <svg
            className="h-5 w-5 mr-2 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-full rounded-md border-0 bg-transparent py-0 pl-8 pr-8 text-gray-700 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                disabled={isLoading}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Employees ({filteredEmployees.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Employee
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Position
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Join Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Leave Balance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && !employees.length ? (
                <>
                  {renderSkeleton()}
                  {renderSkeleton()}
                  {renderSkeleton()}
                </>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={
                              employee.avatar ||
                              "https://via.placeholder.com/150?text=User"
                            }
                            alt={employee.name}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=User";
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(employee.joinDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {calculateTotalLeaveBalance(employee.leaveBalances)}{" "}
                          days
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : employee.role === "manager"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {employee.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(employee)}
                        disabled={isLoading}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {isLoading
                      ? "Loading employees..."
                      : "No employees found. Try adjusting your search criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Department
                    </label>
                    <select
                      name="department"
                      id="department"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      id="position"
                      required
                      value={formData.position}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="joinDate"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      id="joinDate"
                      required
                      value={formData.joinDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Role
                    </label>
                    <select
                      name="role"
                      id="role"
                      required
                      value={formData.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Leave Balance Fields */}
                  {LEAVE_TYPES.map((leaveType) => (
                    <div key={leaveType}>
                      <label
                        htmlFor={`leaveBalance_${leaveType}`}
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        {leaveType.replace(/([A-Z])/g, " $1").trim()} Days
                      </label>
                      <input
                        type="number"
                        name={`leaveBalance_${leaveType}`}
                        id={`leaveBalance_${leaveType}`}
                        min="0"
                        value={formData.leaveBalances[leaveType] || 0}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        disabled={isLoading}
                      />
                    </div>
                  ))}

                  {/* Password fields - only show when creating new user */}
                  {!editingEmployee && (
                    <>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            id="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border pr-10"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="avatar"
                      className="block text-sm font-medium text-gray-700 text-left"
                    >
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      name="avatar"
                      id="avatar"
                      value={formData.avatar}
                      onChange={handleInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {editingEmployee ? "Updating..." : "Saving..."}
                  </>
                ) : editingEmployee ? (
                  "Update Employee"
                ) : (
                  "Add Employee"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
