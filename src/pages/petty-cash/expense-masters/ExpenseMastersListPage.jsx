import React, {useEffect, useState} from 'react';
import '../../../pettycash/PettyCash.css';
import {useNavigate} from 'react-router-dom';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Table, Tag, Tooltip, Typography} from "antd";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {fetchExpenseMaterTypes} from "./DataSource";
import {PRETTY_CASE_PAGE_TITLE, PRETTY_CASE_TYPES} from "../PrettyCaseConstants";
import FormUtils from "../../../_utils/FormUtils";



export default function ExpenseMastersListPage() {

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })
    const navigate = useNavigate();
    const formUtils = new FormUtils(AntApp.useApp());

    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {
            // Replace with your actual API endpoint
            const data = await fetchExpenseMaterTypes(currentPage - 1, pageSize);

            // Access the _embedded property from the parsed data
            const expenseTypes = data._embedded.expenseTypeMasters;
            expenseTypes.forEach(expenseType => {
                expenseType.key = expenseType.id;
            })
            setRecords(expenseTypes);  // Set the expense types to state
            setLoading(false);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                total: data.page.totalElements, // Total records from the API
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
            formUtils.showErrorNotification("Failed to fetch organizations");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, []);

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchData(pagination.current, pagination.pageSize);
    }

    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Expense Masters</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() => navigate("/pettycash/expense-master/create")} icon={<PlusOutlined/>}>
                            Create
                        </Button>
                    </div>

                </div>

                <Table
                    className={'list-page-table'}
                    size={'large'}
                    dataSource={records}
                    columns={[
                        {
                            title: 'Sub-Type',
                            dataIndex: 'subtype',
                            key: 'subtype',
                        },
                        {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                        },
                        {
                            title: 'Type',
                            dataIndex: 'type',
                            key: 'type',
                            render: (type) => {
                                let color = type === PRETTY_CASE_TYPES.CASH_IN.value ? 'green' : 'volcano';
                                return (
                                    <Tag color={color} key={type} variant={'solid'}>
                                        {type}
                                    </Tag>
                                );
                            },
                        },
                        {
                            title: 'Actions',
                            key: 'operation',
                            fixed: 'end',
                            width: 200,
                            render: (item) => {
                                return <Tooltip title={'Edit Expense Master'}>
                                    <Button icon={<EditOutlined/>} aria-label='Edit Expense Master'
                                            onClick={() => navigate(`/pettycash/expense-master/${item.id}`)} variant={'outlined'}
                                            color={'default'}>Edit</Button>
                                </Tooltip>
                            },
                        }
                    ]}
                    onChange={handleTableChange}
                    pagination={{
                        ...pagination,
                        showTotal: FormUtils.listPaginationShowTotal,
                        itemRender: FormUtils.listPaginationItemRender
                    }}
                    loading={loading}/>
            </div>
        </DefaultAppSidebarLayout>
    );
}

