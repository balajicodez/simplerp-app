import React, {useEffect, useState} from 'react';
import '../../../pettycash/PettyCash.css';
import {useNavigate} from 'react-router-dom';
import DefaultAppSidebarLayout from "../../../_components/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Button, Table, Typography} from "antd";
import {DollarOutlined, PlusOutlined} from "@ant-design/icons";
import {fetchExpenseMaterTypes} from "./expenseTypeMasterApiService";
import {PRETTY_CASE_PAGE_TITLE} from "../PrettyCaseConstants";


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
    }
];


function ExpenseMastersListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);

        (async () => {
            try {
                const data = await fetchExpenseMaterTypes(0);
                // Access the _embedded property from the parsed data
                const expenseTypes = data._embedded.expenseTypeMasters;
                setItems(expenseTypes);  // Set the expense types to state
                setLoading(false);
            } catch (e) {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <DefaultAppSidebarLayout pageTitle={PRETTY_CASE_PAGE_TITLE}>

            <div className='list-page-header'>
                <div className={'page-title-section'}>
                    <Typography.Title className='page-title' level={4}>Expense Masters</Typography.Title>
                </div>

                <div className={'page-actions'}>
                    <Button type={'primary'}
                            size={'large'}
                            onClick={() => navigate("/pettycash/masters/create")} icon={<PlusOutlined/>}>
                        Create
                    </Button>
                </div>

            </div>

            <Table
                className={'list-page-table'}
                size={'large'}
                dataSource={items}
                columns={columns}
                loading={loading}/>
        </DefaultAppSidebarLayout>
    );
}

export default ExpenseMastersListPage;

