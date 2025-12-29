import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import RegisterPage from "./Register";
import { APP_SERVER_URL_PREFIX } from "../constants";
import "./Users.css";

const UsersPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageParam, setPageParam] = useState(0);
  const [sizeParam, setSizeParam] = useState(10);
  const [links, setLinks] = useState({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, [pageParam, sizeParam, selectedOrgId, fromDate, toDate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      let url = `${APP_SERVER_URL_PREFIX}/users?page=${pageParam}&size=${sizeParam}`;

      if (selectedOrgId) {
        url += `&organizationId=${selectedOrgId}`;
      }

      if (fromDate) {
        url += `&fromDate=${fromDate}`;
      }

      if (toDate) {
        url += `&toDate=${toDate}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();

      // Handle different response formats
      const usersList = data._embedded?.users || data.users || data || [];
      const linksData = data._links || {};

      setUsers(usersList);
      setLinks(linksData);
      setTotalUsers(data.totalItems || usersList.length);

      // Calculate active users
      const activeCount = usersList.filter((user) => user.active).length;
      setTotalActive(activeCount);

      setError("");
    } catch (err) {
      setError("Failed to load users: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleDeleteUser = async (userId, username) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${username}"?`)
    ) {
      return;
    }

    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(
        `${APP_SERVER_URL_PREFIX}/users/${userId}/toggle-status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ active: !currentStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update user status");

      fetchUsers();
      alert("User status updated successfully");
    } catch (err) {
      alert("Error updating user status: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleOrganizationChange = (e) => {
    setSelectedOrgId(e.target.value);
    setPageParam(0);
  };

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.organizationId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  if (showCreateForm) {
    return (
      <RegisterPage
        onSuccess={() => {
          setShowCreateForm(false);
          fetchUsers();
        }}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="User Management">
        <div className="dashboard-header1">
          <div className="header-content">
            <div></div>
            <button
              className="btn-primary1"
              onClick={() => setShowCreateForm(true)}
            >
              <span className="btn-icon">+</span>
              Create New User
            </button>
          </div>

          <div className="stats-grid1">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{totalActive}</div>
                <div className="stat-label">Active Users</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-value">{organizations.length}</div>
                <div className="stat-label">Organizations</div>
              </div>
            </div>
          </div>
        </div>

        <div className="filters-section1">
          <div className="filters-grid">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input1"
              />
            </div>

            <div className="filter-group">
              <select
                value={selectedOrgId}
                onChange={handleOrganizationChange}
                className="filter-select"
              >
                <option value="">All Branches</option>
                {organizations.map((org) => (
                  <option
                    key={org.id || org._links?.self?.href}
                    value={org.id || org._links?.self?.href.split("/").pop()}
                  >
                    {org.name || org.organizationId || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            {/* <div className="filter-group">
              <label>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPageParam(0);
                }}
                className="filter-select"
              />
            </div>

            <div className="filter-group">
              <label>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPageParam(0);
                }}
                className="filter-select"
              />
            </div> */}

            <div className="filter-group">
              <select
                value={sizeParam}
                onChange={(e) => {
                  setSizeParam(parseInt(e.target.value));
                  setPageParam(0);
                }}
                className="filter-select"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="search-results-info">
            Found {filteredUsers.length} users matching "{searchTerm}"
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </button>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* Data Table */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>OrganizationId</th>
                    <th>Roles</th>
                    <th>Status</th>
                    {/* <th>Created Date</th> */}
                    {/* <th>Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">👥</div>
                          <p>
                            {searchTerm
                              ? `No users found for "${searchTerm}"`
                              : "No users found"}
                          </p>
                          {searchTerm && (
                            <button
                              className="btn-secondary"
                              onClick={() => setSearchTerm("")}
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="table-row">
                        <td className="user-cell">
                          <div className="user-avatar-small">
                            {user.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="user-info1">
                            <div className="user-name">{user.username}</div>
                            {user.email && (
                              <div className="user-email">{user.email}</div>
                            )}
                          </div>
                        </td>

                        <td className="organization-cell">
                          {user.organizationName || "Default"}
                        </td>

                        <td className="roles-cell">
                          <div className="roles-list">
                            {(user.roles || []).map((role, index) => (
                              <span key={index} className="role-tag">
                                {role.name || role}
                              </span>
                            ))}
                            {(!user.roles || user.roles.length === 0) && (
                              <span className="role-tag empty">No roles</span>
                            )}
                          </div>
                        </td>

                        <td className="status-cell">
                          <span
                            className={`status-badge ${
                              user.active ? "active" : "inactive"
                            }`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* <td className="date-cell">
                          {formatDate(user.createdDate)}
                        </td> */}

                        {/* <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => navigate(`/users/edit/${user.id}`)}
                              title="Edit User"
                            >
                              ✏️
                            </button>
                            <button
                              className={`btn-action btn-toggle ${
                                user.active ? "deactivate" : "activate"
                              }`}
                              onClick={() =>
                                toggleUserStatus(user.id, user.active)
                              }
                              title={user.active ? "Deactivate" : "Activate"}
                            >
                              {user.active ? "⏸️" : "▶️"}
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() =>
                                handleDeleteUser(user.id, user.username)
                              }
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {filteredUsers.length} of {totalUsers} users • Page{" "}
                  {pageParam + 1}
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn-outline"
                    disabled={pageParam === 0}
                    onClick={() => {
                      if (links.prev) {
                        // Handle HATEOAS link
                        setPageParam((prev) => Math.max(0, prev - 1));
                      } else {
                        setPageParam((prev) => Math.max(0, prev - 1));
                      }
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    className="btn-outline"
                    disabled={filteredUsers.length < sizeParam}
                    onClick={() => {
                      if (links.next) {
                        // Handle HATEOAS link
                        setPageParam((prev) => prev + 1);
                      } else {
                        setPageParam((prev) => prev + 1);
                      }
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
};

export default UsersPage;
