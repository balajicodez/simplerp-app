import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../_components/sidebar/Sidebar';
import PageCard from '../_components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import './HandLoans.css';
import {PRETTY_CASE_PAGE_TITLE} from "../pages/petty-cash/PrettyCaseConstants";
import DefaultAppSidebarLayout from "../_components/default-app-sidebar-layout/DefaultAppSidebarLayout";
import Utils from '../Utils';

const HandLoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [viewMode, setViewMode] = useState('ISSUED'); // ISSUED, RECOVERED, ALL
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showRecoverForm, setShowRecoverForm] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [loanRecoveries, setLoanRecoveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [fetchedBalance, setFetchedBalance] = useState(0);
  const [recoveredLoansForMainLoan, setRecoveredLoansForMainLoan] = useState([]);
  const [loadingRecoveredLoans, setLoadingRecoveredLoans] = useState(false);
  const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");  
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const navigate = useNavigate();  const pageSize = 10;

  const pageParam = Number(searchParams.get("page") || 0);
  const sizeParam = Number(searchParams.get("size") || 20);

  // Fetch organizations
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch loans based on view mode and page
  useEffect(() => {
    fetchLoans();
  }, [viewMode, currentPage]);

 useEffect(() => {
   fetchLoans();
 }, [pageParam, sizeParam, selectedOrgId, enableOrgDropDown]);


  const fetchOrganizations = async () => {
    try {
      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        const processedOrgs = (data._embedded?.organizations || []).map(org => {
          const id = org._links?.self?.href ? org._links.self.href.split('/').pop() : org.id;
          return { 
            ...org, 
            id: id 
          };
        });
        setOrganizations(processedOrgs);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

   const handleOrganizationChange = (e) => {
    const value = e.target.value;
    setSelectedOrgId(value);
    setSearchParams({ page: 0, size: sizeParam });
  };

  // Fetch recovered loans for a specific main loan
  const fetchRecoveredLoansByMainLoanId = async (mainLoanId) => {
    if (!mainLoanId) {
      setRecoveredLoansForMainLoan([]);
      return;
    }

    setLoadingRecoveredLoans(true);
    try {
      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/getmainloanbyid/${mainLoanId}`, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Recovered loans for main loan:', data);
        
        let recoveredLoansData = [];
        
        // Handle different response structures
        if (Array.isArray(data)) {
          recoveredLoansData = data;
        } else if (data.content) {
          recoveredLoansData = data.content;
        } else if (data._embedded?.handLoans) {
          recoveredLoansData = data._embedded.handLoans;
        }
        
        // Process recovered loans data
        const processedRecoveredLoans = recoveredLoansData.map((loan, index) => {
          let id = loan.id || `temp-recovered-${index}-${Date.now()}`;
          
          // Process organization data
          let processedOrg = loan.organization;
          if (processedOrg) {
            if (processedOrg._links?.self?.href) {
              const orgId = processedOrg._links.self.href.split('/').pop();
              processedOrg = { ...processedOrg, id: orgId };
            }
            else if (!processedOrg.id && processedOrg.name) {
              const foundOrg = organizations.find(org => org.name === processedOrg.name);
              if (foundOrg) {
                processedOrg = { ...processedOrg, id: foundOrg.id };
              }
            }
          }
          
          return { 
            ...loan, 
            id: id,
            organization: processedOrg,
            handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
            partyName: loan.partyName || 'Unknown',
            loanAmount: loan.loanAmount || 0,
            balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
            createdDate: loan.createdDate || new Date().toISOString().split('T')[0],
            status: loan.status || 'CLOSED'
          };
        });
        
        setRecoveredLoansForMainLoan(processedRecoveredLoans);
      } else {
        console.log('No recovered loans found for this main loan');
        setRecoveredLoansForMainLoan([]);
      }
    } catch (err) {
      console.error('Error fetching recovered loans:', err);
      setRecoveredLoansForMainLoan([]);
    } finally {
      setLoadingRecoveredLoans(false);
    }
  };

  // Balance fetching method with date parameter
  const fetchCurrentBalance = async (organizationId, date) => {
    if (!organizationId || !date) {
      setFetchedBalance(0);
      return;
    }

    setBalanceLoading(true);
    try {
      const bearerToken = localStorage.getItem('token');
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/expenses/current_balance?organizationId=${organizationId}&createdDate=${date}`,
        { headers: { 'Authorization': `Bearer ${bearerToken}` } }
      );
      
      if (response.ok) {
        const balanceData = await response.json();
        console.log('Balance API Response:', balanceData);
        
        let balance = 0;
        
        if (balanceData.totalBalance !== undefined && balanceData.totalBalance !== null) {
          balance = balanceData.totalBalance;
        } else if (balanceData.cashInAmt !== undefined && balanceData.cashOutAmt !== undefined) {
          balance = (balanceData.cashInAmt || 0) - (balanceData.cashOutAmt || 0);
        }
        
        balance = Number(balance) || 0;
        
        console.log('Calculated Balance:', balance);
        
        setFetchedBalance(balance);
      } else {
        console.error('Balance API response not OK:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setFetchedBalance(0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setFetchedBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    setError('');
    try {
      let url;
      let orgId = null;

      // Use different endpoints based on view mode
      if (viewMode === 'ALL') {
        url = `${APP_SERVER_URL_PREFIX}/handloans/getHandLoansByOrgIdAndStatus?page=${currentPage}&size=${pageSize}`;
      } else if (viewMode === 'RECOVERED') {
        // For recovered loans view, we show all CLOSED loans
        url = `${APP_SERVER_URL_PREFIX}/handloans/getHandLoansByOrgIdAndStatus?page=${currentPage}&size=${pageSize}&status=CLOSED`;
      } else {
        url = `${APP_SERVER_URL_PREFIX}/handloans/getHandLoansByOrgIdAndStatus?page=${currentPage}&size=${pageSize}&status=ISSUED,PARTIALLY_RECOVERED`;
      }
      
            // 👇 If NOT admin → always use logged-in org
      if (!enableOrgDropDown) {
        orgId = localStorage.getItem("organizationId");
      }
      // 👇 If admin
      else {
        if (selectedOrgId) {
          orgId = selectedOrgId;
        } else {
          orgId = null; // fetch ALL orgs
        }
      }
      if (orgId) {
        url += `&organizationId=${orgId}`;
      }

      const bearerToken = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Loans API Response:', data);
        
        let loansData = [];
        
        if (data.content) {
          loansData = data.content;
        } else if (data._embedded?.handLoans) {
          loansData = data._embedded.handLoans;
        } else if (Array.isArray(data)) {
          loansData = data;
        }
        
        console.log('Processed loans data:', loansData);
        
        const processedLoans = loansData.map((loan, index) => {
          let id = loan.id || `temp-${index}-${Date.now()}`;
          
          let processedOrg = loan.organization;
          if (processedOrg) {
            if (processedOrg._links?.self?.href) {
              const orgId = processedOrg._links.self.href.split('/').pop();
              processedOrg = { ...processedOrg, id: orgId };
            }
            else if (!processedOrg.id && processedOrg.name) {
              const foundOrg = organizations.find(org => org.name === processedOrg.name);
              if (foundOrg) {
                processedOrg = { ...processedOrg, id: foundOrg.id };
              }
            }
          }
          
          return { 
            ...loan, 
            id: id,
            organization: processedOrg,
            handLoanNumber: loan.handLoanNumber || `HL${String(loan.id || id).padStart(4, '0')}`,
            partyName: loan.partyName || 'Unknown',
            loanAmount: loan.loanAmount || 0,
            balanceAmount: loan.balanceAmount || loan.loanAmount || 0,
            createdDate: loan.createdDate || new Date().toISOString().split('T')[0],
            status: loan.status || 'ISSUED'
          };
        });
        
setLoans(processedLoans);
setTotalPages(data.totalPages || 0);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch loans: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error loading loans:', err);
      setError('Error loading loans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanRecoveries = async (loanId) => {
    try {
      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/${loanId}`, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Recoveries API Response:', data);
        
        let recoveriesData = [];
        if (Array.isArray(data)) {
          recoveriesData = data;
        } else if (data.content) {
          recoveriesData = data.content;
        } else if (data._embedded?.handLoanRecoveries) {
          recoveriesData = data._embedded.handLoanRecoveries;
        }
        
        console.log('All recovery transactions:', recoveriesData);
        setLoanRecoveries(recoveriesData);
      } else {
        console.log('No recoveries found or error fetching recoveries');
        setLoanRecoveries([]);
      }
    } catch (err) {
      console.error('Error fetching recoveries:', err);
      setLoanRecoveries([]);
    }
  };

  const handleLoanSelect = (loan) => {
    setSelectedLoan(loan);
    // Reset recovered loans when selecting a new main loan
    setRecoveredLoansForMainLoan([]);
  };

  const handleViewLoanDetails = async (loan) => {
    setSelectedLoan(loan);
    await fetchLoanRecoveries(loan.id);
    setShowLoanDetails(true);
  };

  const handleCreateLoan = () => {
    setShowCreateForm(true);
    setShowRecoverForm(false);
    setShowLoanDetails(false);
    setSelectedLoan(null);
  };

  const handleRecoverLoan = () => {
    if (!selectedLoan) {
      alert('Please select a loan to recover');
      return;
    }
    setShowRecoverForm(true);
    setShowCreateForm(false);
    setShowLoanDetails(false);
  };

  // Updated function to handle viewing recovered loans for selected main loan
  const handleViewRecoveredLoans = async () => {
    if (!selectedLoan) {
      alert('Please select a main loan to view its recovered loans');
      return;
    }
    
    // Fetch recovered loans for the selected main loan
    await fetchRecoveredLoansByMainLoanId(selectedLoan.id);
    setViewMode('RECOVERED');
    setCurrentPage(0);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(0);
    setSelectedLoan(null);
    // Clear recovered loans when changing view mode
    if (mode !== 'RECOVERED') {
      setRecoveredLoansForMainLoan([]);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter loans based on view mode and search term
  const filteredLoans = useMemo(() => {
    let filtered = loans;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loan => 
        loan.partyName?.toLowerCase().includes(term) ||
        loan.handLoanNumber?.toLowerCase().includes(term) ||
        loan.phoneNo?.includes(searchTerm) ||
        loan.narration?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [loans, searchTerm]);

  // Calculate summary statistics for current view
  const summaryStats = useMemo(() => {
    const loansToCalculate = viewMode === 'RECOVERED' && recoveredLoansForMainLoan.length > 0 
      ? recoveredLoansForMainLoan 
      : filteredLoans;

    const totalLoans = loansToCalculate.length;
    const totalIssued = loansToCalculate.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
    const totalBalance = loansToCalculate.reduce((sum, loan) => sum + (loan.balanceAmount || 0), 0);
    const totalRecovered = totalIssued - totalBalance;

    return {
      totalLoans,
      totalIssued,
      totalBalance,
      totalRecovered,
      recoveryRate: totalIssued > 0 ? (totalRecovered / totalIssued) * 100 : 0
    };
  }, [filteredLoans, recoveredLoansForMainLoan, viewMode]);

  const getStatusBadge = (loan) => {
    const statusConfig = {
      'ISSUED': { label: 'Issued', color: '#3b82f6', bgColor: '#dbeafe' },
      'PARTIALLY_RECOVERED': { label: 'Partial Recovery', color: '#f59e0b', bgColor: '#fef3c7' },
      'CLOSED': { label: 'Recovered', color: '#10b981', bgColor: '#d1fae5' }
    };
    
    const config = statusConfig[loan.status] || { label: loan.status, color: '#6b7280', bgColor: '#f3f4f6' };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.color}`
        }}
      >
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const bearerToken = localStorage.getItem("token");
        const response = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        const data = await response.json();
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      }
    };
    fetchOrganizations();
  }, []);


  const RecoveryProgressBar = ({ loan }) => {
    const recoveredAmount = (loan.loanAmount || 0) - (loan.balanceAmount || 0);
    const percentage = loan.loanAmount > 0 ? (recoveredAmount / loan.loanAmount) * 100 : 0;
    
    return (
      <div className="recovery-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {percentage.toFixed(0)}%
        </div>
      </div>
    );
  };

  return (
      <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>
      <PageCard title="Hand Loan Management">
        {/* Summary Dashboard */}
        <LoanSummaryDashboard
          summary={summaryStats}
          viewMode={viewMode}
          selectedLoan={selectedLoan}
          recoveredLoansCount={recoveredLoansForMainLoan.length}
          onCreateLoan={handleCreateLoan}
        />

        {/* Header Section */}
        <div className="handloan-header">
          <div className="header-actions">
            <div className="action-buttons">
              {/* <button
                className="btn-primary"
                onClick={handleCreateLoan}
                title="Create new hand loan"
              >
                <span className="btn-icon">+</span>
                New Loan
              </button> */}
              {selectedLoan?.status !== "RECOVERED" && (
                <button
                  className="btn-secondary"
                  onClick={handleRecoverLoan}
                  disabled={!selectedLoan || selectedLoan.status === "CLOSED"}
                  title={
                    !selectedLoan
                      ? "Select a loan to recover"
                      : selectedLoan.status === "CLOSED"
                      ? "Loan already recovered"
                      : "Recover selected loan"
                  }
                >
                  {/* <span className="btn-icon">💰</span> */}
                  Recover
                </button>
              )}
              <button
                className={`btn-secondary ${
                  viewMode === "RECOVERED" ? "active" : ""
                }`}
                style={{ padding: "4px" }}
                onClick={handleViewRecoveredLoans}
                disabled={!selectedLoan}
                title={
                  !selectedLoan
                    ? "Select a main loan to view its recovered loans"
                    : `View recovered loans for ${selectedLoan.handLoanNumber}`
                }
              >
                {/* <span className="btn-icon">✅</span> */}
                {selectedLoan
                  ? `Recovered Loans for ${selectedLoan.handLoanNumber}`
                  : "Recovered Loans"}
              </button>
            </div>
            { <select
                value={
                  enableOrgDropDown
                    ? selectedOrgId
                    : localStorage.getItem("organizationId")
                }
                onChange={handleOrganizationChange}
                className="filter-select"
                disabled={!enableOrgDropDown}
              ><option value="">All Branches</option>
                {organizations.map((org) => (
                  <option
                    key={org.id || org._links?.self?.href}
                    value={org.id || org._links?.self?.href.split("/").pop()}
                  >
                    {org.name}
                  </option>
                ))}

              </select> }
            <div className="search-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search loans..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-input"
                />
                {/* <span className="search-icon">🔍</span> */}
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="view-mode-tabs">
            <button
              className={`tab-btn ${viewMode === "ISSUED" ? "active" : ""}`}
              onClick={() => handleViewModeChange("ISSUED")}
            >
              <span className="tab-icon">📋</span>
              Issued Loans
            </button>
            <button
              className={`tab-btn ${viewMode === "ALL" ? "active" : ""}`}
              onClick={() => handleViewModeChange("ALL")}
            >
              <span className="tab-icon">📊</span>
              All Loans
            </button>
          </div>
        </div>

        {/* Selection Info */}
        {selectedLoan && (
          <SelectedLoanInfo
            loan={selectedLoan}
            onClear={() => {
              setSelectedLoan(null);
              setRecoveredLoansForMainLoan([]);
            }}
            onViewDetails={handleViewLoanDetails}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Selected Loan Info for Recovered Loans View */}
        {viewMode === "RECOVERED" && selectedLoan && (
          <div className="selected-main-loan-info">
            <div
              className="main-loan-banner"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <strong style={{ color: "#3b90be", paddingLeft: "0%" }}>
                Showing recovered loans for: {selectedLoan.handLoanNumber}
              </strong>
              <span style={{ color: "#3b90be" }}>
                Party: {selectedLoan.partyName}
              </span>
              <span style={{ color: "#3b90be" }}>
                Original Amount: {formatCurrency(selectedLoan.loanAmount)}
              </span>
              <button
                className="btn-primary1"
                onClick={() => {
                  setViewMode("ISSUED");
                  setRecoveredLoansForMainLoan([]);
                }}
              >
                Show All Loans
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        {showCreateForm ? (
          <CreateHandLoanForm
            organizations={organizations}
            fetchedBalance={fetchedBalance}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchLoans();
            }}
            onCancel={() => setShowCreateForm(false)}
            onDateChange={fetchCurrentBalance}
            balanceLoading={balanceLoading}
          />
        ) : showRecoverForm ? (
          <RecoverHandLoanForm
            loan={selectedLoan}
            organizations={organizations}
            onSuccess={() => {
              setShowRecoverForm(false);
              setSelectedLoan(null);
              fetchLoans();
            }}
            onCancel={() => setShowRecoverForm(false)}
          />
        ) : showLoanDetails ? (
          <LoanDetailsModal
            loan={selectedLoan}
            recoveries={loanRecoveries}
            onClose={() => setShowLoanDetails(false)}
            onRecover={() => {
              setShowLoanDetails(false);
              handleRecoverLoan();
            }}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ) : (
          <>
            <LoanDataTable
              loans={
                viewMode === "RECOVERED" && recoveredLoansForMainLoan.length > 0
                  ? recoveredLoansForMainLoan
                  : filteredLoans
              }
              loading={
                loading || (viewMode === "RECOVERED" && loadingRecoveredLoans)
              }
              selectedLoan={selectedLoan}
              onLoanSelect={handleLoanSelect}
              onViewDetails={handleViewLoanDetails}
              getStatusBadge={getStatusBadge}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              RecoveryProgressBar={RecoveryProgressBar}
              viewMode={viewMode}
              isRecoveredLoansView={
                viewMode === "RECOVERED" && recoveredLoansForMainLoan.length > 0
              }
              mainLoan={selectedLoan}
            />
            {viewMode !== "RECOVERED" && loans.length > 0 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  Showing {loans.length} results • Page {currentPage + 1}
                </div>

                <div className="pagination-controls">
                  <button
                    className="btn-outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  >
                    ← Previous
                  </button>

                  <button
                    className="btn-outline"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </PageCard>
      </DefaultAppSidebarLayout>
  );
};

// Updated Loan Summary Dashboard Component
const LoanSummaryDashboard = ({
  summary,
  viewMode,
  selectedLoan,
  recoveredLoansCount,
  onCreateLoan,
}) => {
  const getViewModeTitle = () => {
    switch (viewMode) {
      case "ISSUED":
        return "Issued Loans";
      case "RECOVERED":
        if (selectedLoan) {
          return `Recovered Loans for ${selectedLoan.handLoanNumber}`;
        }
        return "Recovered Loans";
      case "ALL":
        return "All Loans";
      default:
        return "Loans";
    }
  };

  return (
    <div className="dashboard-header1">
      <div className="header-content">
        <div></div>
        <button className="btn-primary1" onClick={onCreateLoan}>
          <span className="btn-icon">+</span> New Loan
        </button>
      </div>
      {/* <div className="dashboard-header">
        <h3>{getViewModeTitle()} Summary</h3>
        {viewMode === 'RECOVERED' && selectedLoan && (
          <div className="main-loan-reference">
            Main Loan: {selectedLoan.handLoanNumber} | Party: {selectedLoan.partyName}
          </div>
        )}
      </div> */}
      <div className="dashboard-stats">
        <div className="stat-card">
          {/* <div className="stat-icon">📊</div> */}
          <div className="stat-info">
            <div className="stat-value">{summary.totalLoans}</div>
            <div className="stat-label">Total Loans</div>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">💰</div> */}
          <div className="stat-info">
            <div className="stat-value">
              {formatCurrency(summary.totalIssued)}
            </div>
            <div className="stat-label">Total Issued</div>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">⚖️</div> */}
          <div className="stat-info">
            <div className="stat-value pending">
              {formatCurrency(summary.totalBalance)}
            </div>
            <div className="stat-label">Pending Balance</div>
          </div>
        </div>
        <div className="stat-card">
          {/* <div className="stat-icon">✅</div> */}
          <div className="stat-info">
            <div className="stat-value">{summary.recoveryRate.toFixed(1)}%</div>
            <div className="stat-label">Recovery Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Selected Loan Info Component
const SelectedLoanInfo = ({ loan, onClear, onViewDetails, formatCurrency }) => {
  return (
    <div className="selection-info">
      {/* <div className="selected-loan-info">
        <div className="loan-basic-info">
          <strong>{loan.handLoanNumber}</strong>
          <span>{loan.partyName}</span>
          <span className="balance-amount">{formatCurrency(loan.balanceAmount)} pending</span>
          {loan.status === 'CLOSED' && (
            <span className="recovered-badge">Fully Recovered</span>
          )}
        </div>
        <div className="selection-actions">
          <button className="btn-outline" onClick={() => onViewDetails(loan)}>
            View Details
          </button>
          <button className="btn-clear" onClick={onClear}>
            ×
          </button>
        </div>
      </div> */}
    </div>
  );
};

// Updated Loan Data Table Component
const LoanDataTable = ({ 
  loans, 
  loading, 
  selectedLoan, 
  onLoanSelect, 
  onViewDetails,
  getStatusBadge,
  formatCurrency,
  formatDate,
  RecoveryProgressBar,
  viewMode,
  isRecoveredLoansView,
  mainLoan
}) => {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>
          {isRecoveredLoansView 
            ? `Loading recovered loans for ${mainLoan?.handLoanNumber}...` 
            : 'Loading loans...'
          }
        </p>
      </div>
    );
  }

  // Show recovered loans in card view
  if (viewMode === 'RECOVERED' || isRecoveredLoansView) {
    return (
      <RecoveredLoansCardView 
        loans={loans}
        onViewDetails={onViewDetails}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        mainLoan={mainLoan}
      />
    );
  }

  return (
    <div className="modern-table1">
      <div className="table-responsive">
        <table className="modern-table">
          <thead>
            <tr>
              {viewMode !== "ALL" && <th className="select-col">Select</th>}
              <th className="loan-details-col">Loan Details</th>
              <th className="loan-details-col">Party Name</th>
              <th className="org-col">Organization</th>
              <th className="date-col">Date</th>
              <th className="amount-col">Amount</th>
              <th className="balance-col">Balance</th>
              {viewMode !== "ALL" && <th className="progress-col">Progress</th>}
              <th className="status-col">Status</th>
              <th className="actions-col">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  <div className="no-data-content">
                    <div className="no-data-icon">💰</div>
                    <p>No {viewMode.toLowerCase()} loans found</p>
                    <p className="no-data-subtitle">
                      Try changing your filters or create a new loan
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <LoanTableRow
                  key={loan.id}
                  loan={loan}
                  isSelected={selectedLoan?.id === loan.id}
                  onSelect={onLoanSelect}
                  onViewDetails={onViewDetails}
                  getStatusBadge={getStatusBadge}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  RecoveryProgressBar={RecoveryProgressBar}
                  viewMode={viewMode}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LoanTableRow = ({ 
  loan, 
  isSelected, 
  onSelect, 
  onViewDetails, 
  getStatusBadge, 
  formatCurrency, 
  formatDate,
  RecoveryProgressBar,
  viewMode
}) => {

  const [modalFile, setModalFile] = useState(null);
  const isRecoveredLoan = loan.status === 'CLOSED';
  const canSelect = !isRecoveredLoan && viewMode !== 'RECOVERED';
  
  return (
    <tr className={`loan-row ${isSelected ? 'selected' : ''} ${isRecoveredLoan ? 'recovered-loan' : ''}`}>
    {viewMode !== "ALL" && (
        <td className="select-col">
          <input
            type="radio"
            name="selectedLoan"
            checked={isSelected}
            onChange={() => onSelect(loan)}
            className="loan-radio"
            disabled={!canSelect}
          />
        </td>
      )}

      <td className="loan-details-col">
        <div className="loan-main-info">
          <div className="loan-number">{loan.handLoanNumber || `HL${String(loan.id).padStart(4, '0')}`}</div>
          {loan.phoneNo && <div className="party-phone">{loan.phoneNo}</div>}
          {/* {loan.narration && (
            <div className="loan-narration" title={loan.narration}>
              {loan.narration.length > 50 ? `${loan.narration.substring(0, 50)}...` : loan.narration}
            </div>
          )} */}
        </div>
      </td>
      <td>          <div className="party-name">{loan.partyName}</div>
</td>
      <td className="org-col">
        <div className="org-name" title={loan.organization?.name}>
          {loan.organization?.name || 'N/A'}
        </div>
      </td>
      <td className="date-col">
        <div className="loan-date">
          {formatDate(loan.createdDate)}
        </div>
      </td>
      <td className="amount-col">
        <div className="loan-amount">
          {formatCurrency(loan.loanAmount)}
        </div>
      </td>
      <td className="balance-col">
        <div className={`balance-amount ${loan.balanceAmount > 0 ? 'pending' : 'paid'}`}>
          {formatCurrency(loan.balanceAmount)}
          {isRecoveredLoan && <div className="fully-paid-badge">Paid</div>}
        </div>
      </td>
   {viewMode !== "ALL" && (
      <td className="progress-col">
        <RecoveryProgressBar loan={loan} />
      </td>
   )}
      <td className="status-col">
        {getStatusBadge(loan)}
      </td>
      
      <td className="actions-col">  
        {loan.hasImage ? (
            <button
              className="btn-view"
              onClick={async () =>{
                  const res = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/${loan.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                  });
                  const json = await res.json();                               
                  setModalFile(
                    json.imageData || json.fileUrl || json.file
                  )
                }
              }
            >
              👁️ View
            </button>   ) : (
                            <span className="no-receipt">(No receipt)</span>
                          )}        
      </td>
      {modalFile && (
          <div className="modal-overlay" onClick={() => setModalFile(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Receipt Preview</h3>
                <button
                  className="modal-close"
                  onClick={() => setModalFile(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {modalFile.startsWith("data:image") ? (
                  <img
                    src={modalFile}
                    alt="Expense Receipt"
                    className="receipt-image"
                  />
                ) : (
                  <img
                    src={`data:image/png;base64,${modalFile}`}
                    alt="Expense Receipt"
                    className="receipt-image"
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-primary"
                  onClick={() => setModalFile(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
    </tr>
  );
};
const getLocalDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const CreateHandLoanForm = ({ 
  organizations, 
  fetchedBalance,
  onSuccess, 
  onCancel, 
  onDateChange,
  balanceLoading 
}) => {

  const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const [form, setForm] = useState({
    organizationId: enableOrgDropDown ? "" : localStorage.getItem("organizationId"),
    partyName: "",
    loanAmount: "",
    phoneNo: "",
    narration: "",
    handLoanType: "ISSUE",
    createdDate: getLocalDate(),
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  useEffect(() => {
    onDateChange(form.organizationId, form.createdDate);
  }, [form.organizationId, form.createdDate]);


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'organizationId' && value && form.createdDate) {
      // Fetch balance for selected organization and date
      onDateChange(value, form.createdDate);
    }

    if (name === 'createdDate' && value && form.organizationId) {
      // Fetch balance for selected date and organization
      onDateChange(form.organizationId, value);
    }

     if (name === "file") {
      const file = files[0];
      setForm((f) => ({ ...f, file }));
      return;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    if (!form.organizationId || !form.partyName || !form.loanAmount) {
      setError('Please fill all required fields');
      return;
    }

    const loanAmount = parseInt(form.loanAmount);
    if (loanAmount <= 0) {
      setError('Loan amount must be greater than 0');
      return;
    }

    // Use fetched balance for validation
    if (loanAmount > fetchedBalance) {
      setError(`Loan amount exceeds available balance of ${formatCurrency(fetchedBalance)}`);
      return;
    }

    setLoading(true);
    try {
      // FIXED: Remove status field from request data
      const requestData = {
        organizationId: parseInt(form.organizationId),
        partyName: form.partyName,
        loanAmount: loanAmount,
        balanceAmount: loanAmount,
        phoneNo: form.phoneNo || '',
        narration: form.narration || '',
        handLoanType: 'ISSUE',
        createdDate: form.createdDate || new Date().toISOString()
      };
     
      const formData = new FormData();
      formData.append(
        "handloan",
        new Blob([JSON.stringify(requestData)], { type: "application/json" })
      );
      if (form.file) formData.append("file", form.file);

      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans`, {
        method: 'POST',
        headers: {          
          'Authorization': `Bearer ${bearerToken}`
        },
        body: formData
      });

      if (response.ok) {
        const createdLoan = await response.json();
        console.log('Loan created successfully:', createdLoan);
        onSuccess();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create loan');
      }
    } catch (err) {
      setError(err.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

   const isAmountExceedingBalance = form.loanAmount > fetchedBalance;

   const handleOrganizationChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSelectedOrgId(value);    
  };

  return (
    <div className="form-container1">
      <div className="form-header1">
        <h2>Create New Loan</h2>
        <button className="btn-close" onClick={onCancel}>
          ×
        </button>
      </div>

      {/* Balance Information */}
      <div className="balance-info-section">
        <div className="balance-display">
          <div className="balance-label">
            Available Balance for Selected Organization & Date:
          </div>
          <div className="balance-amount-display">
            {balanceLoading ? (
              <div className="balance-loading">
                <div className="loading-spinner-small"></div>
                Calculating balance...
              </div>
            ) : (
              <div
                className={`balance-value ${
                  fetchedBalance <= 0 ? "zero-balance" : ""
                }`}
              >
                {formatCurrency(fetchedBalance)}
              </div>
            )}
          </div>
        </div>
        {fetchedBalance <= 0 && !balanceLoading && (
          <div className="">
            {/* ⚠️ No available balance. Please select a different organization or date. */}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="enhanced-grid1" style={{ padding: "4px" }}>
          {/* Organization */}
          <div className="form-group">
            <label>Branch *</label>
             <select
                name="organizationId"
                value={
                  enableOrgDropDown
                    ? form.organizationId
                    : localStorage.getItem("organizationId")
                }
                onChange={handleChange}
                className="filter-select"
                disabled={!enableOrgDropDown}
              ><option value="">All Branches</option>
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

          {/* Loan Date */}
          <div className="form-group">
            <label>Loan Date *</label>
            <input
              type="date"
              name="createdDate"
              value={form.createdDate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Party Name */}
          <div className="form-group">
            <label>Party Name *</label>
            <input
              type="text"
              name="partyName"
              value={form.partyName}
              onChange={handleChange}
              placeholder="Enter party name"
              required
            />
          </div>

          {/* Loan Amount */}
          <div className="form-group">
            <label>Loan Amount (₹) *</label>
            <input
              type="number"
              name="loanAmount"
              value={form.loanAmount}
              onChange={handleChange}
              min="1"
              max={fetchedBalance}
              required
              className={isAmountExceedingBalance ? "error" : ""}
              disabled={fetchedBalance <= 0}
            />

            {isAmountExceedingBalance && (
              <div className="error-text">
                Exceeds available balance by{" "}
                {formatCurrency(form.loanAmount - fetchedBalance)}
              </div>
            )}

            {fetchedBalance > 0 && (
              <div className="input-hint">
                Maximum allowed: {formatCurrency(fetchedBalance)}
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phoneNo"
              value={form.phoneNo}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          {/* Narration */}
          <div className="form-group full-width">
            <label>Narration</label>
            <textarea
              name="narration"
              value={form.narration}
              onChange={handleChange}
              rows="3"
              placeholder="Loan purpose or notes"
            />
          </div>

          {/* 🔗 FILE UPLOAD (NEW) */}
          <div className="form-group full-width">
            <label>Receipt Attachment</label>
            <input
              type="file"
              name="file"
              accept="image/*,.pdf,.doc,.docx,.xlsx"
              onChange={handleChange}
            />

            {form.file && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                <span>{form.file.name}</span>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, file: null }))}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="form-actions1"
          style={{ padding: "15px", margin: "0px 10px" }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={
              loading || isAmountExceedingBalance || fetchedBalance <= 0
            }
            title={fetchedBalance <= 0 ? "No available balance" : ""}
          >
            {loading ? "Creating..." : "💾 Save"}
          </button>
        </div>
      </form>
    </div>
  );

};

// FIXED: Recover Hand Loan Form Component - Remove status field
const RecoverHandLoanForm = ({ loan, organizations, onSuccess, onCancel }) => {

  const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");

  const [form, setForm] = useState({
    organizationId: enableOrgDropDown ? "" : localStorage.getItem("organizationId"),
    recoverAmount: '',
    narration: '',
    createdDate: new Date().toISOString().split('T')[0] // Default to today
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loan) {
      setForm(prev => ({
        ...prev,
        organizationId: loan.organizationId || ''
      }));
    }
  }, [loan]);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.organizationId || !form.recoverAmount) {
      setError('Please fill all required fields');
      return;
    }

    const recoverAmount = parseInt(form.recoverAmount);
    if (recoverAmount <= 0) {
      setError('Recovery amount must be greater than 0');
      return;
    }

    if (recoverAmount > loan.balanceAmount) {
      setError(`Cannot recover more than pending balance of ${formatCurrency(loan.balanceAmount)}`);
      return;
    }

    setLoading(true);
    try {
      // FIXED: Remove status field from request data
      const requestData = {
        organizationId: parseInt(form.organizationId),
        mainHandLoanId: loan.id,
        loanAmount: recoverAmount,
        balanceAmount: 0,
        partyName: loan.partyName,
        phoneNo: loan.phoneNo || '',
        narration: form.narration || `Recovery for ${loan.handLoanNumber}`,
        handLoanType: 'RECOVER',
        createdDate: form.createdDate || new Date().toISOString()
      };
     
      const formData = new FormData();
      formData.append(
        "handloan",
        new Blob([JSON.stringify(requestData)], { type: "application/json" })
      );
      if (form.file) formData.append("file", form.file);

      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/handloans`, {
        method: 'POST',
        headers: {          
          'Authorization': `Bearer ${bearerToken}`
        },
        body: formData
      });

      if (response.ok) {
        const recoveredLoan = await response.json();
        console.log('Loan recovery recorded successfully:', recoveredLoan);
        onSuccess();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to recover loan');
      }
    } catch (err) {
      setError(err.message || 'Failed to recover loan');
    } finally {
      setLoading(false);
    }
  };

  if (!loan) {
    return (
      <div className="alert alert-error">
        No loan selected for recovery
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Recover Loan</h2>
        <button className="btn-close" onClick={onCancel}>×</button>
      </div>

      <div className="loan-summary">
        <div className="summary-item">
          <span>Loan:</span>
          <strong>{loan.handLoanNumber}</strong>
        </div>
        <div className="summary-item">
          <span>Party:</span>
          <span>{loan.partyName}</span>
        </div>
        <div className="summary-item">
          <span>Pending Balance:</span>
          <strong className="pending">{formatCurrency(loan.balanceAmount)}</strong>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Branch *</label>
            <select
              name="organizationId"
              value={
                  enableOrgDropDown
                    ? form.organizationId
                    : localStorage.getItem("organizationId")
                }
              onChange={handleChange}
              required
              disabled={true}>
              <option value="">Select Branch</option>
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

          <div className="form-group">
            <label>Recovery Date *</label>
            <input
              type="date"
              name="createdDate"
              value={form.createdDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Recovery Amount (₹) *</label>
            <input
              type="number"
              name="recoverAmount"
              value={form.recoverAmount}
              onChange={handleChange}
              placeholder={`Max: ${formatCurrency(loan.balanceAmount)}`}
              min="1"
              max={loan.balanceAmount}
              required
            />
            <div className="input-hint">
              Maximum: {formatCurrency(loan.balanceAmount)}
            </div>
          </div>

          <div className="form-group full-width">
            <label>Notes</label>
            <textarea
              name="narration"
              value={form.narration}
              onChange={handleChange}
              placeholder="Recovery details"
              rows="2"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Record Recovery'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Updated Recovered Loans Card View Component
const RecoveredLoansCardView = ({ loans, onViewDetails, formatCurrency, formatDate, mainLoan }) => {
  if (loans.length === 0) {
    return (
      <div className="no-data">
        <div className="no-data-content">
          <div className="no-data-icon">✅</div>
          <p>
            {mainLoan 
              ? `No recovered loans found for ${mainLoan.handLoanNumber}`
              : 'No recovered loans found'
            }
          </p>
          {mainLoan && (
            <p className="no-data-subtitle">This main loan has no recovery transactions yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="recovered-loans-container">
      <div className="recovered-loans-header">
        <h3 style={{ color: "#3b90be" }}>
          {mainLoan
            ? `Recovered Loans for ${mainLoan.handLoanNumber}`
            : "Recovered Loans"}
        </h3>
        <div className="recovered-count">
          Total: {loans.length} recovery transactions
        </div>
      </div>
      <div className="recovered-loans-grid">
        {loans.map((loan) => (
          <RecoveredLoanCard
            key={loan.id}
            loan={loan}
            onViewDetails={onViewDetails}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            mainLoan={mainLoan}
          />
        ))}
      </div>
    </div>
  );
};

// Updated Individual Recovered Loan Card Component
const RecoveredLoanCard = ({ loan, onViewDetails, formatCurrency, formatDate, mainLoan }) => {
  const totalRecovered = (loan.loanAmount || 0) - (loan.balanceAmount || 0);
  const recoveryPercentage = loan.loanAmount > 0 ? (totalRecovered / loan.loanAmount) * 100 : 100;

  return (
    <div className="recovered-loan-card">
      {/* Header Section */}
      <div className="card-header">
        <div className="loan-number">{loan.handLoanNumber}</div>
        <div className="loan-type">MPOCKET</div>
        <div className="loan-reference">{loan.id}</div>
      </div>

      {/* Recovery Info */}
      <div className="recovery-info">
        Recovery for {mainLoan ? mainLoan.handLoanNumber : loan.handLoanNumber}
      </div>

      {/* Organization Section */}
      <div className="card-org-section">
        <div className="org-label">Organization</div>
        <div className="org-name">
          {loan.organization?.name || 'Unknown Organization'}
        </div>
        <div className="loan-date">
          {formatDate(loan.createdDate)}
        </div>
      </div>

      {/* Amount Section */}
      <div className="card-amount-section">
        <div className="amount-display">
          {formatCurrency(loan.loanAmount)}
        </div>
        <div className="balance-info">
          Balance: {formatCurrency(loan.balanceAmount)}
        </div>
      </div>

      {/* <div className="card-progress-section">
        <div className="progress-label">Progress</div>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill recovered"
              style={{ width: `${recoveryPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">{recoveryPercentage.toFixed(0)}%</div>
        </div>
      </div> */}

      {/* Status Section */}
      <div className="card-status-section">
        <div className="status-badge recovered">
          RECOVERED
        </div>
      </div>
    </div>
  );
};

// Loan Details Modal Component
const LoanDetailsModal = ({ loan, recoveries, onClose, onRecover, formatCurrency, formatDate }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!loan) return null;

  // Calculate total recovered from all recovery transactions
  const totalRecovered = recoveries.reduce((sum, recovery) => sum + (recovery.loanAmount || 0), 0);
  const recoveryPercentage = loan.loanAmount > 0 ? (totalRecovered / loan.loanAmount) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Loan Details</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          {/* <button 
            className={activeTab === 'recoveries' ? 'active' : ''}
            onClick={() => setActiveTab('recoveries')}
          >
            Recoveries ({recoveries.length})
          </button> */}
        </div>

        <div className="modal-content">
          {activeTab === 'details' && (
            <div className="loan-details">
              <div className="detail-section">
                <h3>Loan Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Loan ID:</label>
                    <span>{loan.handLoanNumber || `Loan-${loan.id}`}</span>
                  </div>
                  <div className="detail-item">
                    <label>Party Name:</label>
                    <span>{loan.partyName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Organization:</label>
                    <span>{loan.organization?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{loan.phoneNo || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Loan Date:</label>
                    <span>{formatDate(loan.createdDate)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span>
                  </div>
                </div>
              </div>

              {loan.narration && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <div className="narration">
                    {loan.narration}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recoveries' && (
            <div className="recoveries-list">
              <div className="recoveries-header">
                <h4>All Recovery Transactions</h4>
                <div className="recovery-summary">
                  Total Recovered: <strong>{formatCurrency(totalRecovered)}</strong> across {recoveries.length} transactions
                </div>
              </div>
              
              {recoveries.length === 0 ? (
                <div className="empty-state">
                  <p>No recovery transactions found</p>
                  {loan.balanceAmount > 0 && (
                    <button className="btn-primary" onClick={onRecover}>
                      Record Recovery
                    </button>
                  )}
                </div>
              ) : (
                <div className="recovery-items">
                  <div className="recovery-table-header">
                    <div className="recovery-amount-header">Amount</div>
                    <div className="recovery-date-header">Date</div>
                    <div className="recovery-notes-header">Notes</div>
                    <div className="recovery-type-header">Type</div>
                  </div>
                  {recoveries.map((recovery, index) => (
                    <div key={index} className="recovery-item">
                      <div className="recovery-amount">
                        {formatCurrency(recovery.loanAmount)}
                        {recovery.loanAmount < 100 && (
                          <span className="small-amount-badge">Small</span>
                        )}
                      </div>
                      <div className="recovery-date">{formatDate(recovery.createdDate)}</div>
                      <div className="recovery-notes">{recovery.narration || 'No notes'}</div>
                      <div className="recovery-type">
                        <span className={`type-badge ${recovery.handLoanType?.toLowerCase() || 'recover'}`}>
                          {recovery.handLoanType || 'RECOVER'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {/* {loan.balanceAmount > 0 && (
            <button className="btn-primary" onClick={onRecover}>
              Record Recovery
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount || 0);
};

export default HandLoanManagement;