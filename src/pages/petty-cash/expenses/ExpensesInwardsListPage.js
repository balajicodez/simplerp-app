import React, {useEffect, useState} from 'react';
import PageCard from '../../../_components/PageCard';
import '../../../pettycash/PettyCash.css';
import {APP_SERVER_URL_PREFIX} from '../../../constants.js';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Utils from '../../../Utils';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import * as ExpensesDataSource from "./ExpensesDataSource";
import {Button, Card, DatePicker, Form, Input, Modal, Select, Statistic, Typography} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {safeToLocaleString} from "../../reports/day-closing/utils";
import dayjs from "dayjs";

function ExpensesInwardsListPage() {
    const [items, setItems] = useState([]);
    const [links, setLinks] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [sortConfig, setSortConfig] = useState({key: "", direction: ""});

    const navigate = useNavigate();
    const pageParam = Number(searchParams.get("page") || 0);
    const sizeParam = Number(searchParams.get("size") || 20);

  // Calculate statistics
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTransactions = items.length;
  const enableOrgDropDown = Utils.isRoleApplicable("ADMIN");
  const enableCreate = Utils.isRoleApplicable("ADMIN") || Utils.isRoleApplicable("CASHASSISTANT");

    const fetchUrl = async () => {
        setLoading(true);
        try {
            let orgId = null;

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

            let json = await ExpensesDataSource.fetchExpenses(pageParam, sizeParam, "CASH-IN", fromDate, toDate, orgId);
            const list = json.content || [];

            setItems(list);
            setLinks( {});
        } catch (e) {
            console.error("Failed to fetch expenses:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationChange = (e) => {
        const value = e.target.value;
        setSelectedOrgId(value);
        setSearchParams({page: 0, size: sizeParam});
    };

    // Safe string conversion function
    const safeToString = (value) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "number") return value.toString();
        if (typeof value === "string") return value;
        return String(value);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
    // Default = last 30 days
    // const getToday = () => new Date().toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    const last7Days = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .split("T")[0];
    const [fromDate, setFromDate] = useState(last7Days);
    const [toDate, setToDate] = useState(today);



    // Sort items
    const sortedItems = React.useMemo(() => {
        if (!sortConfig.key) return items;

        return [...items].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortConfig.direction === "ascending" ? -1 : 1;
            if (bValue == null) return sortConfig.direction === "ascending" ? 1 : -1;

            // Handle date sorting
            if (sortConfig.key.includes("Date")) {
                const aDate = new Date(aValue);
                const bDate = new Date(bValue);
                return sortConfig.direction === "ascending"
                    ? aDate - bDate
                    : bDate - aDate;
            }

            // Handle different data types
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortConfig.direction === "ascending"
                    ? aValue - bValue
                    : bValue - aValue;
            }

            // String comparison
            const aString = safeToString(aValue).toLowerCase();
            const bString = safeToString(bValue).toLowerCase();

            if (aString < bString) {
                return sortConfig.direction === "ascending" ? -1 : 1;
            }
            if (aString > bString) {
                return sortConfig.direction === "ascending" ? 1 : -1;
            }
            return 0;
        });
    }, [items, sortConfig]);

    // Helper function to check if date is today
    const isToday = (dateString) => {
        if (!dateString) return false;

        try {
            const itemDate = new Date(dateString);
            const today = new Date();

            return (
                itemDate.getDate() === today.getDate() &&
                itemDate.getMonth() === today.getMonth() &&
                itemDate.getFullYear() === today.getFullYear()
            );
        } catch (e) {
            console.error("Invalid date:", dateString, e);
            return false;
        }
    };
    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === "ascending"
                    ? "descending"
                    : "ascending",
        }));
    };

    useEffect(() => {
        fetchUrl();
    }, [pageParam, sizeParam, selectedOrgId, fromDate, toDate, enableOrgDropDown]);


    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const bearerToken = localStorage.getItem("token");
                const response = await fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
                    headers: {Authorization: `Bearer ${bearerToken}`},
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

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return "↕️";
        return sortConfig.direction === "ascending" ? "↑" : "↓";
    };

    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Cash Inward Management</Typography.Title>
                    </div>

                    {enableCreate && <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() =>  navigate("/pettycash/expenses/create?type=CASH-IN")} icon={<PlusOutlined/>}>
                            Create New Inward
                        </Button>
                    </div>}
                </div>

                <div className={'list-dashboard'}>
                    <Card>
                        <Statistic
                            styles={{
                                content: { color: 'green' },
                            }}
                            title="Total Inward"
                            value={totalAmount?.toLocaleString()}
                            precision={2}
                            prefix={'₹'}
                        />
                    </Card>

                    <Card>
                        <Statistic
                            title="Total Transactions"
                            value={totalTransactions}
                            precision={0}
                        />
                    </Card>

                    <Card>
                        <Statistic
                            title="Organizations"
                            value={organizations.length}
                            precision={0}
                        />
                    </Card>
                </div>

               {/* <Form className="filter-form"
                      layout={'vertical'}>
                    <Form.Item
                        label={"Branch"}
                        name={"organizationId"}
                        size={'large'}
                        rules={[{required: true, message: 'Please select an organization'}]}>
                        <Select
                            placeholder="Select Organization"
                            options={organizations.map((org) => ({label: org.name, value: org.id}))}
                        />
                    </Form.Item>

                    <Form.Item
                        label={"From Date"}
                    >
                        <DatePicker
                            format={'DD-MM-YYYY'}
                        />
                    </Form.Item>

                    <Form.Item
                        label={'To Date'}>
                        <DatePicker
                            format={'DD-MM-YYYY'}
                        />
                    </Form.Item>
                </Form>*/}

                <div className="filters-section1">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label>Branch</label>
                            <select
                                value={
                                    enableOrgDropDown
                                        ? selectedOrgId
                                        : localStorage.getItem("organizationId")
                                }
                                onChange={handleOrganizationChange}
                                className="filter-select"
                                disabled={!enableOrgDropDown}
                            >
                                <option value="">All Branches</option>
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
                            <label>From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    setSearchParams({page: 0, size: sizeParam});
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
                                    setSearchParams({page: 0, size: sizeParam});
                                }}
                                className="filter-select"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Items per page</label>
                            <select
                                value={sizeParam}
                                onChange={(e) =>
                                    setSearchParams({page: 0, size: e.target.value})
                                }
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



                {/* Data Table */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading transactions...</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="modern-table">
                                <thead>
                                <tr>
                                    <th
                                        // onClick={() => handleSort('amount')}
                                        // className="sortable-header"
                                    >
                                        Amount
                                    </th>
                                    <th
                                        // onClick={() => handleSort('expenseSubType')}
                                        // className="sortable-header"
                                    >
                                        Type
                                    </th>
                                    <th
                                        // onClick={() => handleSort('createdDate')}
                                        // className="sortable-header"
                                    >
                                        Expense Date
                                    </th>
                                    <th>TransactionDate</th>
                                    <th>Book</th>
                                    <th>Receipt</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">
                                            <div className="no-data-content">
                                                <div className="no-data-icon">📝</div>
                                                <p>
                                                    No inward transactions found
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedItems.map((item, idx) => (
                                        <tr key={idx} className="table-row">
                                            <td className="amount-cell">
                          <span className="amount-badge">
                            ₹{item.amount?.toLocaleString()}
                          </span>
                                            </td>

                                            <td className="type-cell">
                          <span className="type-tag">
                            {item.expenseSubType || "General"}
                          </span>
                                            </td>

                                            <td className="date-cell">
                                                <div className="date-display">
                                                    {formatDate(item.createdDate)}
                                                </div>
                                            </td>
                                            <td className="date-cell">
                                                <div className="date-display">
                                                    {formatDate(item.transactionDate)}
                                                </div>
                                            </td>
                                            <td className="type-cell">
                          <span className="type-tag">
                            {item.gstapplicable ? "Yes" : "No"}
                          </span>
                                            </td>

                        <td className="receipt-cell">
                          {item.hasImage ? (
                            <button
                              className="btn-outline view-btn"
                              onClick={async () =>{
                                  const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${item.id}`, {
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
                            </button>
                          ) : (
                            <span className="no-receipt">(No receipt)</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

                        {/* Pagination */}
                        {sortedItems.length > 0 && (
                            <div className="pagination-section">
                                <div className="pagination-info">
                                    Showing {sortedItems.length} of many results • Page{" "}
                                    {pageParam + 1}
                                </div>
                                <div className="pagination-controls">
                                    <button
                                        className="btn-outline"
                                        disabled={!(links.prev || pageParam > 0)}
                                        onClick={() => {
                                            if (links.prev) return fetchUrl(links.prev.href);
                                            const prev = Math.max(0, pageParam - 1);
                                            setSearchParams({page: prev, size: sizeParam});
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        className="btn-outline"
                                        disabled={!(links.next || items.length >= sizeParam)}
                                        onClick={() => {
                                            if (links.next) return fetchUrl(links.next.href);
                                            const next = pageParam + 1;
                                            setSearchParams({page: next, size: sizeParam});
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <Modal
                    title="Receipt Preview"
                    centered
                    open={!!modalFile}
                    width={1000}
                    onCancel={() => setModalFile(null)}
                    footer={[
                        <Button onClick={() => setModalFile(null)}>Cancel</Button>,
                    ]}
                >
                    {modalFile && modalFile.startsWith("data:image") ? (
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
                </Modal>

            </div>
        </DefaultAppSidebarLayout>
    );
}

export default ExpensesInwardsListPage;