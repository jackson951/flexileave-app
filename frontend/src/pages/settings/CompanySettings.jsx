import React, { useState, useContext } from "react";
import { useTenant } from "../../contexts/TenantContext";
import { ApiService } from "../../api/web-api-service";
import { toast } from "react-toastify";

const CompanySettings = () => {
  const { tenant, updateTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    primaryColor: tenant?.primaryColor || "#4f46e5",
    secondaryColor: tenant?.secondaryColor || "#7c3aed",
  });
  const [logoFile, setLogoFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      if (formData.name !== tenant?.name) {
        formDataToSend.append('name', formData.name);
      }
      if (formData.primaryColor !== tenant?.primaryColor) {
        formDataToSend.append('primaryColor', formData.primaryColor);
      }
      if (formData.secondaryColor !== tenant?.secondaryColor) {
        formDataToSend.append('secondaryColor', formData.secondaryColor);
      }
      
      // Add logo file if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await ApiService.put("/tenants/update", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      updateTenant(response.data.tenant);
      toast.success("Company settings updated successfully!");
    } catch (error) {
      console.error("Failed to update company settings:", error);
      toast.error("Failed to update company settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Company Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Update your company's branding and appearance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {tenant?.logoUrl && (
              <img 
                src={tenant.logoUrl} 
                alt="Company Logo" 
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter company name"
              />
            </div>
            
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="form-input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                />
                {logoFile && (
                  <span className="text-sm text-gray-600 dark:text-gray-200">
                    {logoFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
              </p>
            </div>
          </div>

          {/* Color Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 dark:border-gray-700 rounded-lg p-1 cursor-pointer bg-white dark:bg-gray-800"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="form-input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="#4f46e5"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                This color will be used for primary buttons and accents.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 dark:border-gray-700 rounded-lg p-1 cursor-pointer bg-white dark:bg-gray-800"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="form-input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="#7c3aed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                This color will be used for secondary elements and gradients.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Preview
            </h3>
            <div
              className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              style={{
                '--primary-color': formData.primaryColor,
                '--secondary-color': formData.secondaryColor,
              }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-lg p-1 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                  }}
                >
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : (tenant?.logoUrl || "/placeholder-logo.png")}
                    alt="Preview Logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {formData.name || "Company Name"}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Leave Management System
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  className="btn-primary px-6 py-2 rounded-xl font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                  }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-xl font-semibold hover:border-primary-color transition-colors"
                  style={{
                    borderColor: formData.primaryColor,
                    color: formData.primaryColor,
                  }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
