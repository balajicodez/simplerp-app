import React, { useEffect, useState } from "react";
import { APP_SERVER_URL_PREFIX } from "../constants";
import { useNavigate } from "react-router-dom";
import Sidebar from "../_components/sidebar/Sidebar";
import PageCard from "../_components/PageCard";
import "./Roles.css";
import DefaultAppSidebarLayout from "../_components/default-app-sidebar-layout/DefaultAppSidebarLayout";

export default function Roles() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]); // For create form
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [modalSelectedPermissions, setModalSelectedPermissions] = useState([]); // For modal only

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }

      const data = await response.json();
      setRoles(data._embedded?.roles || data || []);
      setError("");
    } catch (err) {
      setError("Failed to load roles: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data._embedded?.permissions || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/roles/${roleId}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const permissionIds =
          data._embedded?.permissions?.map((p) => p.id) ||
          data?.map((p) => p.id) ||
          [];
        setModalSelectedPermissions(permissionIds);
      }
    } catch (err) {
      console.error("Failed to fetch role permissions", err);
      setModalSelectedPermissions([]);
    }
  };

  const validateRoleName = (roleName) => {
    if (!roleName.startsWith("ROLE_")) {
      return "Role must start with ROLE_";
    }
    if (roleName.length < 6) {
      return "Role name must be at least 6 characters";
    }
    return null;
  };

  const createRole = async () => {
    const validationError = validateRoleName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || null,
          permissionIds: selectedPermissions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create role");
      }

      setSuccess("Role created successfully!");
      setName("");
      setDescription("");
      setSelectedPermissions([]);
      setShowForm(false);
      fetchRoles();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async () => {
    const validationError = validateRoleName(editName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/roles/${editingRole.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            description: editDescription || null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update role");
      }

      setSuccess("Role updated successfully!");
      setEditingRole(null);
      setEditName("");
      setEditDescription("");
      fetchRoles();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id, roleName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete role "${roleName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/roles/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete role");
      }

      setSuccess("Role deleted successfully!");
      fetchRoles();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const assignPermissions = async (roleId) => {
    try {
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/roles/${roleId}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissionIds: modalSelectedPermissions,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign permissions");
      }

      setSuccess("Permissions assigned successfully!");
      setShowPermissionModal(false);
      setModalSelectedPermissions([]);
      setEditingRole(null);
      fetchRoles();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to assign permissions");
    }
  };

  const openPermissionModal = async (role) => {
    setEditingRole(role);
    setShowPermissionModal(true);
    // Fetch permissions for this role and set them
    await fetchRolePermissions(role.id);
  };

  const handlePermissionToggle = (permissionId, isModal = false) => {
    if (isModal) {
      setModalSelectedPermissions((prev) =>
        prev.includes(permissionId)
          ? prev.filter((id) => id !== permissionId)
          : [...prev, permissionId]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(permissionId)
          ? prev.filter((id) => id !== permissionId)
          : [...prev, permissionId]
      );
    }
  };

  const startEdit = (role) => {
    setEditingRole(role);
    setEditName(role.name);
    setEditDescription(role.description || "");
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditName("");
    setEditDescription("");
    setError("");
  };

  const cancelCreate = () => {
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setShowForm(false);
    setError("");
  };

  const filteredRoles = searchTerm
    ? roles.filter(
        (role) =>
          role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : roles;

  const totalRoles = roles.length;

  return (
      <DefaultAppSidebarLayout pageTitle={'User Administration'}>
      <PageCard title="Role Management">
        <div className="dashboard-header1">
          <div className="header-content">
            <div></div>
            <div className="header-buttons">
              <button
                className="btn-secondary"
                onClick={() => navigate("/permissions")}
              >
                🔐 Manage Permissions
              </button>
              <button
                className="btn-primary1"
                onClick={() => setShowForm(true)}
                disabled={loading || editingRole}
              >
                <span className="btn-icon">+</span>
                Create New Role
              </button>
            </div>
          </div>

          <div className="stats-grid1">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{totalRoles}</div>
                <div className="stat-label">Total Roles</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{permissions.length}</div>
                <div className="stat-label">Available Permissions</div>
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

        {/* Create New Role Form with Permissions */}
        {(showForm || editingRole) && !showPermissionModal && (
          <div className="role-form-section">
            <h3 className="form-title">
              {editingRole ? "Edit Role" : "Create New Role"}
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="roleName">
                  Role Name <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <input
                  id="roleName"
                  type="text"
                  className="form-input1"
                  style={{ width: "400px" }}
                  placeholder="ROLE_ADMIN"
                  value={editingRole ? editName : name}
                  onChange={(e) =>
                    editingRole
                      ? setEditName(e.target.value)
                      : setName(e.target.value)
                  }
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="roleDescription">Description</label>
                <textarea
                  id="roleDescription"
                  className="form-textarea"
                  style={{ height: "18px" }}
                  placeholder="Enter role description (optional)"
                  value={editingRole ? editDescription : description}
                  onChange={(e) =>
                    editingRole
                      ? setEditDescription(e.target.value)
                      : setDescription(e.target.value)
                  }
                  disabled={loading}
                  rows="3"
                />
              </div>

              {!editingRole && (
                <div className="form-group full-width">
                  <label className="permission-selection-label">
                    Assign Permissions
                  </label>

                  <div className="permission-selection-container">
                    {permissions.length > 0 ? (
                      <div className="permissions-grid">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="permission-option"
                          >
                            <input
                              type="checkbox"
                              value={permission.id}
                              checked={selectedPermissions.includes(
                                permission.id
                              )}
                              onChange={() =>
                                handlePermissionToggle(permission.id, false)
                              }
                            />
                            <span
                              className="permission-text"
                              style={{ cursor: "default", marginLeft: "8px" }}
                            >
                              <span className="permission-name">
                                {permission.name}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-permissions-message">
                        <p>
                          No permissions available. Create permissions first.
                        </p>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => navigate("/permissions")}
                        >
                          Go to Permissions
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedPermissions.length > 0 && (
                    <div className="selected-permissions-summary">
                      <strong>
                        Selected Permissions ({selectedPermissions.length}):
                      </strong>
                      <div className="selected-permissions-list">
                        {permissions
                          .filter((p) => selectedPermissions.includes(p.id))
                          .map((p) => (
                            <span
                              key={p.id}
                              className="selected-permission-tag"
                            >
                              {p.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn-secondary"
                onClick={editingRole ? cancelEdit : cancelCreate}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={editingRole ? updateRole : createRole}
                disabled={loading || (!editingRole && !name.trim())}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    {editingRole ? "Updating..." : "Creating..."}
                  </>
                ) : editingRole ? (
                  "Update Role"
                ) : (
                  "Create Role"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Permission Management Modal */}
        {showPermissionModal && editingRole && (
          <div className="permission-modal-overlay">
            <div className="permission-modal">
              <div className="modal-header">
                <h3>Manage Permissions: {editingRole.name}</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setEditingRole(null);
                    setModalSelectedPermissions([]);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="permissions-list">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="permission-option">
                      <input
                        type="checkbox"
                        checked={modalSelectedPermissions.includes(
                          permission.id
                        )}
                        onChange={() =>
                          handlePermissionToggle(permission.id, true)
                        }
                      />
                      <span
                        className="permission-name"
                        style={{ cursor: "default", marginLeft: "8px" }}
                      >
                        {permission.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setEditingRole(null);
                    setModalSelectedPermissions([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => assignPermissions(editingRole.id)}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!showForm && !editingRole && !showPermissionModal && (
          <>
            <div className="filters-section1">
              <div className="filters-grid">
                <div className="filter-group">
                  <input
                    type="text"
                    placeholder="Search roles by name or description..."
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
                Found {filteredRoles.length} roles matching "{searchTerm}"
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
                <p>Loading roles...</p>
              </div>
            ) : (
              <>
                <div className="table-container1">
                  <table className="modern-table1">
                    <thead>
                      <tr>
                        <th>Role Name</th>
                        <th>Description</th>
                        <th>Permissions</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="no-data">
                            <div className="no-data-content">
                              <div className="no-data-icon">🎭</div>
                              <p>
                                {searchTerm
                                  ? `No roles found for "${searchTerm}"`
                                  : "No roles found. Create your first role to get started."}
                              </p>
                              {!searchTerm && (
                                <button
                                  className="btn-secondary"
                                  onClick={() => setShowForm(true)}
                                >
                                  Create Role
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRoles.map((role) => (
                          <tr key={role.id} className="table-row">
                            <td className="role-name-cell">
                              <div className="role-badge">{role.name}</div>
                            </td>
                            <td className="role-description-cell">
                              {role.description || (
                                <span className="no-description">
                                  No description
                                </span>
                              )}
                            </td>
                            <td className="permissions-cell">
                              <div className="permissions-preview">
                                {role.permissions &&
                                role.permissions.length > 0 ? (
                                  <>
                                    {role.permissions.slice(0, 2).map((p) => (
                                      <span
                                        key={p.id}
                                        className="permission-tag"
                                      >
                                        {p.name}
                                      </span>
                                    ))}
                                    {role.permissions.length > 2 && (
                                      <span className="more-permissions">
                                        +{role.permissions.length - 2} more
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="no-permissions">
                                    No permissions
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="action-buttons">
                                <button
                                  className="btn-action btn-edit"
                                  onClick={() => startEdit(role)}
                                  title="Edit Role"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn-action btn-permissions"
                                  onClick={() => openPermissionModal(role)}
                                  title="Manage Permissions"
                                >
                                  🔐
                                </button>
                                <button
                                  className="btn-action btn-delete"
                                  onClick={() => deleteRole(role.id, role.name)}
                                  title="Delete Role"
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
              </>
            )}
          </>
        )}
      </PageCard>
      </DefaultAppSidebarLayout>
  );
}
