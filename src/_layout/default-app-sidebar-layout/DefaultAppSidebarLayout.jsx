import React, {useEffect, useState} from 'react';
import './DefaultAppSidebarLayout.css';
import logo from '../../assets/images/logo_clear.jpg';

import {DollarOutlined, HomeOutlined, LineChartOutlined, LogoutOutlined, SettingOutlined} from '@ant-design/icons';
import {Avatar, Button, Divider, Dropdown, Layout, Menu, Space, theme, Typography} from 'antd';
import {APP_TITLE} from "../../constants";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth";
import {findItemByPath} from "./utils";

const {Header, Content, Sider, Footer} = Layout;


function getSideBarMenu(userRoles = []) {
    const menu = [
        {
            key: 'home',
            icon: <HomeOutlined/>,
            label: 'Home',
            path: '/',
        },
        {
            key: 'pettycash',
            label: 'Petty Cash',
            icon: <DollarOutlined/>,
            children: [{
                key: 'pettycash-expenses-inward',
                label: 'Cash Flow - Inward',
                path: '/pettycash/expenses-inward'
            }, {
                key: 'pettycash-expenses-outward',
                label: 'Cash Flow - Outward',
                path: '/pettycash/expenses-outward'
            }, {
                key: 'pettycash-handloans',
                label: 'Hand Loans',
                path: '/pettycash/handloans'
            },  {
                key: 'pettycash-day-closing',
                label: 'Day Closing',
                path: '/pettycash/day-closing',
                roles: ["ADMIN","CASHASSISTANT"]
            }, {
                key: 'pettycash-masters',
                label: 'Expenses - Masters',
                path: '/pettycash/expense-masters',
                roles: ["ADMIN","CASHASSISTANT"]
            }]
        },
        {
            key: 'reports',
            label: 'Reports',
            icon: <LineChartOutlined />,
            roles: ["ADMIN","CASHASSISTANT"],
            children: [{
                key: 'reports-day-closing',
                label: 'Day Closing Report',
                path: '/reports/day-closing'
            }]
        },
        {
            key: 'user-administration',
            label: 'User Administration',
            icon: <SettingOutlined/>,
            roles: ['ADMIN'],
            children: [
                {
                    key: 'user-administration-users',
                    label: 'Users',
                    path: '/user-administration/users'
                },
                {
                    key: 'user-administration-roles',
                    label: 'Roles',
                    path: '/user-administration/roles'
                },
                {
                    key: 'user-administration-organizations',
                    label: 'Organizations',
                    path: '/user-administration/organizations'
                }
            ]
        }
    ];

    // Recursive function to filter menu items
    const filterMenu = (list) => {
        return list
            .filter(item => {
                // 1. If no roles are defined, it's public
                if (!item.roles || item.roles.length === 0) return true;

                // 2. Check if user has at least one of the required roles
                return item.roles.some(role => userRoles.includes(role));
            })
            .map(item => {
                // 3. If the item has children, filter them recursively
                if (item.children) {
                    const filteredChildren = filterMenu(item.children);
                    return { ...item, children: filteredChildren };
                }
                return item;
            })
            // 4. Clean up: Don't show parent menus if all their children are hidden
            .filter(item => {
                if (item.children && item.children.length === 0 && !item.path) {
                    return false;
                }
                return true;
            });
    };

    return filterMenu(menu);
}








export default function DefaultAppSidebarLayout({children, pageTitle}) {

    const [userName] = useState(localStorage.getItem('userName') || 'User');
    const [collapsed, setCollapsed] = useState(false);

    const navigate = useNavigate();
    const {session, logout} = useAuth();


    const {
        token: {colorPrimary},
    } = theme.useToken();


    const location = useLocation();
    const sidebarMenu = getSideBarMenu(session?.roles || []);
    const selectedItem = findItemByPath(sidebarMenu,location.pathname);
    const allTopMenuKeys = sidebarMenu.map(item => item.key);


    // collapsing sidebar on resize
    useEffect(() => {
        const onResize = () => setCollapsed(window.innerWidth < 900);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    function profileMenu() {
        return {
            items: [
                {
                    key: 'profile',
                    label: 'Profile',
                },
                {
                    key: 'logout',
                    label: 'Logout',
                    icon: <LogoutOutlined/>,
                    danger: true,
                    onClick: () => {
                        logout();
                    }
                },
            ]
        }
    }


    return (
        <Layout hasSider>
            <Sider className={'default-sidebar'}
                   width={240}
                   collapsible
                   collapsed={collapsed}

                   onCollapse={(value) => setCollapsed(value)}>
                <div className="sidebar-header">


                    <img className='sidebar-header-logo' src={logo} alt="Logo"/>

                    { !collapsed &&  <Typography.Title level={4} className="sidebar-header-title">{APP_TITLE}</Typography.Title>}


                </div>


                <Menu mode="inline"
                      theme="dark"
                      className={"sidebar-menu"}
                      onClick={(e) => {
                          navigate(e.item.props.path)
                      }}
                      defaultOpenKeys={allTopMenuKeys}
                      defaultSelectedKeys={[selectedItem?.key || 'home']}
                      items={sidebarMenu}/>


                <div className="sider-button-spacing"></div>

                <div className="sider-button">
                    <Button color="danger" variant="filled" block icon={<LogoutOutlined/>} onClick={() => {
                        logout()
                    }}>{ !collapsed && 'Logout'}</Button>
                </div>

            </Sider>


            <Layout className={'default-app-sidebar-layout'}>


                <Header className={'default-app-sidebar-layout-header'}>

                    <div className={'left-section'}>
                        <Typography.Title level={4} className="page-title">{pageTitle}</Typography.Title>
                    </div>

                    <div className={'right-section'}>
                        <Dropdown menu={profileMenu()}>
                        <span>
                            <Space>
                                <div className="user-menu">
                                    <Avatar style={{backgroundColor: colorPrimary, verticalAlign: 'middle'}}
                                            size="large">
                                        {getAvatarInitials(userName)}
                                    </Avatar>
                                    {userName}
                                </div>
                            </Space>
                        </span>
                        </Dropdown>
                    </div>
                </Header>
                <Content style={{
                    padding: '2rem 3rem',
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 64px)',
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
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