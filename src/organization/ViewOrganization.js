import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate } from "react-router-dom";
import "./Organization.css";

function ViewOrganization() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const bearerToken = localStorage.getItem("token");
    console.log(bearerToken);
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setOrgs(data._embedded ? data._embedded.organizations || [] : data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch organizations");
        setLoading(false);
      });
  }, []);

  const filteredOrgs = orgs.filter(
    (org) =>
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.gstn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) =>
    status === "Active" ? "#10b981" : "#ef4444";

  // ✅ ADDED – SAFE ID RESOLVER (Spring Data REST)
  const getOrgId = (org) => org.id || org._links?.self?.href?.split("/").pop();

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Branch Management">
        <div className="dashboard-header1">
          <div className="header-content">
            <div></div>
            <button
              className="btn-primary1"
              onClick={() => navigate("/organization/create")}
            >
              <span className="btn-icon">+</span>
              Create Branch
            </button>
          </div>
          
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              {/* <div className="stat-icon">🏢</div> */}
              <div className="stat-content">
                <div className="stat-value">{orgs.length}</div>
                <div className="stat-label">Total Branches</div>
              </div>
            </div>
            <div className="stat-card">
              {/* <div className="stat-icon">🟢</div> */}
              <div className="stat-content">
                <div className="stat-value">
                  {orgs.filter(org => org.status === 'Active').length}
                </div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card">
              {/* <div className="stat-icon">🔴</div> */}
              <div className="stat-content">
                <div className="stat-value">
                  {orgs.filter(org => org.status === 'Inactive').length}
                </div>
                <div className="stat-label">Inactive</div>
              </div>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <input
            type="text"
            placeholder="Search Branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-state">Loading organizations...</div>
        ) : (
          <div className="table-container">
            <table className="modern-table organizations-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Registration</th>
                  <th>Tax Details</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  {/* ✅ ADDED */}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrgs.map((org, idx) => (
                  <tr key={idx}>
                    <td>{org.name}</td>
                    <td>{org.registrationNo || "-"}</td>
                    <td>{org.gstn || org.pan || "-"}</td>
                    <td>{org.contact || "-"}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(org.status) }}
                      >
                        {org.status}
                      </span>
                    </td>

                    {/* ✅ ADDED */}
                    <td>
                      <button
                        className="btn-outline"
                        onClick={() =>
                          navigate(`/organization/edit/${getOrgId(org)}`)
                        }
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
}

export default ViewOrganization;
