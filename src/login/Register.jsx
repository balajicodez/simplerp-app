import React, { useState, useEffect } from "react";
import { APP_SERVER_URL_PREFIX } from "../constants";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import "./Register.css";

const RegisterPage = ({ onSuccess, onCancel }) => {
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    organizationId: "",
    roleNames: [],
    email: "",
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const list = data._embedded?.roles || data || [];
      setRoles(list);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const orgsList = data._embedded?.organizations || data || [];
        setOrganizations(orgsList);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      const roleName = value;
      setFormData((prev) => ({
        ...prev,
        roleNames: checked
          ? [...prev.roleNames, roleName]
          : prev.roleNames.filter((r) => r !== roleName),
      }));
      return;
    }

    // Check password strength
    if (name === "password") {
      checkPasswordStrength(value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.roleNames.length === 0) {
      setError("At least one role must be selected");
      return false;
    }

    if (passwordStrength < 3) {
      setError(
        "Password is too weak. Include uppercase, numbers, and special characters."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${APP_SERVER_URL_PREFIX}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          organizationId: formData.organizationId || "DEFAULT_ORG",
          roleNames: formData.roleNames,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setSuccess("User created successfully!");

      // Clear form
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        organizationId: "",
        roleNames: [],
        email: "",
      });

      // Call success callback after delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return "transparent";
    if (passwordStrength <= 1) return "#ff4444";
    if (passwordStrength === 2) return "#ffbb33";
    if (passwordStrength === 3) return "#00C851";
    return "#00C851";
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Create New User">
        <div className="create-user-container">
          <div className="create-user-header">
            <h2 style={{ marginTop: "-10px" }}>Create New User Account</h2>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    id="username"
                    name="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <div className="helper-text">Username must be unique</div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                  <div className="helper-text">
                    Optional email for notifications
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter password (min 8 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />

                  {formData.password && (
                    <div className="password-strength">
                      <div className="strength-meter">
                        <div
                          className="strength-bar"
                          style={{
                            width: `${passwordStrength * 25}%`,
                            backgroundColor: getStrengthColor(),
                          }}
                        ></div>
                      </div>
                      <div className="strength-label">
                        {passwordStrength === 0 && "No password"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Fair"}
                        {passwordStrength === 3 && "Good"}
                        {passwordStrength === 4 && "Strong"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <div className="helper-text">
                    Must match the password above
                  </div>
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3 className="section-title">Organization & Roles</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="organizationId">Organization</label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Organization</option>
                    <option value="DEFAULT_ORG">Default Organization</option>
                    {organizations.map((org) => (
                      <option
                        key={org.id || org._links?.self?.href}
                        value={
                          org.id || org._links?.self?.href.split("/").pop()
                        }
                      >
                        {org.name || org.organizationId || "Unknown"}
                      </option>
                    ))}
                  </select>
                  <div className="helper-text">
                    Select an organization or leave as default
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="roles-label">Assign Roles *</label>
                <div className="roles-container">
                  <div className="roles-grid1">
                    {roles.map((r) => (
                      <label key={r.id} className="role-option">
                        <input
                          type="checkbox"
                          value={r.name}
                          checked={formData.roleNames.includes(r.name)}
                          onChange={handleInputChange}
                          className="role-checkbox"
                        />
                        <span className="custom-checkbox"></span>
                        <span className="role-text">
                          <span className="role-name">{r.name}</span>
                          {r.description && (
                            <span className="role-description">
                              {r.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.roleNames.length === 0 && (
                    <div className="error-message">
                      Please select at least one role for the user
                    </div>
                  )}
                  {formData.roleNames.length > 0 && (
                    <div className="selected-roles">
                      <strong>Selected roles:</strong>{" "}
                      {formData.roleNames.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary-large"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-large"
                disabled={loading || formData.roleNames.length === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Creating User...
                  </>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </PageCard>
    </div>
  );
};

export default RegisterPage;
