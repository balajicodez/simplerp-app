import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {App as AntApp, ConfigProvider} from "antd";

import ViewOrganization from './organization/ViewOrganization';
import CreateOrganization from './organization/CreateOrganization';
import Signup from "./login/Signup";
import Users from "./login/Users";
import Permissions from "./login/Permissions";
import Dashboard from './dashboard/Dashboard';
import Upload from './uploads/Upload';
import Download from './download/Download';
import About from './About';
import Report from './reports/Report';
import Register from "./login/Register";
import Roles from "./login/Roles";
import Employees from './employees/Employees';
import CreateEmployee from './employees/CreateEmployee';
import EmployeeView from './employees/EmployeeView';
import EditEmployee from './employees/EditEmployee';
import Expenses from './pettycash/Expenses';
import ExpensesInward from './pettycash/ExpensesInward';
import ExpensesOutward from './pettycash/ExpensesOutward';
import DayClosing from './pettycash/DayClosing';
import CreateDayClosing from './pettycash/CreateDayClosing';
import DayClosingReport from './reports/DayClosingReport';
import CreateExpense from './pettycash/CreateExpense';
import ExpenseMasters from './pettycash/ExpenseMasters';
import EditOrganization from './organization/EditOrganization'
import ExpenseView from './pettycash/ExpenseView';
import EditExpense from './pettycash/EditExpense';
import CreateExpenseMaster from './pettycash/CreateExpenseMaster';
import HolidayCalendar from './holidays/HolidayCalendar';
import HandLoanManagement from './HandloanManagement/HandloanManagement';
import LoginPage from "./pages/login/LoginPage";
import {AuthProvider} from "./hooks/useAuth";
import LogoutPage from "./pages/logout/LogoutPage";
import {ProtectedRoute} from "./_components/protected/ProtectedRoute";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: '"Roboto", serif',
                },
            }}
        >
            <AntApp>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage/>}/>
                            <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>


                            <Route path="/upload" element={<Upload/>}/>
                            <Route path="/reports" element={<Report/>}/>
                            <Route path="/download" element={<Download/>}/>
                            <Route path="/about" element={<About/>}/>
                            <Route path="/employees" element={<Employees/>}/>
                            <Route path="/employees/create" element={<CreateEmployee/>}/>
                            <Route path="/employees/:id" element={<EmployeeView/>}/>
                            <Route path="/employees/:id/edit" element={<EditEmployee/>}/>
                            <Route path="/pettycash/expenses" element={<Expenses/>}/>
                            <Route path="/pettycash/expenses-inward" element={<ExpensesInward/>}/>
                            <Route path="/login/register" element={<Register/>}/>
                            <Route path="/login/roles" element={<Roles/>}/>
                            <Route path="/login/users" element={<Users/>}/>
                            <Route
                                path="/permissions"
                                element={

                                    <Permissions/>
                                }
                            />

                            <Route
                                path="/pettycash/expenses-outward"
                                element={<ExpensesOutward/>}
                            />
                            <Route path="/pettycash/day-closing" element={<DayClosing/>}/>
                            <Route
                                path="/pettycash/day-closing/create"
                                element={<CreateDayClosing/>}
                            />
                            <Route path="/reports/day-closing" element={<DayClosingReport/>}/>
                            <Route path="/pettycash/expenses/create" element={<CreateExpense/>}/>
                            <Route path="/pettycash/expenses/:id" element={<ExpenseView/>}/>
                            <Route path="/pettycash/expenses/:id/edit" element={<EditExpense/>}/>
                            <Route path="/pettycash/masters" element={<ExpenseMasters/>}/>
                            <Route
                                path="/pettycash/masters/create"
                                element={<CreateExpenseMaster/>}
                            />
                            <Route path="/organization/edit/:id" element={<EditOrganization/>}/>

                            <Route path="/organization" element={<ViewOrganization/>}/>
                            <Route path="/organization/create" element={<CreateOrganization/>}/>
                            <Route path="/holidays" element={<HolidayCalendar/>}/>
                            <Route path="/signup" element={<Signup/>}/>
                            <Route path="handloans" element={<HandLoanManagement/>}/>

                            <Route path="/logout" element={<LogoutPage/>}/>
                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
