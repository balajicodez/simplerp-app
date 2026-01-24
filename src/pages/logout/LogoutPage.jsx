import React from 'react';
import {useAuth} from "../../hooks/useAuth";
import './LogoutPage.css';

export default function LogoutPage() {
    const {logout} = useAuth();


    logout();

    return <div className="page"></div>
};