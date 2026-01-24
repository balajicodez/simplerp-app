import React, {useState, useEffect} from 'react';
import './PettyCash.css';
import {APP_SERVER_URL_PREFIX} from '../../../constants.js';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Utils from '../../../Utils';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import {
    App as AntApp,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Statistic,
    Typography
} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {fetchExpenses} from "./ExpensesDataSource";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";
import {checkPasswordStrength} from "../../user-administration/users/utils";
import dayjs from "dayjs";

function ExpensesInwardsListPage() {
    const [items, setItems] = useState([]);
    const [links, setLinks] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [organizations, setOrganizations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({key: "", direction: ""});

    const navigate = useNavigate();

    const [filterForm] = Form.useForm();

    const formUtils = new FormUtils(AntApp.useApp());
    const pageParam = Number(searchParams.get("page") || 0);
    const sizeParam = Number(searchParams.get("size") || 20);

    // Calculate statistics
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTransactions = items.length;
    const isAdmin = Utils.isRoleApplicable("ADMIN");
    const enableCreate = Utils.isRoleApplicable("ADMIN") || Utils.isRoleApplicable("CASHASSISTANT");

    const fetchUrl = async () => {
        setLoading(true);
        try {

            const orgId = filterForm.getFieldValue('organizationId');
            const fromDate = filterForm.getFieldValue('fromDate').format('YYYY-MM-DD');
            const toDate = filterForm.getFieldValue('toDate').format('YYYY-MM-DD');

            const json = await fetchExpenses(pageParam, sizeParam, 'CASH-IN', fromDate, toDate, orgId);
            const list = json.content || json._embedded?.expenses || [];

            setItems(list);
            setLinks(json._links || {});
        } catch (e) {
            console.error("Failed to fetch expenses:", e);
        } finally {
            setLoading(false);
        }
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

    // Filter items based on search term
    const filteredItems = items.filter((item) => {
        if (!searchTerm) return true;

        const searchLower = safeToString(searchTerm).toLowerCase();

        return (
            safeToString(item.branchName).toLowerCase().includes(searchLower) ||
            safeToString(item.employeeId).toLowerCase().includes(searchLower) ||
            safeToString(item.expenseSubType).toLowerCase().includes(searchLower) ||
            safeToString(item.amount).includes(searchTerm) || // Direct number comparison without toLowerCase
            safeToString(item.expenseDate).toLowerCase().includes(searchLower) ||
            safeToString(item.createdDate).toLowerCase().includes(searchLower) ||
            safeToString(item.referenceNumber).toLowerCase().includes(searchLower) ||
            safeToString(item.gstapplicable).toLowerCase().includes(searchLower)
        );
    });

    // Sort items
    const sortedItems = React.useMemo(() => {
        if (!sortConfig.key) return filteredItems;

        return [...filteredItems].sort((a, b) => {
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
    }, [filteredItems, sortConfig]);


    useEffect(() => {
        fetchUrl();
    }, [pageParam, sizeParam, isAdmin]);


    useEffect(() => {

        filterForm.setFieldsValue({
            organizationId: !isAdmin ? localStorage.getItem("organizationId") : null,
            fromDate: dayjs(new Date()).subtract(7, 'days'), // last 7 days
            toDate: dayjs(new Date()) // today
        });


        const fetchLoadData = async () => {
            try {
                const data = await fetchOrganizations(0, 1000);
                setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
            } catch (error) {
                console.error("Error fetching data:", error);
                formUtils.showErrorNotification("Failed to fetch organizations");
            }
        };
        fetchLoadData();
    }, []);


    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('fromDate')
            || changedValues.hasOwnProperty('toDate')) {
            setSearchParams({page: 0, size: sizeParam});
            fetchUrl();
        }
    }


    let organizationOptions = [{
        label: "All Branches",
        value: null
    }];

    organizationOptions = organizationOptions.concat(organizations.map(item => ({
        label: item.name,
        value: item.id
    })))


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
                                onClick={() => navigate("/pettycash/expenses/create?type=CASH-IN")}
                                icon={<PlusOutlined/>}>
                            Create New Inward
                        </Button>
                    </div>}
                </div>

                <div className={'list-dashboard'}>
                    <Card>
                        <Statistic
                            styles={{
                                content: {color: 'green'},
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
                            title={filterForm.getFieldValue('organizationId') ? "Selected Branch" : "Branches"}
                            value={filterForm.getFieldValue('organizationId') ? 1 : organizations.length}
                            precision={0}
                        />
                    </Card>
                </div>

                <Form className="filter-form"
                      form={filterForm}
                      onValuesChange={handleValueChange}
                      layout={'vertical'}>

                    <Row gutter={24}>
                        <Col span={4}>
                            <Form.Item
                                name="organizationId"
                                label="Branch"
                            >
                                <Select
                                    style={{width: "100%"}}
                                    disabled={!isAdmin}
                                    placeholder={'Select branch'}
                                    options={organizationOptions}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={4}>
                            <Form.Item
                                name="fromDate"
                                label="From Date"
                            >
                                <DatePicker
                                    format={'DD-MM-YYYY'}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={4}>
                            <Form.Item
                                name="toDate"
                                label="To Date"
                            >
                                <DatePicker
                                    format={'DD-MM-YYYY'}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                </Form>



                {/* Search Results Info */}
                {searchTerm && (
                    <div className="search-results-info">
                        Found {filteredItems.length} transactions matching "{searchTerm}"
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchTerm("")}
                        >
                            Clear search
                        </button>
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
                                                    {searchTerm
                                                        ? `No transactions found for "${searchTerm}"`
                                                        : "No inward transactions found"}
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
                                                        onClick={async () => {
                                                            const res = await fetch(`${APP_SERVER_URL_PREFIX}/expenses/${item.id}`, {
                                                                headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
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
                        <Button onClick={() => setModalFile(null)}>Close</Button>,
                    ]}
                >
                    <img
                        src={modalFile && modalFile.startsWith("data:image")
                            ? modalFile
                            : `data:image/png;base64,${modalFile}`
                        }
                        alt="Expense Receipt"
                        className="list-preview-image"
                    />
                </Modal>

            </div>
        </DefaultAppSidebarLayout>
    );
}

export default ExpensesInwardsListPage;