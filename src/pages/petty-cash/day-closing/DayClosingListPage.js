import React, {useEffect, useState} from "react";
import "./CreateDayClosing.css";
import {DATE_DISPLAY_FORMAT, DATE_SYSTEM_FORMAT} from "../../../constants.js";
import {useNavigate} from "react-router-dom";
import Utils from '../../../Utils';
import {getExpenseTagColor, PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, DatePicker, Form, Select, Table, Tag, Tooltip, Typography} from "antd";
import {EyeOutlined, PlusOutlined} from "@ant-design/icons";
import FormUtils from "../../../_utils/FormUtils";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import dayjs from "dayjs";
import {fetchDayClosingExpenses} from "./DayClosingDataSource";

function DayClosingListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const navigate = useNavigate();
    const isAdmin = Utils.isRoleApplicable('ADMIN');

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    });

    const [filterForm] = Form.useForm();

    const formUtils = new FormUtils(AntApp.useApp());


    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {

            const orgId = filterForm.getFieldValue('organizationId');
            const createdDate = filterForm.getFieldValue('createdDate').format(DATE_SYSTEM_FORMAT);

            const data = await fetchDayClosingExpenses(currentPage - 1, pageSize, createdDate, orgId);
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
            createdDate: dayjs(new Date()) // today
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
            || changedValues.hasOwnProperty('createdDate')) {
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
                        <Typography.Title className='page-title' level={2}>Day Closing Management</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() => navigate("/pettycash/day-closing/create")} icon={<PlusOutlined/>}>
                            Perform Day Closing
                        </Button>
                    </div>
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
                        name="createdDate"
                        label="Expense Date"
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
                            title: 'Type',
                            dataIndex: 'expenseType',
                            key: 'expenseType',
                            render: (expenseType) => {
                                return (
                                    <Tag color={getExpenseTagColor(expenseType)} key={expenseType} variant={'solid'}>
                                        {expenseType}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: 'Date',
                            dataIndex: 'createdDate',
                            key: 'createdDate',
                            render: (createdDate) => {
                                if (!createdDate) return "-";
                                return dayjs(createdDate).format(DATE_DISPLAY_FORMAT);
                            },
                        },
                        {
                            title: 'Branch',
                            key: 'branchName',
                            render: (item) => {
                                return (organizations.find(
                                            (org) =>
                                                String(org.id) ===
                                                String(item.organizationId)
                                        )?.name || "N/A");
                            },
                        },
                        {
                            title: 'Amount',
                            key: 'amount',
                            render: (item) => {
                                return (
                                    <Tag variant={'filled'} color={getExpenseTagColor(item.expenseType)}>
                                        ₹{item.amount?.toFixed(2)}
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
                            title: 'Created By',
                            dataIndex: 'createdByUser',
                            key: 'createdByUser',
                        },
                        {
                            title: 'Actions',
                            key: 'operation',
                            width: 300,
                            render: (expense) => {
                                return <div style={{display: 'flex', gap: '1rem'}}>
                                    <Tooltip title={'View Expense'}>
                                        <Button icon={<EyeOutlined/>}
                                                aria-label='Edit Permission'
                                                onClick={() => navigate(`/pettycash/expenses/${expense.id}`)}
                                                variant={'outlined'}
                                                color={'default'}>View</Button>
                                    </Tooltip>
                                </div>
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
            </div>
        </DefaultAppSidebarLayout>
    );
}

export default DayClosingListPage;
