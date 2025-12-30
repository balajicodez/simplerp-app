import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import "./Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    organizationId: "",
    roleNames: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizations, setOrganizations] = useState([
    { id: 1, name: "Organization A" },
    { id: 2, name: "Organization B" },
    { id: 3, name: "Organization C" },
  ]);
  const [availableRoles] = useState([
    { name: "ADMIN", description: "Full system access" },
    { name: "MANAGER", description: "Management privileges" },
    { name: "USER", description: "Standard user access" },
    { name: "VIEWER", description: "Read-only access" },
  ]);

  const navigate = useNavigate();

  const validate = () => {
    if (!formData.username.trim()) return "Username is required";
    if (!formData.username.includes("@"))
      return "Please enter a valid email address as username";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.organizationId) return "Please select an organization";
    if (formData.roleNames.length === 0)
      return "Please select at least one role";
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleRoleChange = (roleName) => {
    setFormData((prev) => {
      const newRoles = prev.roleNames.includes(roleName)
        ? prev.roleNames.filter((r) => r !== roleName)
        : [...prev.roleNames, roleName];
      return { ...prev, roleNames: newRoles };
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        organizationId: parseInt(formData.organizationId),
        roleNames: formData.roleNames,
      };

      const response = await fetch(`${APP_SERVER_URL_PREFIX}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data || "Registration failed");
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/logout");
  };

  React.useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  return (
    <div className="signup-page">
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>

      <div className="signup-card">
        {/* <div className="brand">
          <img src={logo} alt="SimplERP logo" />
          <h3>Create New Account</h3>
          <p className="subtitle">Join SimplERP - Sri Divya Sarees</p>
        </div> */}

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">
              Email (Username) <span className="required">*</span>
            </label>
            <input
              id="username"
              name="username"
              type="email"
              value={formData.username}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="username"
              disabled={loading}
              required
            />
            <div className="hint">This will be your login username</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <div className="password-input">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
              <div className="hint">Minimum 6 characters</div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="organizationId">
              Organization <span className="required">*</span>
            </label>
            <select
              id="organizationId"
              name="organizationId"
              value={formData.organizationId}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* <div className="form-group">
            <label>
              Roles <span className="required">*</span>
            </label>
            <div className="roles-grid">
              {availableRoles.map((role) => (
                <div
                  key={role.name}
                  className={`role-card ${
                    formData.roleNames.includes(role.name) ? "selected" : ""
                  }`}
                  onClick={() => handleRoleChange(role.name)}
                >
                  <div className="role-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.roleNames.includes(role.name)}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                  <div className="role-content">
                    <div className="role-name">{role.name}</div>
                    <div className="role-description">{role.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" role="alert">
              {success}
            </div>
          )}

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Create Account"}
          </button>

          <div className="login-redirect">
            Already have an account?
            <button
              type="button"
              className="login-link"
              onClick={handleLoginRedirect}
              disabled={loading}
            >
              Login here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
