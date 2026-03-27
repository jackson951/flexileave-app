import React, { useState, useEffect } from "react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CalendarIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  SparklesIcon,
  CameraIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ApiService, useApiInterceptors } from "../api/web-api-service";

/* ─── Google Fonts injection ─── */
const FontInjector = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
  return null;
};

/* ─── Leave color palette ─── */
const LEAVE_COLORS = [
  { bar: "#c084fc", bg: "#faf5ff", text: "#7e22ce" },
  { bar: "#34d399", bg: "#f0fdf4", text: "#065f46" },
  { bar: "#fb923c", bg: "#fff7ed", text: "#9a3412" },
  { bar: "#60a5fa", bg: "#eff6ff", text: "#1d4ed8" },
  { bar: "#f472b6", bg: "#fdf2f8", text: "#9d174d" },
];

const TABS = ["Overview", "Security", "Leave Balance"];

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [isEditing, setIsEditing] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "", phone: "", department: "", position: "",
    joinDate: "", avatar: "", password: "", confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const navigate = useNavigate();

  useApiInterceptors();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "", phone: user.phone || "",
        department: user.department || "", position: user.position || "",
        joinDate: user.joinDate || "", avatar: user.avatar || "",
        password: "", confirmPassword: "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errorMessage) setErrorMessage("");
  };

  const handlePasswordCheckboxChange = (e) => {
    setUpdatePassword(e.target.checked);
    if (!e.target.checked) setFormData({ ...formData, password: "", confirmPassword: "" });
  };

  const validatePasswords = () => {
    if (updatePassword) {
      if (!formData.password) { setErrorMessage("Password is required when updating password"); return false; }
      if (formData.password.length < 8) { setErrorMessage("Password must be at least 8 characters long"); return false; }
      if (formData.password !== formData.confirmPassword) { setErrorMessage("Passwords do not match"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    if (!validatePasswords()) { setLoading(false); return; }
    try {
      const profileUpdates = {
        name: formData.name, phone: formData.phone,
        joinDate: formData.joinDate, avatar: formData.avatar,
      };
      if (updatePassword && formData.password) profileUpdates.password = formData.password;
      const response = await ApiService.put(`/users/${user.id}`, profileUpdates);
      await updateUserProfile(user?.id, response.data);
      setSuccessMessage(updatePassword ? "Profile and password updated!" : "Profile updated successfully!");
      setIsEditing(false);
      setUpdatePassword(false);
      setFormData({ ...formData, password: "", confirmPassword: "" });
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: user.name || "", phone: user.phone || "", department: user.department || "",
      position: user.position || "", joinDate: user.joinDate || "", avatar: user.avatar || "",
      password: "", confirmPassword: "" });
    setIsEditing(false);
    setUpdatePassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const formatDate = (d) => {
    if (!d) return "Not specified";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const calcTotalLeave = (lb) => lb ? Object.values(lb).reduce((s, v) => s + (v || 0), 0) : 0;

  const formatLeaveType = (lt) =>
    lt.replace(/([A-Z])/g, " $1").trim().replace(/^./, s => s.toUpperCase());

  const handleRequestUpdate = (type) => {
    setRequestType(type);
    setRequestDetails("");
    setShowRequestModal(true);
  };

  const submitUpdateRequest = async () => {
    if (!requestDetails.trim()) { alert("Please provide details for your request."); return; }
    alert(`Your request to update your ${requestType} has been submitted to HR.`);
    setShowRequestModal(false);
  };

  if (!user) return null;

  const dashboardRoute = user.role?.toUpperCase() === "EMPLOYEE" ? "/dashboard/leave" : "/dashboard/stats";
  const totalLeave = calcTotalLeave(user.leaveBalances);
  const initials = (formData.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const roleLabel = { admin: "Administrator", manager: "Manager", employee: "Employee" }[user?.role] || "User";

  /* ─── inline styles as objects for custom font ─── */
  const isDark = document.documentElement.classList.contains("dark");
  const s = {
    page: {
      minHeight: "100vh",
      background: isDark 
        ? "linear-gradient(135deg, #111827 0%, #0b1220 100%)"
        : "linear-gradient(135deg, #faf9f7 0%, #f0ede8 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "2rem 1.5rem",
      color: isDark ? "#e5e7eb" : "#1a1612",
    },
    heading: { fontFamily: "'Fraunces', serif", fontWeight: 300 },
    card: {
      background: isDark ? "#1f2937" : "#ffffff",
      borderRadius: "20px",
      boxShadow: isDark 
        ? "0 1px 3px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.4)"
        : "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
      overflow: "hidden",
      border: isDark ? "1px solid #374151" : "none",
    },
    input: {
      width: "100%",
      padding: "0.625rem 0.875rem",
      border: isDark 
        ? "1.5px solid #374151"
        : "1.5px solid #e5e0d8",
      borderRadius: "10px",
      background: isDark ? "#374151" : "#fdfcfb",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "0.9rem",
      outline: "none",
      transition: "border-color 0.2s",
      color: isDark ? "#e5e7eb" : "#1a1612",
    },
    inputReadOnly: {
      width: "100%",
      padding: "0.625rem 0.875rem",
      border: isDark 
        ? "1.5px solid #4b5563"
        : "1.5px solid #ede9e3",
      borderRadius: "10px",
      background: isDark ? "#374151" : "#f7f5f2",
      color: isDark ? "#9ca3af" : "#9e9890",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "0.9rem",
      cursor: "not-allowed",
    },
  };

  return (
    <>
      <FontInjector />
      <style>{`
        .prof-tab { cursor:pointer; padding:0.5rem 1.25rem; border-radius:50px; font-size:0.85rem; font-weight:500; transition:all .2s; color:#8a8070; background:transparent; border:none; font-family:'DM Sans',sans-serif; }
        .prof-tab.active { background:#1a1612; color:#fff; }
        .prof-tab:hover:not(.active) { background:#f0ede8; color:#3d3525; }
        .prof-input:focus { border-color:#c9a96e !important; box-shadow:0 0 0 3px rgba(201,169,110,0.12); }
        .prof-btn-primary { background:#1a1612; color:#fff; border:none; padding:0.6rem 1.5rem; border-radius:50px; font-size:0.85rem; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background .2s; }
        .prof-btn-primary:hover { background:#3d3525; }
        .prof-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        .prof-btn-secondary { background:transparent; color:#5a5040; border:1.5px solid #d9d0c4; padding:0.6rem 1.5rem; border-radius:50px; font-size:0.85rem; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
        .prof-btn-secondary:hover { background:#f0ede8; }
        .leave-bar { height:6px; border-radius:3px; background:#ede9e3; overflow:hidden; margin-top:6px; }
        .leave-bar-fill { height:100%; border-radius:3px; transition:width 0.8s cubic-bezier(.4,0,.2,1); }
        .avatar-ring { width:88px; height:88px; border-radius:50%; background:linear-gradient(135deg,#c9a96e,#e8c98a); display:flex; align-items:center; justify-content:center; font-family:'Fraunces',serif; font-size:2rem; color:#fff; font-weight:400; flex-shrink:0; box-shadow:0 4px 16px rgba(201,169,110,0.35); }
        .field-label { font-size:0.75rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#9e9890; margin-bottom:0.35rem; }
        .field-value { font-size:0.95rem; color:#1a1612; font-weight:400; }
        .section-divider { height:1px; background:linear-gradient(90deg,transparent,#e8e2d9,transparent); margin:1.5rem 0; }
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .slide-in { animation:slideIn 0.3s ease; }
        .toast-success { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; padding:0.875rem 1.25rem; display:flex; align-items:center; gap:0.75rem; }
        .toast-error { background:#fef2f2; border:1.5px solid #fecaca; border-radius:12px; padding:0.875rem 1.25rem; display:flex; align-items:center; gap:0.75rem; }
        .modal-overlay { position:fixed; inset:0; background:rgba(26,22,18,0.45); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
        .modal-box { background:#fff; border-radius:20px; padding:2rem; max-width:440px; width:100%; box-shadow:0 24px 80px rgba(0,0,0,0.18); animation:slideIn 0.25s ease; }
        .badge { display:inline-flex; align-items:center; gap:0.35rem; padding:0.3rem 0.875rem; border-radius:50px; font-size:0.75rem; font-weight:600; }
        
        /* Dark mode styles */
        .dark .prof-tab { color:#d1d5db; }
        .dark .prof-tab:hover:not(.active) { background:#374151; color:#e5e7eb; }
        .dark .prof-btn-secondary { color:#d1d5db; border-color:#4b5563; }
        .dark .prof-btn-secondary:hover { background:#374151; }
        .dark .prof-input:focus { border-color:#60a5fa !important; box-shadow:0 0 0 3px rgba(96,165,250,0.12); }
        .dark .leave-bar { background:#374151; }
        .dark .field-label { color:#9ca3af; }
        .dark .field-value { color:#e5e7eb; }
        .dark .section-divider { background:linear-gradient(90deg,transparent,#374151,transparent); }
        .dark .toast-success { background:#064e3b; border-color:#10b981; }
        .dark .toast-success span { color:#a7f3d0; }
        .dark .toast-error { background:#7f1d1d; border-color:#ef4444; }
        .dark .toast-error span { color:#fecaca; }
        .dark .modal-overlay { background:rgba(17,24,39,0.6); }
        .dark .modal-box { background:#1f2937; box-shadow:0 24px 80px rgba(0,0,0,0.5); }
        .dark .badge { color:#e5e7eb; }
      `}</style>

      <div style={s.page}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* ── Back nav ── */}
                  <button
            onClick={() => navigate(dashboardRoute)}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", color:isDark ? "#d1d5db" : "#8a8070", fontSize:"0.85rem", cursor:"pointer", marginBottom:"2rem", fontFamily:"'DM Sans',sans-serif", padding:0 }}
          >
            <ArrowLeftIcon style={{ width:14, height:14, color:isDark ? "#9ca3af" : "#9e9890" }} />
            Back to Dashboard
          </button>

          {/* ── Page title ── */}
          <div style={{ marginBottom:"2rem" }}>
            <h1 style={{ ...s.heading, fontSize:"2.75rem", color:isDark ? "#e5e7eb" : "#1a1612", margin:0, lineHeight:1.1 }}>
              My Profile
            </h1>
            <p style={{ color:isDark ? "#9ca3af" : "#9e9890", marginTop:"0.4rem", fontSize:"0.95rem" }}>
              Manage your personal information and employment details
            </p>
          </div>

          {/* ── Main layout ── */}
          <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"1.5rem", alignItems:"start" }}>

            {/* ─── LEFT SIDEBAR ─── */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

              {/* Identity card */}
              <div style={{ ...s.card, padding:"1.75rem", textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:"1rem", position:"relative" }}>
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt={formData.name}
                      style={{ width:88, height:88, borderRadius:"50%", objectFit:"cover", boxShadow:"0 4px 16px rgba(0,0,0,0.12)" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="avatar-ring">{initials}</div>
                  )}
                </div>

                <h2 style={{ ...s.heading, fontSize:"1.35rem", color:isDark ? "#e5e7eb" : "#1a1612", margin:"0 0 0.25rem" }}>
                  {formData.name || "Your Name"}
                </h2>
                <p style={{ color:isDark ? "#9ca3af" : "#9e9890", fontSize:"0.8rem", margin:"0 0 1rem" }}>
                  {user?.email}
                </p>

                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1.25rem" }}>
                  <span className="badge" style={{ background:isDark ? "#374151" : "#fef9f0", color:isDark ? "#fbbf24" : "#c9a96e", border:`1px solid ${isDark ? "#4b5563" : "#f0d9a8"}`, justifyContent:"center" }}>
                    <SparklesIcon style={{ width:12, height:12 }} />
                    {roleLabel}
                  </span>
                  <span className="badge" style={{ background:isDark ? "#064e3b" : "#f0fdf4", color:isDark ? "#a7f3d0" : "#16a34a", border:`1px solid ${isDark ? "#10b981" : "#bbf7d0"}`, justifyContent:"center" }}>
                    <CheckCircleIcon style={{ width:12, height:12 }} />
                    Active
                  </span>
                </div>

                <div className="section-divider" style={{ margin:"1rem 0" }} />

                <div style={{ textAlign:"left", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  {[
                    { icon: BuildingOfficeIcon, label: "Department", val: formData.department || "—" },
                    { icon: BriefcaseIcon, label: "Position", val: formData.position || "—" },
                    { icon: CalendarIcon, label: "Joined", val: formatDate(formData.joinDate) },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:"0.6rem" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:isDark ? "#374151" : "#f5f2ee", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                        <Icon style={{ width:14, height:14, color:isDark ? "#9ca3af" : "#9e9890" }} />
                      </div>
                      <div>
                        <div className="field-label" style={{ marginBottom:1 }}>{label}</div>
                        <div style={{ fontSize:"0.82rem", color:isDark ? "#e5e7eb" : "#3d3525", fontWeight:500 }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ ...s.card, padding:"1.25rem" }}>
                <p style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#c9a96e", margin:"0 0 1rem" }}>
                  Leave at a glance
                </p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
                  <span style={{ fontSize:"0.8rem", color:"#8a8070" }}>Total balance</span>
                  <span style={{ ...s.heading, fontSize:"1.75rem", color:"#1a1612" }}>{totalLeave}</span>
                </div>
                <div className="leave-bar">
                  <div className="leave-bar-fill" style={{ width:`${Math.min((totalLeave / 30) * 100, 100)}%`, background:"linear-gradient(90deg,#c9a96e,#e8c98a)" }} />
                </div>
                <p style={{ fontSize:"0.75rem", color:"#9e9890", marginTop:"0.4rem" }}>
                  {totalLeave > 20 ? "Excellent balance!" : totalLeave > 10 ? "Good balance" : "Consider planning time off"}
                </p>
              </div>
            </div>

            {/* ─── RIGHT PANEL ─── */}
            <div style={s.card}>
              {/* Tab bar */}
              <div style={{ display:"flex", alignItems:"center", gap:"0.25rem", padding:"1.25rem 1.75rem 0", borderBottom:"1.5px solid #f0ede8" }}>
                <div style={{ display:"flex", gap:"0.25rem", flex:1 }}>
                  {TABS.map(t => (
                    <button key={t} className={`prof-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                {activeTab === "Overview" && (
                  !isEditing ? (
                    <button className="prof-btn-secondary" onClick={() => setIsEditing(true)} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <PencilIcon style={{ width:13, height:13 }} /> Edit
                    </button>
                  ) : (
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <button className="prof-btn-secondary" onClick={handleReset}>Cancel</button>
                      <button className="prof-btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* ── OVERVIEW TAB ── */}
              {activeTab === "Overview" && (
                <form onSubmit={handleSubmit} style={{ padding:"2rem 1.75rem" }}>
                  {/* Toast messages */}
                  {successMessage && (
                    <div className="toast-success slide-in" style={{ marginBottom:"1.5rem" }}>
                      <CheckCircleIcon style={{ width:18, height:18, color:"#16a34a", flexShrink:0 }} />
                      <span style={{ fontSize:"0.875rem", color:"#166534" }}>{successMessage}</span>
                    </div>
                  )}
                  {errorMessage && (
                    <div className="toast-error slide-in" style={{ marginBottom:"1.5rem" }}>
                      <XMarkIcon style={{ width:18, height:18, color:"#dc2626", flexShrink:0 }} />
                      <span style={{ fontSize:"0.875rem", color:"#991b1b" }}>{errorMessage}</span>
                    </div>
                  )}

                  {/* Personal section */}
                  <p style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#c9a96e", margin:"0 0 1.25rem" }}>
                    Personal Information
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"2rem" }}>
                    {/* Full name */}
                    <div>
                      <p className="field-label">Full Name</p>
                      {isEditing ? (
                        <input className="prof-input" style={s.input} type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" />
                      ) : (
                        <p className="field-value">{formData.name || "Not provided"}</p>
                      )}
                    </div>
                    {/* Email */}
                    <div>
                      <p className="field-label">Email Address</p>
                      <p className="field-value" style={{ color:isDark ? "#9ca3af" : "#9e9890" }}>{user?.email}</p>
                      {isEditing && <p style={{ fontSize:"0.72rem", color:isDark ? "#9ca3af" : "#c0b8ae", marginTop:3 }}>Cannot be changed</p>}
                    </div>
                    {/* Phone */}
                    <div>
                      <p className="field-label">Phone Number</p>
                      {isEditing ? (
                        <input className="prof-input" style={s.input} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 234 567 8900" />
                      ) : (
                        <p className="field-value">{formData.phone || "Not provided"}</p>
                      )}
                    </div>
                    {/* Join date */}
                    <div>
                      <p className="field-label">Join Date</p>
                      {isEditing ? (
                        <input className="prof-input" style={s.input} type="date" name="joinDate" value={formData.joinDate} onChange={handleInputChange} />
                      ) : (
                        <p className="field-value">{formatDate(formData.joinDate)}</p>
                      )}
                    </div>
                    {/* Avatar URL */}
                    <div style={{ gridColumn:"1/-1" }}>
                      <p className="field-label">Avatar URL</p>
                      {isEditing ? (
                        <input className="prof-input" style={s.input} type="url" name="avatar" value={formData.avatar} onChange={handleInputChange} placeholder="https://example.com/photo.jpg" />
                      ) : (
                        <p className="field-value" style={{ color:isDark ? "#9ca3af" : "#9e9890", fontSize:"0.83rem", wordBreak:"break-all" }}>
                          {formData.avatar || "No custom avatar set"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="section-divider" />

                  {/* Employment – read-only with request */}
                  <p style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#c9a96e", margin:"0 0 1.25rem" }}>
                    Employment Details
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>
                    {/* Department */}
                    <div>
                      <p className="field-label" style={{ display:"flex", alignItems:"center", gap:4 }}>
                        Department <LockClosedIcon style={{ width:10, height:10, color:isDark ? "#9ca3af" : "#c0b8ae" }} />
                      </p>
                      {isEditing ? (
                        <div style={{ position:"relative" }}>
                          <input style={s.inputReadOnly} value={formData.department} readOnly />
                          <button type="button" onClick={() => handleRequestUpdate("department")}
                            style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:isDark ? "#374151" : "#f5f2ee", border:`1px solid ${isDark ? "#4b5563" : "#e0d9cf"}`, borderRadius:50, padding:"2px 10px", fontSize:"0.7rem", fontWeight:600, color:isDark ? "#d1d5db" : "#8a8070", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                            Request
                          </button>
                        </div>
                      ) : (
                        <p className="field-value">{formData.department || "—"}</p>
                      )}
                    </div>
                    {/* Position */}
                    <div>
                      <p className="field-label" style={{ display:"flex", alignItems:"center", gap:4 }}>
                        Position <LockClosedIcon style={{ width:10, height:10, color:isDark ? "#9ca3af" : "#c0b8ae" }} />
                      </p>
                      {isEditing ? (
                        <div style={{ position:"relative" }}>
                          <input style={s.inputReadOnly} value={formData.position} readOnly />
                          <button type="button" onClick={() => handleRequestUpdate("position")}
                            style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:isDark ? "#374151" : "#f5f2ee", border:`1px solid ${isDark ? "#4b5563" : "#e0d9cf"}`, borderRadius:50, padding:"2px 10px", fontSize:"0.7rem", fontWeight:600, color:isDark ? "#d1d5db" : "#8a8070", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                            Request
                          </button>
                        </div>
                      ) : (
                        <p className="field-value">{formData.position || "—"}</p>
                      )}
                    </div>
                    {/* Role */}
                    <div>
                      <p className="field-label" style={{ display:"flex", alignItems:"center", gap:4 }}>
                        Role <LockClosedIcon style={{ width:10, height:10, color:isDark ? "#9ca3af" : "#c0b8ae" }} />
                      </p>
                      <p className="field-value">{roleLabel}</p>
                      <p style={{ fontSize:"0.72rem", color:isDark ? "#9ca3af" : "#c0b8ae", marginTop:3 }}>Assigned by administrator</p>
                    </div>
                    {/* Status */}
                    <div>
                      <p className="field-label">Account Status</p>
                      <span className="badge" style={{ background:isDark ? "#064e3b" : "#f0fdf4", color:isDark ? "#a7f3d0" : "#16a34a", border:`1px solid ${isDark ? "#10b981" : "#bbf7d0"}` }}>
                        <CheckCircleIcon style={{ width:11, height:11 }} /> Active
                      </span>
                    </div>
                  </div>
                </form>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === "Security" && (
                <div style={{ padding:"2rem 1.75rem" }}>
                  <p style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#c9a96e", margin:"0 0 1.5rem" }}>
                    Password & Security
                  </p>

                  <div style={{ ...s.card, padding:"1.5rem", background:"#fdfcfb", border:"1.5px solid #f0ede8", boxShadow:"none", marginBottom:"1.5rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:"#fef9f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <LockClosedIcon style={{ width:20, height:20, color:"#c9a96e" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:600, color:"#1a1612", fontSize:"0.95rem", margin:0 }}>Change your password</p>
                        <p style={{ fontSize:"0.82rem", color:"#9e9890", margin:"2px 0 0" }}>Use at least 8 characters with a mix of letters and numbers</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.25rem", maxWidth:440 }}>
                    {successMessage && (
                      <div className="toast-success slide-in">
                        <CheckCircleIcon style={{ width:18, height:18, color:"#16a34a", flexShrink:0 }} />
                        <span style={{ fontSize:"0.875rem", color:"#166534" }}>{successMessage}</span>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="toast-error slide-in">
                        <XMarkIcon style={{ width:18, height:18, color:"#dc2626", flexShrink:0 }} />
                        <span style={{ fontSize:"0.875rem", color:"#991b1b" }}>{errorMessage}</span>
                      </div>
                    )}

                    {/* New password */}
                    <div>
                      <p className="field-label">New Password</p>
                      <div style={{ position:"relative" }}>
                        <input
                          className="prof-input"
                          style={s.input}
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Min. 8 characters"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9e9890", display:"flex" }}>
                          {showPassword ? <EyeSlashIcon style={{ width:16, height:16 }} /> : <EyeIcon style={{ width:16, height:16 }} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm */}
                    <div>
                      <p className="field-label">Confirm Password</p>
                      <div style={{ position:"relative" }}>
                        <input
                          className="prof-input"
                          style={s.input}
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Re-enter your new password"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9e9890", display:"flex" }}>
                          {showConfirmPassword ? <EyeSlashIcon style={{ width:16, height:16 }} /> : <EyeIcon style={{ width:16, height:16 }} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="prof-btn-primary"
                        disabled={loading || !formData.password}
                        onClick={() => setUpdatePassword(true)}
                      >
                        {loading ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── LEAVE BALANCE TAB ── */}
              {activeTab === "Leave Balance" && (
                <div style={{ padding:"2rem 1.75rem" }}>
                  <p style={{ fontSize:"0.7rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"#c9a96e", margin:"0 0 1.5rem" }}>
                    Leave Entitlements
                  </p>

                  {user?.leaveBalances ? (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"1rem" }}>
                      {Object.entries(user.leaveBalances).map(([leaveType, balance], idx) => {
                        const palette = LEAVE_COLORS[idx % LEAVE_COLORS.length];
                        const pct = Math.min((balance / 15) * 100, 100);
                        return (
                          <div key={leaveType} style={{ background:palette.bg, border:`1.5px solid ${palette.bar}22`, borderRadius:16, padding:"1.25rem" }}>
                            <p style={{ fontSize:"0.75rem", fontWeight:600, color:palette.text, margin:"0 0 0.5rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
                              {formatLeaveType(leaveType)}
                            </p>
                            <p style={{ fontFamily:"'Fraunces',serif", fontSize:"2.25rem", color:"#1a1612", margin:"0 0 0.5rem", fontWeight:300, lineHeight:1 }}>
                              {balance}
                              <span style={{ fontSize:"0.9rem", color:"#9e9890", fontFamily:"'DM Sans',sans-serif", marginLeft:4 }}>days</span>
                            </p>
                            <div className="leave-bar" style={{ background:`${palette.bar}25` }}>
                              <div className="leave-bar-fill" style={{ width:`${pct}%`, background:palette.bar }} />
                            </div>
                            {balance === 0 && (
                              <p style={{ fontSize:"0.72rem", color:palette.text, marginTop:6, opacity:0.8 }}>
                                Contact HR to request more days
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign:"center", padding:"3rem 0", color:"#9e9890" }}>
                      <ChartBarIcon style={{ width:40, height:40, margin:"0 auto 0.75rem", color:"#d4cec6" }} />
                      <p style={{ fontWeight:500 }}>No leave balance data</p>
                      <p style={{ fontSize:"0.82rem" }}>Contact HR for assistance</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── REQUEST MODAL ── */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.25rem" }}>
              <div>
                <h3 style={{ ...s.heading, fontSize:"1.4rem", color:"#1a1612", margin:0 }}>
                  Request {requestType === "department" ? "Department" : "Position"} Update
                </h3>
                <p style={{ fontSize:"0.82rem", color:"#9e9890", marginTop:4 }}>HR will review within 3–5 business days</p>
              </div>
              <button onClick={() => setShowRequestModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9e9890", padding:0 }}>
                <XMarkIcon style={{ width:20, height:20 }} />
              </button>
            </div>

            <div style={{ marginBottom:"1.25rem" }}>
              <p className="field-label">Reason for change</p>
              <textarea
                value={requestDetails}
                onChange={e => setRequestDetails(e.target.value)}
                className="prof-input"
                style={{ ...s.input, resize:"vertical", minHeight:100 }}
                placeholder={`Describe why you need a ${requestType} update…`}
              />
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem" }}>
              <button className="prof-btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
              <button className="prof-btn-primary" onClick={submitUpdateRequest}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;