import React, {useState} from 'react';
import './DefaultAppSidebarLayout.css';
import logo from '../../assets/images/logo_clear.jpg';

import {DollarOutlined, HomeOutlined, LogoutOutlined, SettingOutlined} from '@ant-design/icons';
import {Avatar, Dropdown, Layout, Menu, Space, theme, Typography} from 'antd';
import {APP_TITLE} from "../../constants";
import {useNavigate} from "react-router-dom";

const {Header, Content, Sider, Footer} = Layout;


function getSideBarMenu() {
    return [
        {
            key: '1',
            icon: <HomeOutlined/>,
            label: 'Home',
            path: '/',
        },
        {
            key: '2',
            label: 'Petty Cash',
            icon: <DollarOutlined/>,
            children: [{
                key: '2-1',
                label: 'Masters',
                path: '/pettycash/masters'
            }]
        }
    ]
}

function profileMenu() {
    return {
        items: [
            {
                key: '1',
                label: 'Profile',
            },
            {
                key: '2',
                label: 'Settings',
                icon: <SettingOutlined/>,
            },
            {
                type: 'divider',
            },
            {
                key: '3',
                label: 'Logout',
                icon: <LogoutOutlined/>,
                danger: true,
            },
        ]
    }
}


export default function DefaultAppSidebarLayout({children, pageTitle}) {

    const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');

    const [collapsed, setCollapsed] = useState(false);

    const navigate = useNavigate();


    const {
        token: {colorBgContainer, borderRadiusLG, colorPrimary},
    } = theme.useToken();

    const siderStyle = {
        height: '100vh',
        position: 'sticky',
        insetInlineStart: 0,
        top: 0,
        scrollbarWidth: 'thin',
        scrollbarGutter: 'stable'
    };

    return (
        <Layout hasSider>
            <Sider style={siderStyle}
                   width={240}
                   collapsible
                   trigger={null}
                   collapsed={collapsed}

                   onCollapse={(value) => setCollapsed(value)}>
                <div className="sidebar-header">


                    <img className='sidebar-header-logo' src={logo} alt="Logo"/>

                    <Typography.Title level={3} className="sidebar-header-title">{APP_TITLE}</Typography.Title>

                    {/* <Button
                        className="sider-button"
                        shape="circle"
                        icon={collapsed ? <RightOutlined/> : <LeftOutlined/>}
                        onClick={() => setCollapsed(!collapsed)}></Button>*/}
                </div>


                <Menu theme={'dark'} mode="inline"
                      style={{borderInlineEnd: 'none'}}
                      onClick={(e) => {
                          navigate(e.item.props.path)
                      }}
                      defaultSelectedKeys={['4']} items={getSideBarMenu()}/>
            </Sider>


            <Layout>


                <Header className={'default-app-sidebar-layout-header'} style={{background: colorBgContainer}}>

                    <div className={'left-section'}>
                        <Typography.Title level={3} className="page-title">{pageTitle}</Typography.Title>
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
                    margin: '24px 16px 0',
                    overflow: 'initial',
                    padding: 24,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG
                }}>
                    {children}
                </Content>
                <Footer style={{textAlign: 'center'}}>
                    {APP_TITLE} © {new Date().getFullYear()}
                </Footer>
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