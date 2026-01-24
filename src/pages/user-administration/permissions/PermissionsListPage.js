import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Form, Input, Table, Tooltip, Typography} from "antd";
import {DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined} from "@ant-design/icons";
import * as DataSource from "./PermissionsDataSource";
import {searchListByFields} from "../../../_layout/default-app-sidebar-layout/utils";
import FormUtils from "../../../_utils/FormUtils";

export default function PermissionsListPage() {
    const navigate = useNavigate();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })

    const formUtils = new FormUtils(AntApp.useApp());

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, []);

    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchData(pagination.current, pagination.pageSize);
    }

    const fetchData = async (currentPage, pageSize) => {
        try {
            setLoading(true);
            const data = await DataSource.fetchPermissions(currentPage - 1, pageSize);
            setRecords(data._embedded?.permissions || data || []);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                total: data.page.totalElements, // Total records from the API
            }));

        } catch (err) {
            console.error(err);
            formUtils.showErrorNotification("Failed to load permissions: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePermission = async (permission) => {


        const confirmed = formUtils.confirmDelete(`Are you sure you want to delete permission "${permission.name}"?`);

        if (!confirmed) {
            return;
        }

        setLoading(true);
        try {
            await DataSource.deletePermission(permission.id);
            formUtils.showSuccessNotification("Permission deleted successfully!");
            fetchData();
        } catch (err) {
            console.error(err.message);
            formUtils.showErrorNotification("Failed to delete permission");
        }

        setLoading(false);
    };


    const filteredRecords = FormUtils.searchListByFields(records, ['name'], searchTerm);

    return (
        <DefaultAppSidebarLayout pageTitle={'User Administration'}>


            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Permissions Management</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                disabled={loading}
                                onClick={() => navigate("/user-administration/permission/create")}
                                icon={<PlusOutlined/>}>
                            Create
                        </Button>
                    </div>
                </div>

                <Form className="filter-form"
                      layout={'inline'}>
                    <Form.Item name='searchTerm'>
                        <Input

                            placeholder="Search persmission..."
                            value={searchTerm}
                            size={'large'}
                            className='search-field'
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Item>

                </Form>

                <Table
                    className={'list-page-table'}
                    size={'large'}
                    dataSource={filteredRecords}
                    columns={[
                        {
                            title: 'Permission Name',
                            dataIndex: 'name',
                            key: 'name',
                        },
                        {
                            title: 'Actions',
                            key: 'operation',
                            fixed: 'end',
                            width: 300,
                            render: (permission) => {
                                return <div style={{display: 'flex', gap: '1rem'}}>
                                    <Tooltip title={'Edit Permission'}>
                                        <Button icon={<EditOutlined/>} aria-label='Edit Permission'
                                                onClick={() => navigate(`/user-administration/permission/${permission.id}`)}
                                                variant={'outlined'}
                                                color={'default'}>Edit</Button>
                                    </Tooltip>
                                    <Tooltip title={'Delete Permission'}>
                                        <Button icon={<DeleteOutlined/>} aria-label='Delete Permission'
                                                color={'danger'}
                                                onClick={() => deletePermission(permission)} variant={'outlined'}
                                        >Delete</Button>
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
                    loading={loading}/>
            </div>
        </DefaultAppSidebarLayout>
    );
}
