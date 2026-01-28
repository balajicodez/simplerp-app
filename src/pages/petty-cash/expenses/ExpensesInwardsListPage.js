import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import Utils from '../../../Utils';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import {
    App as AntApp,
    Button,
    Card,
    DatePicker,
    Form,
    Modal,
    Select,
    Statistic, Table, Tag,
    Typography
} from "antd";
import {EyeOutlined, PlusOutlined} from "@ant-design/icons";
import {fetchExpense, fetchExpenses} from "./ExpensesDataSource";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";
import dayjs from "dayjs";
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants";

function ExpensesInwardsListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalFile, setModalFile] = useState(null);
    const [organizations, setOrganizations] = useState([]);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })

    const navigate = useNavigate();

    const [filterForm] = Form.useForm();

    const formUtils = new FormUtils(AntApp.useApp());

    // Calculate statistics
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTransactions = items.length;
    const isAdmin = Utils.isRoleApplicable("ADMIN");
    const enableCreate = Utils.isRoleApplicable("ADMIN") || Utils.isRoleApplicable("CASHASSISTANT");


    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {

            const orgId = filterForm.getFieldValue('organizationId');
            const fromDate = filterForm.getFieldValue('fromDate').format(DATE_SYSTEM_FORMAT);
            const toDate = filterForm.getFieldValue('toDate').format(DATE_SYSTEM_FORMAT);

            const data = await fetchExpenses(currentPage - 1, pageSize, 'CASH-IN', fromDate, toDate, orgId);
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

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchData(pagination.current, pagination.pageSize);
    }

    const resetPagination = () => {
        fetchData(1, pagination.pageSize);
    }


    const handleValueChange = (changedValues, allValues) => {
        if (changedValues.hasOwnProperty('organizationId')
            || changedValues.hasOwnProperty('fromDate')
            || changedValues.hasOwnProperty('toDate')) {
            resetPagination();
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
                            size={'small'}
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
                    size={'large'}
                    dataSource={items}
                    columns={[
                        {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (item) => {
                                return (
                                    <Tag variant={'filled'} color={'green'} >
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
                                    <Button
                                            size={'small'}
                                            icon={<EyeOutlined/>}
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
                        }
                    ]}
                    onChange={handleTableChange}
                    pagination={{
                        ...pagination,
                        showTotal: FormUtils.listPaginationShowTotal,
                        itemRender: FormUtils.listPaginationItemRender,
                        showSizeChanger: true
                    }}
                    locale={{emptyText: "No inward transactions found"}}
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

export default ExpensesInwardsListPage;