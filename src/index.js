import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {App as AntApp, ConfigProvider} from "antd";

import ViewOrganization from './organization/ViewOrganization';
import CreateOrganization from './organization/CreateOrganization';

import LoginPage from './pages/login/LoginPage';
import Signup from "./login/Signup";
import Users from "./login/Users";
import Permissions from "./login/Permissions";
import DashboardPage from './pages/dashboard/DashboardPage';
import Upload from './uploads/Upload';
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
import ExpenseMastersListPage from './pages/petty-cash/expense-masters/ExpenseMastersListPage';
import EditOrganization from './organization/EditOrganization'
import ExpenseView from './pettycash/ExpenseView';
import EditExpense from './pettycash/EditExpense';
import ExpenseMasterFormPage from './pages/petty-cash/expense-masters/ExpenseMasterFormPage';
import HolidayCalendar from './holidays/HolidayCalendar';
import HandLoanManagement from './HandloanManagement/HandloanManagement';
import {ProtectedRoute} from "./_components/protected/ProtectedRoute";
import {AuthProvider} from "./hooks/useAuth";
import LogoutPage from "./pages/logout/LogoutPage";
import NotFoundPage from "./pages/not-found/NotFoundPage";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                token: {
                    fontFamily: '"Noto Sans", sans-serif',
                },
            }}
        >
            <AntApp>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path='*' element={<NotFoundPage/>}/>
                            <Route path="/login" element={<LoginPage/>}/>
                            <Route path="/logout" element={<LogoutPage/>}/>

                            <Route path="/" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>


                            <Route path="/upload" element={<ProtectedRoute><Upload/></ProtectedRoute>}/>
                            <Route path="/reports" element={<Report/>}/>

                            <Route path="/employees" element={<Employees/>}/>
                            <Route path="/employees/create" element={<CreateEmployee/>}/>
                            <Route path="/employees/:id" element={<EmployeeView/>}/>
                            <Route path="/employees/:id/edit" element={<EditEmployee/>}/>


                            <Route path="/pettycash/expenses" element={<Expenses/>}/>
                            <Route path="/pettycash/expenses-inward" element={<ExpensesInward/>}/>

                            <Route path="/pettycash/handloans" element={<HandLoanManagement/>}/>


                            <Route
                                path="/pettycash/expense-masters"
                                element={<ExpenseMastersListPage/>}/>
                            <Route
                                path="/pettycash/expense-master"
                                element={<ProtectedRoute><ExpenseMasterFormPage/></ProtectedRoute>}
                            />
                            <Route
                                path="/pettycash/expense-master/:id"
                                element={<ProtectedRoute><ExpenseMasterFormPage/></ProtectedRoute>}
                            />


                            <Route path="/login/register" element={<Register/>}/>


                            <Route path="/user-administration/users" element={<Users/>}/>
                            <Route path="/user-administration/roles" element={<Roles/>}/>
                            <Route path="/user-administration/organizations" element={<ViewOrganization/>}/>
                            <Route path="/organization/edit/:id" element={<EditOrganization/>}/>

                            <Route path="/organization/create" element={<CreateOrganization/>}/>


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


                            <Route path="/holidays" element={<HolidayCalendar/>}/>
                            <Route path="/signup" element={<Signup/>}/>


                            <Route path="/logout" element={<LoginPage/>}/>
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
