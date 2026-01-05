import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {fetchOrganizations} from "./organizationApiService";
import {App as AntApp, Button, Form, Input, Table, Tag, Tooltip, Typography} from "antd";
import {EditOutlined, PlusOutlined} from "@ant-design/icons";

const PAGE_SIZE = 10;

function OrganizationListPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: PAGE_SIZE
    })
    const navigate = useNavigate();

    const {notification} = AntApp.useApp();

    const showErrorNotification = (message) => {
        notification.error({
            title: message,
            placement: 'top',
        });
    };

    const showSuccessNotification = (message) => {
        notification.success({
            message: message,
            placement: 'top',
        });
    }

    const columns = [
        {
            title: 'Organization',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Registration',
            dataIndex: 'registrationNo',
            key: 'registrationNo',

        },
        {
            title: 'Tax Details',
            key: 'taxDetails',
            render: (item) => {
                return item.gstn || item.pan
            },
        },
        {
            title: 'Contact Info',
            dataIndex: 'contact',
            key: 'contact',
        },
        {
            title: 'Status',
            key: 'status',
            render: (item) => {
                let color = item.status === 'Active' ? 'green' : 'volcano';
                return (
                    <Tag color={color} key={item.status}>
                        {item.status}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'operation',
            fixed: 'end',
            width: 100,
            render: (item) => {
                return <Tooltip title={'Edit Organization'}>
                    <Button icon={<EditOutlined/>} aria-label='Edit Organization'
                            onClick={() => navigate(`/user-administration/organization/${item.id}`)} variant={'outlined'}
                            color={'default'}>Edit</Button>
                </Tooltip>
            },
        }
    ];

    const fetchData = async (currentPage, pageSize) => {
        setLoading(true);
        try {
            // Replace with your actual API endpoint
            const data = await fetchOrganizations(currentPage - 1, pageSize);
            setItems(data._embedded ? data._embedded.organizations || [] : data);
            setLoading(false);

            setPagination(prev => ({
                ...prev,
                current: currentPage,
                total: data.page.totalElements, // Total records from the API
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
            showErrorNotification("Failed to fetch organizations");
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

    const filteredItems = items.filter(
        (org) =>
            org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.gstn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DefaultAppSidebarLayout pageTitle={"User Administration"}>

            <div className="list-page">
                <div className='list-page-header'>
                    <div className={'page-title-section'}>
                        <Typography.Title className='page-title' level={2}>Organizations</Typography.Title>
                    </div>

                    <div className={'page-actions'}>
                        <Button type={'primary'}
                                size={'large'}
                                onClick={() => navigate("/user-administration/organization/create")}
                                icon={<PlusOutlined/>}>
                            Create
                        </Button>
                    </div>
                </div>


                <Form className="filter-form"
                      layout={'inline'}>
                    <Form.Item name='searchTerm'>
                        <Input
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </Form.Item>

                </Form>

                <Table
                    className={'list-page-table'}
                    size={'large'}
                    dataSource={filteredItems}
                    columns={columns}
                    onChange={handleTableChange}
                    pagination={{
                        ...pagination,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                    }}
                    loading={loading}/>
            </div>
        </DefaultAppSidebarLayout>
    );
}

export default OrganizationListPage;
