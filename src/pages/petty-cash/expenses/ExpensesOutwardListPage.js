import React, {useState, useEffect} from 'react';
import './PettyCash.css';
import {APP_SERVER_URL_PREFIX} from '../../../constants.js';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Utils from '../../../Utils';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    App as AntApp,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Modal,
    Row,
    Select,
    Statistic,
    Table,
    Tag, Tooltip,
    Typography
} from "antd";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";
import dayjs from "dayjs";
import {fetchExpense, fetchExpenses} from "./ExpensesDataSource";

function ExpensesOutwardListPage() {
    const [items, setItems] = useState([]);
    const [links, setLinks] = useState({});
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({key: '', direction: ''});

    const [filterForm] = Form.useForm();
    const navigate = useNavigate();
    const formUtils = new FormUtils(AntApp.useApp());
    const pageParam = Number(searchParams.get('page') || 0);
    const sizeParam = Number(searchParams.get('size') || 20);

    // Calculate statistics for outward expenses
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTransactions = items.length;
    const averageExpense = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    const isAdmin = Utils.isRoleApplicable('ADMIN');
    const enableCreate = Utils.isRoleApplicable("ADMIN") || Utils.isRoleApplicable("CASHASSISTANT");

    // const fetchUrl = async (url) => {
    //   setLoading(true);
    //   try {
    //     const bearerToken = localStorage.getItem('token');
    //     const res = await fetch(url, {
    //       headers: { 'Authorization': `Bearer ${bearerToken}` }
    //     });
    //     const json = await res.json();
    //     let list = json.content || json._embedded?.expenses || [];
    //     list = list.filter(e => e.expenseType === 'CASH-OUT');
    //     setItems(list);
    //     setLinks(json._links || {});
    //   } catch (e) {
    //     console.error('Failed to fetch outward expenses:', e);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const today = new Date().toISOString().split("T")[0];
    const last7Days = new Date(Date.now() - 7 * 86400000)
        .toISOString()
        .split("T")[0];
    const [fromDate, setFromDate] = useState(last7Days);
    const [toDate, setToDate] = useState(today);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })

    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {

            const orgId = filterForm.getFieldValue('organizationId');
            const fromDate = filterForm.getFieldValue('fromDate').format('YYYY-MM-DD');
            const toDate = filterForm.getFieldValue('toDate').format('YYYY-MM-DD');

            const data = await fetchExpenses(currentPage - 1, pageSize, 'CASH-OUT', fromDate, toDate, orgId);
            const list = data.content || data._embedded?.expenses || [];

            setItems(list);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                pageSize,
                total: data.totalElements, // Total records from the API
            }));
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
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'string') return value;
        return String(value);
    };

    // Filter items based on search term
    const filteredItems = items.filter(item => {
        if (!searchTerm) return true;

        const searchLower = safeToString(searchTerm).toLowerCase();

        return (
            safeToString(item.description).toLowerCase().includes(searchLower) ||
            safeToString(item.employeeId).toLowerCase().includes(searchLower) ||
            safeToString(item.expenseSubType).toLowerCase().includes(searchLower) ||
            safeToString(item.amount).includes(searchTerm) // Direct number comparison without toLowerCase
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
            if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;

            // Handle different data types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            }

            // String comparison
            const aString = safeToString(aValue).toLowerCase();
            const bString = safeToString(bValue).toLowerCase();

            if (aString < bString) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aString > bString) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredItems, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };
    useEffect(() => {
        fetchData(pageParam, sizeParam);
    }, [pageParam, sizeParam, selectedOrgId, fromDate, toDate, isAdmin]);

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
            console.error('Invalid date:', dateString, e);
            return false;
        }
    };

    const fetchOrganizationsData = async () => {
        try {
            const data = await fetchOrganizations(0, 1000);
            setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
    };

    useEffect(() => {

        filterForm.setFieldsValue({
            organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null,
            fromDate: dayjs(new Date()).subtract(7, 'days'), // last 7 days
            toDate: dayjs(new Date()) // today
        });

        fetchOrganizationsData();
        fetchData(pagination.current, pagination.pageSize);
    }, []);


    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };


    // Get expense type color
    const getExpenseTypeColor = (type) => {
        const typeColors = {
            'SALARY': '#ef4444',
            'OFFICE_SUPPLIES': '#f59e0b',
            'TRAVEL': '#8b5cf6',
            'UTILITIES': '#06b6d4',
            'MAINTENANCE': '#84cc16',
            'OTHER': '#6b7280'
        };
        return typeColors[type] || '#6b7280';
    };

    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('fromDate')
            || changedValues.hasOwnProperty('toDate')) {
            fetchData(1, pagination.pageSize);
        }
    }

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchData(pagination.current, pagination.pageSize);
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
                        <Typography.Title className='page-title' level={2}>Cash Outward Management</Typography.Title>
                    </div>

                    {enableCreate && <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() => navigate("/pettycash/expenses/create?type=CASH-OUT")}
                                icon={<PlusOutlined/>}>
                            Create New Outward
                        </Button>
                    </div>}
                </div>

                <div className={'list-dashboard'}>
                    <Card>
                        <Statistic
                            styles={{
                                content: {color: 'red'},
                            }}
                            title="Total Outflow"
                            value={totalAmount?.toLocaleString() || '0'}
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
                            title="Average per Expense"
                            value={Math.round(averageExpense).toLocaleString()}
                            precision={2}
                            prefix={'₹'}
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

                <Table
                    className={'list-page-table'}
                    size={'large'}
                    dataSource={items}
                    columns={[
                        {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (item) => {
                                return (
                                    <Tag variant={'filled'} color={'green'}>
                                        ₹{item.toFixed(2)}
                                    </Tag>
                                )
                            }
                        },
                        {
                            title: 'Type',
                            dataIndex: 'expenseSubType',
                            key: 'expenseSubType',
                            render: (expenseSubType) => {
                                return (
                                    <Tag color={'blue'} key={expenseSubType} variant={'filled'}>
                                        {expenseSubType}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: 'Expense Date',
                            dataIndex: 'createdDate',
                            key: 'createdDate',
                            render: (createdDate) => {
                                if (!createdDate) return "-";
                                return dayjs(createdDate).format('DD-MM-YYYY');
                            },
                        },
                        {
                            title: 'Transaction Date',
                            dataIndex: 'transactionDate',
                            key: 'transactionDate',
                            render: (transactionDate) => {
                                if (!transactionDate) return "-";
                                return dayjs(transactionDate).format('DD-MM-YYYY');
                            },
                        },
                        {
                            title: 'Book',
                            dataIndex: 'gstapplicable',
                            key: 'gstapplicable',
                            render: (gstapplicable) => {
                                const color = gstapplicable ? "blue" : "grey";
                                return (
                                    <Tag color={color} key={gstapplicable} variant={'solid'}>
                                        {gstapplicable ? "Yes" : "No"}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: 'Receipt',
                            dataIndex: 'hasImage',
                            key: 'hasImage',
                            render: (hasImage, item) => {
                                if (!hasImage) return "(No receipt)";
                                return (
                                    <Button type={'link'}
                                            size={'small'}
                                            icon={<EditOutlined/>}
                                            onClick={async () => {
                                                const json = await fetchExpense(item.id);
                                                setModalFile(
                                                    json.imageData || json.fileUrl || json.file
                                                )
                                            }}
                                    >
                                        View
                                    </Button>
                                );
                            },
                        },
                        {
                            title: 'Actions',
                            key: 'operation',
                            fixed: 'end',
                            width: 200,
                            render: (item) => {
                                return <Tooltip title={'Edit Outward Transaction'}>
                                    <Button icon={<EditOutlined/>} aria-label='Edit Outward Transaction'
                                            onClick={() => navigate(`/pettycash/expenses/${item.id}/edit`)}
                                            variant={'outlined'}
                                            color={'default'}>Edit</Button>
                                </Tooltip>
                            },
                        }
                    ]}
                    onChange={handleTableChange}
                    pagination={{
                        ...pagination,
                        showTotal: FormUtils.listPaginationShowTotal,
                        itemRender: FormUtils.listPaginationItemRender,
                        showSizeChanger: true
                    }}
                    locale={{emptyText: "No outward transactions found"}}
                    loading={loading}/>


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

export default ExpensesOutwardListPage;