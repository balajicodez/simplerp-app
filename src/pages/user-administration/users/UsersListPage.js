import React, {useEffect, useState} from "react";
import "./Users.css";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {App as AntApp, Avatar, Button, Form, Input, Select, Table, Tag, theme, Typography} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
import FormUtils from "../../../_utils/FormUtils";
import * as UserDataSource from "./UsersDataSource";
import * as OrganizationDataSource from "../organizations/OrganizationDataSource";
import UserRolesTags from "./UserRoleTags";

export default function UsersListPage() {

    const navigate = useNavigate();

    const {
        token: {colorPrimary},
    } = theme.useToken();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: FormUtils.LIST_DEFAULT_PAGE_SIZE,
        sorter: {field: 'username', order: "descend"}
    })
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [organizations, setOrganizations] = useState([]);

    const formUtils = new FormUtils(AntApp.useApp());

    useEffect(() => {

        (async () => {
            const onLoadOrgs = await fetchOrganizations();
            await fetchUsers(pagination.current, pagination.pageSize, pagination.sorter, onLoadOrgs);
        })();
    }, []);

    const fetchUsers = async (currentPage, pageSize, sorter, onLoadOrgs) => {
        setLoading(true);
        try {
            const data = await UserDataSource.fetchUsers(currentPage - 1, pageSize);

            // Handle different response formats
            const usersList = data._embedded?.users || data.users || data || [];

            usersList.forEach(user => {
                user.organizationName = (onLoadOrgs || organizations).find(org => org.id === user.organizationId)?.name;
            })

            setUsers(usersList);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                pageSize,
                sorter,
                total: data.page.totalElements, // Total records from the API
            }));
        } catch (err) {
            console.error(err);
            formUtils.showErrorNotification("Failed to load users: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const data = await OrganizationDataSource.fetchOrganizations(0, 100);
            const orgs = data._embedded?.organizations || [];
            setOrganizations(orgs);
            return orgs;
        } catch (err) {
            console.error("Failed to fetch organizations", err);
        }
    };

    // Filter users based on search term
    const filteredUsers = FormUtils.searchListByFields(users, ['username', 'email', 'organizationName', 'status'], searchTerm);

    const handleTableChange = (pagination, _, sorter) => {
        // This function is triggered when the user changes the page

        fetchUsers(pagination.current, pagination.pageSize, sorter);
    }


    return (
        <DefaultAppSidebarLayout pageTitle={'User Administration'}>
            <div className="list-page">


                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>User Management</Typography.Title>
                    </div>

                    <div className={'page-actions'}>

                        <Button type={'primary'}
                                size={'large'}
                                disabled={loading}
                                onClick={() => navigate("/user-administration/user/create")}
                                icon={<PlusOutlined/>}>
                            Create
                        </Button>
                    </div>
                </div>

                <Form className="filter-form"
                      layout={'inline'}>
                    <Form.Item name='searchTerm'>
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            size={'large'}
                            className='search-field'
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Item>

                    {/*<Form.Item
                        name="organizationId"
                    >
                        <Select
                            placeholder="Select Organization"
                            onChange={handleOrganizationChange}
                            size={'large'}
                            style={{width: 200}}
                            options={organizations.map(org => ({label: org.name, value: org.id}))}
                        />
                    </Form.Item>*/}

                </Form>


                <Table
                    className={'list-page-table'}
                    size={'large'}
                    dataSource={filteredUsers}
                    columns={[
                        {
                            title: 'User Name',
                            dataIndex: 'username',
                            key: 'username',
                            render: (username) => {
                                return <div className="user-cell">
                                    <Avatar
                                        style={{backgroundColor: colorPrimary}}>{getAvatarInitials(username)}</Avatar> {username}
                                </div>
                            }
                        },
                        {
                            title: 'Email',
                            dataIndex: 'email',
                            key: 'email',
                        },
                        {
                            title: 'Branch',
                            key: 'organizationName',
                            render: (item) => item.organizationName
                        },
                        {
                            title: 'Roles',
                            key: 'roles',
                            render: (user) => {
                                return <UserRolesTags userId={user.id} />
                            }
                        },
                        {
                            title: 'Status',
                            key: 'status',
                            render: (item) => {
                                let color = item.active ? 'blue' : 'gray';
                                return (
                                    <Tag variant={'solid'} color={color} key={item.status}>
                                        {item.active ? 'Active' : 'Inactive'}
                                    </Tag>
                                );
                            },
                        },
                        /*{
                            title: 'Actions',
                            key: 'operation',
                            fixed: 'end',
                            width: 300,
                            render: (role) => {
                                return <div style={{display: 'flex', gap: '1rem'}}>
                                    <Tooltip title={'Edit Permission'}>
                                        <Button icon={<EditOutlined/>} aria-label='Edit User'
                                                onClick={() => navigate(`/user-administration/user/${role.id}`)}
                                                variant={'outlined'}
                                                color={'default'}>Edit</Button>
                                    </Tooltip>
                                </div>
                            },
                        }*/
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

function getAvatarInitials(name) {
    // 1. Null/Undefined/Empty Check
    if (!name || typeof name !== 'string') return "";

    return name
        .trim()                 // Remove leading/trailing whitespace
        .split(/\s+/)           // Split by one or more spaces
        .map(word => word[0])   // Take the first character of each word
        .join('')               // Combine them
        .toUpperCase();         // Capitalize the result
}