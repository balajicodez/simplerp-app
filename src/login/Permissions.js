import React, { useEffect, useState } from "react";
import { APP_SERVER_URL_PREFIX } from "../constants";
import { useNavigate } from "react-router-dom";
import Sidebar from "../_components/sidebar/Sidebar";
import PageCard from "../_components/PageCard";
import "./Permissions.css"
import DefaultAppSidebarLayout from "../_components/default-app-sidebar-layout/DefaultAppSidebarLayout";

export default function Permissions() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [editingPermission, setEditingPermission] = useState(null);
  const [editName, setEditName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      setPermissions(data._embedded?.permissions || data || []);
      setError("");
    } catch (err) {
      setError("Failed to load permissions: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validatePermissionName = (permissionName) => {
    // if (!permissionName) {
    //   return "Permission name is required";
    // }
    if (permissionName.length < 3) {
      return "Permission name must be at least 3 characters";
    }
    // if (!/^[A-Z_]+$/.test(permissionName)) {
    //   return "Permission name can only contain uppercase letters and underscores";
    // }
    return null;
  };

  const createPermission = async () => {
    const validationError = validatePermissionName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create permission");
      }

      setSuccess("Permission created successfully!");
      setName("");
      setShowForm(false);
      fetchPermissions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to create permission");
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async () => {
    const validationError = validatePermissionName(editName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/permissions/${editingPermission.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: editName }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update permission");
      }

      setSuccess("Permission updated successfully!");
      setEditingPermission(null);
      setEditName("");
      fetchPermissions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update permission");
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (id, permissionName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete permission "${permissionName}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/permissions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete permission");
      }

      setSuccess("Permission deleted successfully!");
      fetchPermissions();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete permission");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (permission) => {
    setEditingPermission(permission);
    setEditName(permission.name);
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingPermission(null);
    setEditName("");
    setError("");
  };

  const cancelCreate = () => {
    setName("");
    setShowForm(false);
    setError("");
  };

  const filteredPermissions = searchTerm
    ? permissions.filter((permission) =>
        permission.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : permissions;

  const totalPermissions = permissions.length;

  return (
      <DefaultAppSidebarLayout pageTitle={'User Administration'}>
      <PageCard title="Permission Management">
        <div className="dashboard-header1">
          <div className="header-content">
            <div></div>
            <button
              className="btn-primary1"
              onClick={() => setShowForm(true)}
              disabled={loading || editingPermission}
            >
              <span className="btn-icon">+</span>
              Create New Permission
            </button>
          </div>

          <div className="stats-grid1">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{totalPermissions}</div>
                <div className="stat-label">Total Permissions</div>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">!</span>
            {error}
          </div>
        )}

        {(showForm || editingPermission) && (
          <div className="permission-form-section">
            <h3 className="form-title">
              {editingPermission ? "Edit Permission" : "Create New Permission"}
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="permissionName">
                  Permission Name *
                  {/* <span className="hint">
                    Use uppercase letters and underscores (e.g., READ_USERS)
                  </span> */}
                </label>
                <input
                  id="permissionName"
                  type="text"
                  className="form-input"
                  placeholder="READ_USERS"
                  value={editingPermission ? editName : name}
                  onChange={(e) =>
                    editingPermission
                      ? setEditName(e.target.value)
                      : setName(e.target.value)
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={editingPermission ? cancelEdit : cancelCreate}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={
                  editingPermission ? updatePermission : createPermission
                }
                disabled={loading || (!editingPermission && !name.trim())}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    {editingPermission ? "Updating..." : "Creating..."}
                  </>
                ) : editingPermission ? (
                  "Update Permission"
                ) : (
                  "Create Permission"
                )}
              </button>
            </div>
          </div>
        )}

        {!showForm && !editingPermission && (
          <>
            <div className="filters-section1">
              <div className="filters-grid">
                <div className="filter-group">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {searchTerm && (
              <div className="search-results-info">
                Found {filteredPermissions.length} permissions matching "
                {searchTerm}"
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                  disabled={loading}
                >
                  Clear search
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading permissions...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Permission Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermissions.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="no-data">
                          <div className="no-data-content">
                            <div className="no-data-icon">🔐</div>
                            <p>
                              {searchTerm
                                ? `No permissions found for "${searchTerm}"`
                                : "No permissions found"}
                            </p>
                            {!searchTerm && (
                              <button
                                className="btn-secondary"
                                onClick={() => setShowForm(true)}
                              >
                                Create Permission
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPermissions.map((permission) => (
                        <tr key={permission.id} className="table-row">
                          <td className="permission-name-cell">
                            <div className="permission-badge">
                              {permission.name}
                            </div>
                          </td>
                          <td className="actions-cell">
                            <div className="action-buttons">
                              <button
                                className="btn-action btn-edit"
                                onClick={() => startEdit(permission)}
                                title="Edit Permission"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-action btn-delete"
                                onClick={() =>
                                  deletePermission(
                                    permission.id,
                                    permission.name
                                  )
                                }
                                title="Delete Permission"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </PageCard>
      </DefaultAppSidebarLayout>
  );
}
