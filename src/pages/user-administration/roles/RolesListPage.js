import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./Roles.css";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Button, Form, Input, Table, Tooltip, Typography} from "antd";
import {DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined} from "@ant-design/icons";
import FormUtils from "../../../_utils/FormUtils";
import * as DataSource from "./DataSource";
import * as PermissionsDataSource from "../permissions/DataSource";

export default function RolesListPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [records, setRecords] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE
    })

    const formUtils = new FormUtils(AntApp.useApp());

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
        fetchPermissions();
    }, []);

    const fetchData = async (currentPage, pageSize) => {
        try {
            setLoading(true);
            const data = await DataSource.fetchRoles(currentPage - 1, pageSize);

            setRecords(data._embedded?.roles || []);

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

    const fetchPermissions = async () => {
        const data = await PermissionsDataSource.fetchPermissions(0, 1000)
        setPermissions(data._embedded?.permissions || []);
    };


    const deleteRole = async (role) => {

        const confirmed = await formUtils.confirmDelete(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`);

        if (!confirmed) {
            return;
        }

        setLoading(true);
        try {
            await DataSource.deleteRole(role.id);
            formUtils.showSuccessNotification("Role deleted successfully!");
            fetchData();
        } catch (err) {
            console.error(err.message);
            formUtils.showErrorNotification("Failed to delete role");
        }

        setLoading(false);
    };


    const handleTableChange = (pagination) => {
        // This function is triggered when the user changes the page
        fetchData(pagination.current, pagination.pageSize);
    }

    const filteredRecords = FormUtils.searchListByFields(records, ['name', 'description'], searchTerm);

    return (
        <DefaultAppSidebarLayout pageTitle={'User Administration'}>

            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Role Management</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'default'}
                                size={'large'}
                                disabled={loading}
                                onClick={() => navigate("/user-administration/permissions")}
                                icon={<LockOutlined/>}>
                            Manage Permissions
                        </Button>

                        <Button type={'primary'}
                                size={'large'}
                                disabled={loading}
                                onClick={() => navigate("/user-administration/role/create")}
                                icon={<PlusOutlined/>}>
                            Create
                        </Button>
                    </div>
                </div>


                <Form className="filter-form"
                      layout={'inline'}>
                    <Form.Item name='searchTerm'>
                        <Input
                            className='search-field'
                            placeholder="Search roles by name or description..."
                            value={searchTerm}
                            size={'large'}
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
                            title: 'Role Name',
                            dataIndex: 'name',
                            key: 'name',
                        },
                        {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                        },
                        {
                            title: 'Actions',
                            key: 'operation',
                            fixed: 'end',
                            width: 300,
                            render: (role) => {
                                return <div style={{display: 'flex', gap: '1rem'}}>
                                    <Tooltip title={'Edit Permission'}>
                                        <Button icon={<EditOutlined/>} aria-label='Edit Permission'
                                                onClick={() => navigate(`/user-administration/role/${role.id}`)}
                                                variant={'outlined'}
                                                color={'default'}>Edit</Button>
                                    </Tooltip>
                                    <Tooltip title={'Delete Permission'}>
                                        <Button icon={<DeleteOutlined/>} aria-label='Delete Permission'
                                                color={'danger'}
                                                onClick={() => deleteRole(role)} variant={'outlined'}
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
                        itemRender: FormUtils.listPaginationItemRender
                    }}
                    loading={loading}/>
            </div>
        </DefaultAppSidebarLayout>
    );
}
