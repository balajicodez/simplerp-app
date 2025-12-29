import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import "./CreateDayClosing.css";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import Utils from '../Utils';

function DayClosing() {
  const [items, setItems] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [success, setSuccess] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  ); // Default to today
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get("page") || 0);
  const sizeParam = Number(searchParams.get("size") || 20);
  const dateParam =
    searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const isAdminRole = Utils.isRoleApplicable('ADMIN');

  // Initialize selectedDate from URL params
  // useEffect(() => {
  //   if (dateParam) {
  //     setSelectedDate(dateParam);
  //   }
  // }, [dateParam]);

  // Calculate statistics
  const filteredItems = items;
  
  const totalInward = filteredItems
    .filter((item) => item.expenseType === "CASH-IN")
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalOutward = filteredItems
    .filter((item) => item.expenseType === "CASH-OUT")
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const netBalance = totalInward - totalOutward;
  const totalTransactions = filteredItems.length;

  const fetchUrl = async (url) => {
    setLoading(true);
    setError("");
    try {
      const bearerToken = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      const json = await res.json();
      let list = json.content || json._embedded?.expenses || [];

      setItems(list);
      setLinks(json._links || {});
    } catch (e) {
      setError("Failed to fetch expenses");
      console.error("Fetch error:", e);
    }
    setLoading(false);
  };

  useEffect(() => {    
    const bearerToken = localStorage.getItem("token");
    let url = `${APP_SERVER_URL_PREFIX}/expenses?page=${pageParam}&size=${sizeParam}`;    
    // Add organization filter if selected
    if(!isAdminRole) {
      const orgId = localStorage.getItem("organizationId");
      setSelectedOrgId(orgId);
      url += `&organizationId=${orgId}`;
      if (selectedDate) {
        url += `&createdDate=${selectedDate}`;
      }else{
        url += `&createdDate=${new Date().toISOString().slice(0, 10)}`;
      }
    } else {
      if (selectedOrgId) {
        url += `&organizationId=${selectedOrgId}`;
      }
      if (selectedDate) {
        url += `&createdDate=${selectedDate}`;
      }else{
        url += `&createdDate=${new Date().toISOString().slice(0, 10)}`;
      }
    }
    fetchUrl(url);
  }, [pageParam, sizeParam, selectedOrgId,selectedDate]);

  useEffect(() => {
    // Fetch organizations for dropdown
    const bearerToken = localStorage.getItem("token");
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => {});
  }, []);

  const handleOrganizationChange = (e) => {
    const value = e.target.value;
    setSelectedOrgId(value);

    const params = { page: 0, size: sizeParam };
    if (selectedDate !== new Date().toISOString().slice(0, 10)) {
      params.date = selectedDate;
    }

    if (value) {
      params.organizationId = value;
    }

    setSearchParams(params);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    const params = { page: 0, size: sizeParam };
    if (newDate !== new Date().toISOString().slice(0, 10)) {
      params.date = newDate;
    }
    if (selectedOrgId) {
      params.organizationId = selectedOrgId;
    }

    setSearchParams(params);
  };

  const handleDayClosing = async () => {
    setClosing(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch(
        `${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Failed to process day closing");
      setSuccess(
        "Day closing completed successfully! All transactions have been finalized."
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (e) {
      setError("Day closing failed. Please try again.");
    } finally {
      setClosing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // const formatDate = (dateString) => {
  //   if (!dateString) return "N/A";
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-IN", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //   });
  // };
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };


  const getExpenseTypeColor = (type) => {
    return type === "CASH-IN" ? "#10b981" : "#ef4444";
  };

  const getExpenseTypeIcon = (type) => {
    return type === "CASH-IN" ? "💰" : "💸";
  };

  const resetFilters = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setSelectedOrgId("");
    setSearchParams({ page: 0, size: sizeParam });
  };

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title="Day Closing Management">
        {/* Header Section with Stats */}
        <div className="dashboard-header1">
          <div
            className="header-content"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <div></div>
            <div>
              <button
                className="btn-primary1"
                style={{
                  color: "#c393c1",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
                onClick={() => navigate("/pettycash/day-closing/create")}
              >
                <span className="btn-icon" style={{ color: "#c392c1" }}>
                  +
                </span>
                Perform Day Closing
              </button>
            </div>
          </div>          
        </div>

        {/* Filters Section */}
        <div className="filters-section1">
          <div className="filters-grid">
            <div className="filter-group">
              {/* <label className="filter-label">Date</label> */}
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="filter-select date-input"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="filter-group">
              {/* <label className="filter-label">Organization</label> */}
              <select
                value={
                  isAdminRole
                    ? selectedOrgId
                    : localStorage.getItem("organizationId")
                }
                onChange={handleOrganizationChange}
                className="filter-select"
                disabled={!isAdminRole}
              >
                <option value="">All Organizations</option>
                {organizations.map((org) => (
                  <option
                    key={org.id || org._links?.self?.href}
                    value={org.id || org._links?.self?.href.split("/").pop()}
                  >
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              {/* <label className="filter-label">Items per page</label> */}
              <select
                value={sizeParam}
                onChange={(e) => {
                  const params = { page: 0, size: e.target.value };
                  if (selectedDate !== new Date().toISOString().slice(0, 10)) {
                    params.date = selectedDate;
                  }
                  if (selectedOrgId) {
                    params.organizationId = selectedOrgId;
                  }
                  setSearchParams(params);
                }}
                className="filter-select"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <strong>Success:</strong> {success}
            </div>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="modern-table ">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">📝</div>
                          <div className="no-data-text">
                            No transactions found for {formatDate(selectedDate)}
                            {selectedOrgId && ` in the selected organization`}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="type-cell">
                          <span
                            className="type-badge"
                            style={{
                              backgroundColor: getExpenseTypeColor(
                                item.expenseType
                              ),
                              color: "white",
                            }}
                          >
                            <span className="type-icon">
                              {getExpenseTypeIcon(item.expenseType)}
                            </span>
                            {item.expenseType || "N/A"}
                          </span>
                        </td>
                        <td className="date-cell">
                          <div className="date-info">
                            <div className="date-display">
                              {formatDate(item.createdDate)}
                            </div>
                            {/* <div className="time-display">
                              {item.createdTime ||
                                item.createdAt?.split("T")[1]?.slice(0, 5) ||
                                "N/A"}
                            </div> */}
                          </div>
                        </td>
                        <td className="branch-cell">
                          <div className="branch-info">
                            {/* <div className="branch-name">
                              {item.branchName || "-"}
                            </div> */}
                            <div className="organization-name">
                              {organizations.find(
                                (org) =>
                                  String(org.id) ===
                                    String(item.organizationId) ||
                                  String(
                                    org._links?.self?.href.split("/").pop()
                                  ) === String(item.organizationId)
                              )?.name || "Organization"}
                            </div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <span
                            className={`amount-badge ${
                              item.expenseType === "CASH-IN"
                                ? "amount-in"
                                : "amount-out"
                            }`}
                          >
                            {item.expenseType === "CASH-IN" ? "+" : "-"}
                            {formatCurrency(item.amount)}
                          </span>
                        </td>

                        <td className="category-cell">
                          <span className="category-tag">
                            {item.expenseSubType || "General"}
                          </span>
                        </td>
                        <td className="creator-cell">
                          <div className="creator-info">
                            <div className="creator-name">
                              {item.createdByUser || "System"}
                            </div>
                          </div>
                        </td>

                        <td className="actions-cell">
                          <button
                            className="btn-outline view-btn"
                            onClick={() =>
                              navigate(
                                `/pettycash/expenses/${
                                  item.id ||
                                  item._links?.self?.href.split("/").pop()
                                }`
                              )
                            }
                            title="View Details"
                          >
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {filteredItems.length} transactions • Page{" "}
                  {pageParam + 1}
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn-outline"
                    disabled={!(links.prev || pageParam > 0)}
                    onClick={() => {
                      const params = {
                        page: Math.max(0, pageParam - 1),
                        size: sizeParam,
                      };
                      if (
                        selectedDate !== new Date().toISOString().slice(0, 10)
                      ) {
                        params.date = selectedDate;
                      }
                      if (selectedOrgId) {
                        params.organizationId = selectedOrgId;
                      }
                      setSearchParams(params);
                    }}
                  >
                    ← Previous
                  </button>
                  <span className="page-indicator">Page {pageParam + 1}</span>
                  <button
                    className="btn-outline"
                    disabled={
                      !(links.next || filteredItems.length >= sizeParam)
                    }
                    onClick={() => {
                      const params = {
                        page: pageParam + 1,
                        size: sizeParam,
                      };
                      if (
                        selectedDate !== new Date().toISOString().slice(0, 10)
                      ) {
                        params.date = selectedDate;
                      }
                      if (selectedOrgId) {
                        params.organizationId = selectedOrgId;
                      }
                      setSearchParams(params);
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
}

export default DayClosing;
