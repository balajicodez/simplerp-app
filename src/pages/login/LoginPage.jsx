import React, {useState} from 'react';
import {APP_TITLE, CUSTOMER_TITLE} from "../../constants.js";
import logo from './../../assets/images/logo_clear.jpg';
import './LoginPage.css';
import {jwtDecode} from "jwt-decode";
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Checkbox, Divider, Form, Image, Input, Typography} from 'antd';
import {useAuth} from "../../hooks/useAuth";
import {loginApiCall} from "./loginApiService";


export default function LoginPage() {
    const [form] = Form.useForm();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const {login} = useAuth();


    const handleSubmit = async (e) => {
        
        setLoading(true);

        const formValues = form.getFieldsValue();

        if (formValues.isUsernameRemembered) localStorage.setItem('rememberedUsername', formValues.username);
        else localStorage.removeItem('rememberedUsername');

        try {
            const data = await loginApiCall(formValues.username, formValues.password);
            const decodedPayload = jwtDecode(data.token);


            localStorage.setItem('userName', data.userName);
            localStorage.setItem('organizationId', data.organizationId);
            localStorage.setItem('roles', decodedPayload.roles);

            // Session data - access it using useAuth hook
            login(data.token, {
                userName: data.userName,
                organizationId: data.organizationId,
                roles: decodedPayload.roles
            });
        } catch (err) {
            setError('Login failed. Please enter a valid username and password.');
        } finally {
            setLoading(false);
        }

    };

    React.useEffect(() => {
        const remembered = localStorage.getItem('rememberedUsername');
        if (remembered) {
            form.setFieldsValue({
                'username': remembered,
                'isUsernameRemembered': "checked"
            });
        }
    }, []);

    return (
        <div className="login-page">

            <div className={'login-illustration-section'}>
                <img src={'/logo.jpg'} alt="Logo" width={'400px'}/>
                <Typography.Title level={1} style={{margin: 0}}>{CUSTOMER_TITLE}</Typography.Title>
            </div>

            <div className={'login-form-section'}>

                <Card className="login-card" role="main" aria-labelledby="loginHeading">

                    <div className="brand-img" id="loginHeading">
                        <Typography.Title level={2} style={{margin: 0}}>{APP_TITLE}</Typography.Title>
                    </div>


                    {error && <Alert className="login-error-message"
                                     title={error}
                                     type="error"
                                     showIcon/>}

                    <Form
                        form={form}
                        name="login"
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="login-form">


                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[{required: true, message: 'Please input your Username!'}]}
                        >
                            <Input prefix={<UserOutlined/>}
                                   placeholder="Username"
                                   disabled={loading}/>
                        </Form.Item>


                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{required: true, message: 'Please input your Password!'}]}
                        >
                            <Input.Password
                                prefix={<LockOutlined/>}
                                placeholder="Password"
                                disabled={loading}/>
                        </Form.Item>

                        <Form.Item name="isUsernameRemembered" valuePropName="checked">
                            <Checkbox disabled={loading}>Remember me</Checkbox>
                        </Form.Item>


                        <Form.Item>
                            <Button htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    type="primary">{loading ? "Logging in..." : "Login"}</Button>
                        </Form.Item>

                        {/*<div>Need an account? <a href="/signup">Sign up!</a></div>*/}
                    </Form>
                </Card>

            </div>

        </div>
    );
}