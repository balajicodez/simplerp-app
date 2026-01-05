import React from 'react';
import {Button, Result} from 'antd';
import {useAuth} from "../../hooks/useAuth";
import './LogoutPage.css';

export default function LogoutPage() {
    const {logout} = useAuth();


    logout();

    return <div className="page"></div>
};