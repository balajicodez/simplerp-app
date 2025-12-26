import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import PageCard from "../components/PageCard";
import "./pettyCashCreateExpense.css";
import { useNavigate, useLocation } from "react-router-dom";
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import Utils from '../Utils';

const getLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function CreateExpense() {
  const enableOrgDropDown = Utils.isRoleApplicable('ADMIN');
  const [form, setForm] = useState({
    transactionDate: getLocalDate(),
    amount: "",
    employeeId: "",
    subtype: "",
    type: "",
    expenseDate: "",
    referenceNumber: "",
    file: null,
    organizationId: enableOrgDropDown ? "":localStorage.getItem('organizationId') ,
    organizationName: "",
    currentBalance: "",
  });
  const [organizations, setOrganizations] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [fetchedBalance, setFetchedBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();  

  const getExpenseType = () => {
    const params = new URLSearchParams(location.search);
    let filterType = params.get("type");
    if (!filterType) {
      if (
        location.pathname.includes("expenses-inward") ||
        (location.pathname.includes("create") &&
          location.search.includes("CASH-IN"))
      ) {
        filterType = "CASH-IN";
      }
      if (
        location.pathname.includes("expenses-outward") ||
        (location.pathname.includes("create") &&
          location.search.includes("CASH-OUT"))
      ) {
        filterType = "CASH-OUT";
      }
    }
    return filterType || "";
  };

  const getPageTitle = () => {
    const type = getExpenseType();
    if (type === "CASH-IN") return "Create Inward ";
    if (type === "CASH-OUT") return "Create Outward ";
    return "Create Expense";
  };

  const getHeaderColor = () => {
    const type = getExpenseType();
    if (type === "CASH-IN") return "inward";
    if (type === "CASH-OUT") return "outward";
    return "default";
  };

  const getExpenseIcon = () => {
    const type = getExpenseType();
    if (type === "CASH-IN") return "💰";
    if (type === "CASH-OUT") return "💸";
    return "📝";
  };

  // Debug useEffect
  useEffect(() => {
    console.log("Form state updated:", {
      organizationId: form.organizationId,
      transactionDate: form.transactionDate,
      currentBalance: form.currentBalance,
      fetchedBalance: fetchedBalance,
      expenseType: getExpenseType(),
    });
  }, [
    form.organizationId,
    form.transactionDate,
    form.currentBalance,
    fetchedBalance,
  ]);

  // Auto-fetch balance when both organization and date are selected for CASH-OUT
  // Fetch balance ONLY when organizationId + expenseDate are selected
  useEffect(() => {
    if (
      getExpenseType() === "CASH-OUT" &&
      form.organizationId &&
      form.expenseDate
    ) {
      console.log("Fetching balance (org + expenseDate):", {
        orgId: form.organizationId,
        expenseDate: form.expenseDate,
      });

      fetchCurrentBalance(form.organizationId, form.expenseDate);
    } else {
      // Clear balance if either field is missing
      setForm((f) => ({ ...f, currentBalance: "" }));
      setFetchedBalance(0);
    }
  }, [form.organizationId, form.expenseDate]);

 const fetchCurrentBalance = async (organizationId, expenseDate) => {
   if (!organizationId || !expenseDate || getExpenseType() !== "CASH-OUT") {
     setForm((f) => ({ ...f, currentBalance: "" }));
     setFetchedBalance(0);
     return;
   }

   setBalanceLoading(true);

   try {
     const bearerToken = localStorage.getItem("token");

     const response = await fetch(
       `${APP_SERVER_URL_PREFIX}/expenses/current_balance?organizationId=${organizationId}&createdDate=${expenseDate}`,
       {
         headers: {
           Authorization: `Bearer ${bearerToken}`,
           "Content-Type": "application/json",
         },
       }
     );

     if (!response.ok) throw new Error("Balance fetch failed");

     const balanceData = await response.json();

     let balance = 0;
     if (balanceData.totalBalance != null) {
       balance = balanceData.totalBalance;
     } else if (
       balanceData.cashInAmt != null &&
       balanceData.cashOutAmt != null
     ) {
       balance = balanceData.cashInAmt - balanceData.cashOutAmt;
     } else if (balanceData.balance != null) {
       balance = balanceData.balance;
     }

     balance = Number(balance) || 0;

     setFetchedBalance(balance);
     setForm((f) => ({
       ...f,
       currentBalance: balance.toString(),
     }));
   } catch (err) {
     setFetchedBalance(0);
     setForm((f) => ({ ...f, currentBalance: "" }));
     setError("Failed to fetch current balance");
   } finally {
     setBalanceLoading(false);
   }
 };


  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setError("");
    setSuccess("");

    if (type === "file") {
      const file = files[0];
      setForm((f) => ({ ...f, file }));
      return;
    }

    // Organization change
    if (name === "organizationId") {
      const orgName =
        e.currentTarget.options[e.currentTarget.selectedIndex].text;

      setForm((f) => ({
        ...f,
        organizationId: value,
        organizationName: orgName,
        currentBalance: "",
      }));
      return;
    }

    // Expense Date change (THIS is used for balance)
    if (name === "expenseDate") {
      setForm((f) => ({
        ...f,
        expenseDate: value,
        currentBalance: "",
      }));
      return;
    }

    // Amount validation
    if (name === "amount") {
      const amountValue = Number(value);
      const balanceValue = Number(form.currentBalance) || fetchedBalance;

      if (getExpenseType() === "CASH-OUT" && amountValue > balanceValue) {
        setError(
          `Amount cannot exceed current balance of ₹${balanceValue.toLocaleString()}`
        );
      }

      setForm((f) => ({ ...f, amount: value }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };


  const handleFetchBalance = () => {
    if (getExpenseType() !== "CASH-OUT") {
      setError("Current balance is only available for CASH-OUT transactions");
      return;
    }

    if (!form.organizationId && !form.transactionDate) {
      setError("Please select organization and transaction date first");
    } else if (!form.organizationId) {
      setError("Please select organization first");
    } else if (!form.transactionDate) {
      setError("Please select transaction date first");
    } else {
      fetchCurrentBalance(form.organizationId, form.transactionDate);
    }
  };

  useEffect(() => {
    let mounted = true;
    const expenseType = getExpenseType();

    setForm((f) => ({ ...f, type: expenseType }));
    const bearerToken = localStorage.getItem("token");
    fetch(`${APP_SERVER_URL_PREFIX}/expenseTypeMasters?page=0&size=1000`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("no masters");
        return res.json();
      })
      .then((json) => {
        const list =
          (json._embedded && json._embedded.expenseTypeMasters) ||
          json._embedded ||
          json ||
          [];
        const vals = list
          .filter((m) => m.type === expenseType)
          .map((m) => m.subtype || m.subType)
          .filter(Boolean);
        const uniq = Array.from(new Set(vals));
        if (mounted) setSubtypes(uniq);
      })
      .catch(() => {
        // ignore failures
      });

    const token = localStorage.getItem("token");
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        if (mounted) setOrganizations(orgs);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Enhanced validation
    if (!form.organizationId) {
      setError("Please select an organization");
      return;
    }
    if (!form.transactionDate) {
      setError("Please enter a transaction date");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Validate current balance field only for CASH-OUT
    if (getExpenseType() === "CASH-OUT") {
      if (!form.currentBalance || Number(form.currentBalance) < 0) {
        setError("Please enter a valid current balance");
        return;
      }

      // Validate amount doesn't exceed current balance for CASH-OUT
      const currentBalanceValue = Number(form.currentBalance);
      if (Number(form.amount) > currentBalanceValue) {
        setError(
          `Amount cannot exceed current balance of ₹${currentBalanceValue.toLocaleString()}`
        );
        return;
      }
    }

    if (subtypes.length > 0 && !form.subtype) {
      setError("Please select an expense category");
      return;
    }

    setLoading(true);
    try {
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      } catch (e) {
        storedUser = null;
      }

      const createdByUserId =
        storedUser && (storedUser.id || storedUser.userId)
          ? storedUser.id || storedUser.userId
          : null;
      const createdByUser =
        storedUser &&
        (storedUser.name || storedUser.username || storedUser.email)
          ? storedUser.name || storedUser.username || storedUser.email
          : localStorage.getItem("rememberedEmail") || "";
      const createdDate = "";

      const expensePayload = {
        transactionDate: form.transactionDate,
        amount: Number(form.amount),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        expenseSubType: form.subtype,
        expenseType: form.type,
        organizationId: enableOrgDropDown ? form.organizationId  : localStorage.getItem('organizationId'),
        organizationName: form.organizationName || undefined,
        createdByUserId,
        createdByUser,
        createdDate: form.expenseDate,
        referenceNumber: form.referenceNumber || undefined,
        gstapplicable: form.book === "YES",
        currentBalance:
          getExpenseType() === "CASH-OUT"
            ? Number(form.currentBalance)
            : undefined, // Only include for CASH-OUT
      };

      const formData = new FormData();
      formData.append(
        "expense",
        new Blob([JSON.stringify(expensePayload)], { type: "application/json" })
      );
      if (form.file) formData.append("file", form.file);

      const bearerToken = localStorage.getItem("token");
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

       if (!res.ok) {
        const data = await res.text();
        setError(data);
      } else {
         setSuccess('Expense created successfully! Redirecting...');

      setSuccess("Expense created successfully! Redirecting...");
      setTimeout(() => {
        if (form.type === "CASH-IN") {
          navigate("/pettycash/expenses-inward");
        } else if (form.type === "CASH-OUT") {
          navigate("/pettycash/expenses-outward");
        } else {
          navigate("/pettycash/expenses");
        }
      }, 2000);
    }

    } catch (err) {
      setError("Failed to create expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm({
      transactionDate: new Date().toISOString().slice(0, 10),
      amount: "",
      employeeId: "",
      subtype: "",
      type: getExpenseType(),
      expenseDate: "",
      referenceNumber: "",
      file: null,
      organizationId: "",
      organizationName: "",
      currentBalance: "",
      gstapplicable: "NO",
    });
    setPreviewUrl("");
    setError("");
    setSuccess("");
    setFetchedBalance(0);
    navigate("/pettycash/expenses-inward");
  };

  const getCategoryIcon = (category) => {
    const icons = {
      SALARY: "💼",
      TRAVEL: "✈️",
      OFFICE_SUPPLIES: "📦",
      UTILITIES: "💡",
      MAINTENANCE: "🔧",
      MEALS: "🍽️",
      TRANSPORT: "🚗",
      OTHER: "📝",
    };
    return icons[category] || "💰";
  };

  const formatBalance = (balance) => {
    return `₹${Number(balance).toLocaleString()}`;
  };

  // Check if current balance section should be shown
  const showCurrentBalanceSection = getExpenseType() === "CASH-OUT";

  return (
    <div className="page-container">
      <Sidebar isOpen={true} />
      <PageCard title={getPageTitle()}>
        {/* Enhanced Header Section */}

        <div className="dashboard-header1">
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div className="stat-card">
              <span className="stat-number">{organizations.length}</span>
              <span className="stat-label">Organizations</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{subtypes.length}</span>
              <span className="stat-label">Categories</span>
            </div>
            {showCurrentBalanceSection && form.currentBalance && (
              <div className="stat-badge balance-badge">
                <span className="stat-number">
                  {formatBalance(form.currentBalance)}
                </span>
                <span className="stat-label">Current Balance</span>
              </div>
            )}
          </div>
        </div>

        <div className="create-expense-form">
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

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-sections">
              <div className="form-section1">
                <div className="enhanced-grid2 grid grid-cols-3 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label required">Branch</label>
                    <select
                      name="organizationId"
                      value={form.organizationId}
                      onChange={handleChange}
                      className="form-select"
                      disabled={!enableOrgDropDown}
                      required
                    >
                      <option value="">Select branch</option>
                      {organizations.map((org) => (
                        <option
                          key={org.id || org._links?.self?.href}
                          value={
                            org.id || org._links?.self?.href.split("/").pop()
                          }
                        >
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Expense Date</label>
                    <input
                      name="expenseDate"
                      type="date"
                      value={form.expenseDate}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Current Balance (conditional) */}
                  {showCurrentBalanceSection && (
                    <div className="form-group">
                      <label className="form-label required">
                        Current Balance (₹)
                      </label>
                      <div className="balance-input-wrapper">
                        {/* <span
                          className="currency-symbol"
                          style={{ marginRight: "2px" }}
                        >
                          ₹
                        </span> */}
                        <input
                          name="currentBalance"
                          type="number"
                          value={form.currentBalance}
                          onChange={handleChange}
                          className="form-input"
                          readOnly
                        />
                        <button
                          type="button"
                          className="fetch-balance-btn"
                          onClick={handleFetchBalance}
                          disabled={
                            !form.organizationId ||
                            !form.transactionDate ||
                            balanceLoading
                          }
                        >
                          {balanceLoading ? "..." : "🔄"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label required">Amount (₹)</label>
                    <div className="amount-input-wrapper">
                      {/* <span className="currency-symbol">₹</span> */}
                      <input
                        name="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>

                    {showCurrentBalanceSection && form.currentBalance && (
                      <div className="balance-validation">
                        {form.amount &&
                        Number(form.amount) > Number(form.currentBalance) ? (
                          <div className="balance-error">
                            ❌ Amount exceeds current balance by ₹
                            {(
                              Number(form.amount) - Number(form.currentBalance)
                            ).toLocaleString()}
                          </div>
                        ) : form.amount ? (
                          <div className="balance-success">
                            ✅ Available balance after expense: ₹
                            {(
                              Number(form.currentBalance) - Number(form.amount)
                            ).toLocaleString()}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Expense Category */}
                  {subtypes.length > 0 && (
                    <div className="form-group">
                      <label className="form-label required">
                        Expense Category
                      </label>
                      <select
                        name="subtype"
                        value={form.subtype}
                        onChange={handleChange}
                        className="form-select"
                        required
                      >
                        <option value="">Select category</option>
                        {subtypes.map((s, i) => (
                          <option key={i} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Transaction Date */}
                  <div className="form-group">
                    <label className="form-label required">
                      Transaction Date
                    </label>
                    <input
                      name="transactionDate"
                      type="date"
                      value={form.transactionDate}
                      onChange={handleChange}
                      className="form-input"
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Book</label>
                    <select
                      name="book"
                      value={form.book}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="" disabled>
                        Select Book
                      </option>
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>

                  <div className="mt-0 ">
                    <label className="">File Upload</label>
                    <input
                      name="file"
                      type="file"
                      onChange={handleChange}
                      accept="image/*,.pdf,.doc,.docx,.xlsx"
                    />

                    {form.file && (
                      <div className="file-preview">
                        <span>{form.file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, file: null }));
                            setPreviewUrl("");
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="form-actions1">
              <button
                type="button"
                className="btn-secondary"
                onClick={clearForm}
                disabled={loading}
                style={{ padding: "2px" }}
              >
                ← Back
              </button>

              <button
                type="submit"
                style={{ padding: "2px" }}
                className={`btn-primary`}
                disabled={
                  loading ||
                  (showCurrentBalanceSection &&
                    form.amount &&
                    form.currentBalance &&
                    Number(form.amount) > Number(form.currentBalance))
                }
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Creating Expense...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">💾</span>
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </PageCard>
    </div>
  );
}

export default CreateExpense;
