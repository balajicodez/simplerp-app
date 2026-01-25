import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Utils from '../../../Utils';
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
    App as AntApp,
    Button,
    Card,
    DatePicker,
    Form,
    Modal,
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
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants";

function ExpensesOutwardListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [organizations, setOrganizations] = useState([]);

    const [filterForm] = Form.useForm();
    const navigate = useNavigate();
    const formUtils = new FormUtils(AntApp.useApp());

    // Calculate statistics for outward expenses
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTransactions = items.length;
    const averageExpense = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    const isAdmin = Utils.isRoleApplicable('ADMIN');
    const enableCreate = Utils.isRoleApplicable("ADMIN") || Utils.isRoleApplicable("CASHASSISTANT");


    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })

    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {

            const orgId = filterForm.getFieldValue('organizationId');
            const fromDate = filterForm.getFieldValue('fromDate').format(DATE_SYSTEM_FORMAT);
            const toDate = filterForm.getFieldValue('toDate').format(DATE_SYSTEM_FORMAT);

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

                            <Form.Item
                                name="fromDate"
                                label="From Date"
                            >
                                <DatePicker
                                    format={DATE_DISPLAY_FORMAT}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>
                            <Form.Item
                                name="toDate"
                                label="To Date"
                            >
                                <DatePicker
                                    format={DATE_DISPLAY_FORMAT}
                                    style={{width: "100%"}}
                                />
                            </Form.Item>

                </Form>

                <Table
                    className={'list-page-table'}
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
                                const color = getExpenseTypeColor(expenseSubType);
                                return (
                                    <Tag color={color} key={expenseSubType} variant={'filled'}>
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
                                return dayjs(createdDate).format(DATE_DISPLAY_FORMAT);
                            },
                        },
                        {
                            title: 'Transaction Date',
                            dataIndex: 'transactionDate',
                            key: 'transactionDate',
                            render: (transactionDate) => {
                                if (!transactionDate) return "-";
                                return dayjs(transactionDate).format(DATE_DISPLAY_FORMAT);
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