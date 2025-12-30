import React from 'react';
import {Button, Result} from 'antd';
import {useAuth} from "../../hooks/useAuth";
import './LogoutPage.css';

export default function LogoutPage() {
    const {openLoginPage} = useAuth();

    return <div className="logout-page">
        <Result
            status="success"
            title="You are logged out"
            subTitle="You are logged out. To see your account, please log in again."
            extra={[
                <Button type="primary" key="console" size="large" onClick={() => openLoginPage()}>
                    Log in
                </Button>
            ]}
        />
    </div>
};