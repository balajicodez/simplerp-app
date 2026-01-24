import React from 'react';
import './DashboardPage.css';
import DefaultAppSidebarLayout from "../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Card, Statistic, Typography} from "antd";
import {DollarOutlined, UsergroupAddOutlined} from "@ant-design/icons";


export default function DashboardPage() {
    return (
        <DefaultAppSidebarLayout pageTitle="Dashboard">


            {/*<div className="dashboard-grid">

                <Card className={'dash-employees-card'} variant="borderless">
                    <Statistic
                        title="Total Employees"
                        value={10}
                        prefix={<UsergroupAddOutlined/>}
                    />
                </Card>

                <Card className={'dash-loans-card'} variant="borderless">
                    <Statistic
                        title="Open Loans"
                        value={12}
                        prefix={<DollarOutlined/>}
                    />
                </Card>

                <Card className={'dash-cashin-card'} variant="borderless">
                    <Statistic
                        title="Cash In"
                        value={12}
                        prefix={"₹"}
                    />
                </Card>

                <Card className={'dash-cashout-card'} variant="borderless">
                    <Statistic
                        title="Cash Out"
                        value={170300}
                        prefix={"₹"}
                    />
                </Card>
            </div>*/}

            <div className="dashboard-insights-section">
                <Typography.Title level={4} style={{marginTop: 0}}>Quick Insights</Typography.Title>
                <Typography.Text>
                    Monitor your business performance at a glance. Stay updated with real-time metrics.
                </Typography.Text>
            </div>
        </DefaultAppSidebarLayout>
    );
}