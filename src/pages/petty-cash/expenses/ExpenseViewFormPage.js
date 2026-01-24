import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {APP_SERVER_URL_PREFIX, DATE_DISPLAY_FORMAT} from "../../../constants.js";
import './EditExpense.css';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Button, Image, Spin, Typography} from "antd";
import {LeftOutlined} from "@ant-design/icons";
import dayjs from "dayjs";

function ExpenseViewFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const bearerToken = localStorage.getItem('token');
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`, {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => setExpense(json))
      .catch(() => setError('Unable to load expense'))
      .finally(() => setLoading(false));
  }, [id]);

  const getExpenseTypeColor = () => {
    if (!expense?.expenseType) return '#6b7280';
    return expense.expenseType === 'CASH-IN' ? '#10b981' : '#ef4444';
  };

  const getExpenseIcon = () => {
    if (!expense?.expenseType) return '📝';
    return expense.expenseType === 'CASH-IN' ? '💰' : '💸';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return dayjs(dateString).format(DATE_DISPLAY_FORMAT);
  };

  return (
      <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>
        <div className="form-page">

          <Button variant="filled"
                  color={'default'}
                  icon={<LeftOutlined/>}
                  iconPlacement={'left'}
                  onClick={() => {
                    navigate(-1);
                  }}>
            Back
          </Button>
          <Spin spinning={loading} tip="Loading..." size={'large'}>

            <div
                noValidate={true}
                className="form-page"
                layout="vertical">

              <div className='form-page-header'>


                <div className={'page-title-section'}>


                  <Typography.Title className='page-title' level={2}>
                    Expense Details
                  </Typography.Title>
                </div>


                <div className={'page-actions'}></div>
              </div>
        
        {/* Header Section */}
        <div className="expense-view-header" style={{ backgroundColor: getExpenseTypeColor() }}>
          <div className="header-content">
            <div className="header-icon">{getExpenseIcon()}</div>
            <div className="header-text">
              <h1>Expense #{expense?.id || id}</h1>
              <p>Detailed view of expense transaction</p>
              {expense?.expenseType && (
                <div className="expense-type-badge">
                  {expense.expenseType}
                </div>
              )}
            </div>
            <div className="amount-display">
              <div className="amount-figure">
                {expense?.amount ? formatCurrency(expense.amount) : '--'}
              </div>
              <div className="amount-label">Total Amount</div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading expense details...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {expense && (
          <div className="expense-details-container">
            {/* Main Details Card */}
            <div className="details-card">
              <div className="card-header">
                <Typography.Title level={4} >Transaction Information</Typography.Title>
                <div className="status-badge" style={{ backgroundColor: getExpenseTypeColor() }}>
                  {expense.expenseType || 'Unknown'}
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-group">
                  <label className="detail-label">Branch Name</label>
                  <div className="detail-value">{expense.branchName || 'Not specified'}</div>
                </div>
                
                <div className="detail-group">
                  <label className="detail-label">Amount</label>
                  <div className="detail-value amount-highlight">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Employee ID</label>
                  <div className="detail-value">
                    {expense.employeeId || (
                      <span className="empty-state">Not assigned</span>
                    )}
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Expense Category</label>
                  <div className="detail-value">
                    <span className="category-tag">
                      {expense.expenseSubType || 'General'}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Reference Number</label>
                  <div className="detail-value">
                    {expense.referenceNumber || (
                      <span className="empty-state">No reference</span>
                    )}
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Organization</label>
                  <div className="detail-value">
                    {expense.organizationName || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div className="details-card">
              <div className="card-header">
                <Typography.Title level={4} >Timeline</Typography.Title>
                <div className="timeline-icon">📅</div>
              </div>
              
              <div className="details-grid">
                <div className="detail-group">
                  <label className="detail-label">Expense Date</label>
                  <div className="detail-value">
                    {formatDate(expense.createdDate)}
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Transaction Date</label>
                  <div className="detail-value">
                    {formatDate(expense.transactionDate)}
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Created By</label>
                  <div className="detail-value">
                    {expense.createdByUser || (
                      <span className="empty-state">System</span>
                    )}
                  </div>
                </div>

                {expense.createdByUserId && (
                  <div className="detail-group">
                    <label className="detail-label">Created By User ID</label>
                    <div className="detail-value">
                      <code className="user-id">{expense.createdByUserId}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Section */}
            {(expense.imageData || expense.fileUrl || expense.file) && (
              <div className="details-card">
                <div className="card-header">

                  <Typography.Title level={4} >Receipt Attachment</Typography.Title>
                  <div className="attachment-icon">📎</div>
                </div>
                
                <div className="receipt-section">
                  <div className="receipt-preview">
                    {expense.imageData ? (
                      <Image
                        src={`data:image/png;base64,${expense.imageData}`} 
                        alt="Expense Receipt" 
                        className="receipt-image"
                      />
                    ) : (
                      <div className="file-info">
                        <div className="file-icon">📄</div>
                        <div className="file-details">
                          <div className="file-name">
                            {expense.imageFileName || 'Receipt File'}
                          </div>
                          <div className="file-type">
                            {expense.imageContentType || 'File'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {!expense && !loading && !error && (
          <div className="no-data-state">
            <div className="no-data-icon">📝</div>
            <h3>No Expense Found</h3>
            <p>Unable to load expense details for ID: {id}</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/pettycash/expenses')}
            >
              Back to Expenses
            </button>
          </div>
        )}
            </div>
          </Spin>
        </div>
      </DefaultAppSidebarLayout>
  );
}

export default ExpenseViewFormPage;