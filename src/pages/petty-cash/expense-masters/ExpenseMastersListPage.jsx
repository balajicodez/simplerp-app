import React, {useEffect, useState} from 'react';
import '../../../pettycash/PettyCash.css';
import {useNavigate} from 'react-router-dom';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Button, Table, Tooltip, Typography} from "antd";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";
import {fetchExpenseMaterTypes} from "./expenseTypeMasterApiService";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";




const PAGE_SIZE = 10;


export default function ExpenseMastersListPage() {

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGE_SIZE
    })
    const navigate = useNavigate();


    const columns = [
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
        },
        {
            title: 'Actions',
            key: 'operation',
            fixed: 'end',
            width: 100,
            render: (item) => {
                return <Tooltip title={'Edit Expense Master'}>
                    <Button icon={<EditOutlined/>} aria-label='Edit' onClick={() => navigate(`/pettycash/expense-master/${item.id}`)} variant={'outlined'} color={'default'}/>
                </Tooltip>
            },
        }
    ];


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
            setItems(expenseTypes);  // Set the expense types to state
            setLoading(false);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                total: data.page.totalElements, // Total records from the API
            }));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
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

            <div className='list-page-header'>
                <div className={'page-title-section'}>
                    <Typography.Title className='page-title' level={2}>Expense Masters</Typography.Title>
                </div>

                <div className={'page-actions'}>
                    <Button type={'primary'}
                            size={'large'}
                            onClick={() => navigate("/pettycash/expense-master")} icon={<PlusOutlined/>}>
                        Create
                    </Button>
                </div>

            </div>

            <Table
                className={'list-page-table'}
                size={'large'}
                dataSource={items}
                columns={columns}
                onChange={handleTableChange}
                pagination={{
                    ...pagination,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                }}
                loading={loading}/>
        </DefaultAppSidebarLayout>
    );
}

