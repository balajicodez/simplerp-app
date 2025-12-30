import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {APP_SERVER_URL_PREFIX, APP_TITLE} from "../../constants.js";
import logo from './../../assets/images/logo_clear.jpg';
import './Login.css';
import {jwtDecode} from "jwt-decode";
import {LockOutlined, UserOutlined} from '@ant-design/icons';
import {Alert, Button, Card, Checkbox, Divider, Form, Image, Input, Typography} from 'antd';


function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);

    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        setLoading(true);

        if (remember) localStorage.setItem('rememberedEmail', email);
        else localStorage.removeItem('rememberedEmail');

        try {
            const res = await fetch(APP_SERVER_URL_PREFIX + '/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: email, password: password}),
            });
            const data = await res.json();

            if (!res.ok) throw new Error('Failed to login');
            navigate('/dashboard');
            const decodedPayload = jwtDecode(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.userName);
            localStorage.setItem('organizationId', data.organizationId);
            localStorage.setItem('roles', decodedPayload.roles);
        } catch (err) {
            setError({
                title: 'Login failed. Please enter a valid username and password.'
            });
        } finally {
            setLoading(false);
        }

    };

    React.useEffect(() => {
        const remembered = localStorage.getItem('rememberedEmail');
        if (remembered) {
            setEmail(remembered);
            setRemember(true);
        }
    }, []);

    return (
        <div className="login-page">


            <Card className="login-card" role="main" aria-labelledby="loginHeading">

                <div className="brand-img" id="loginHeading">
                    <Image preview={false} src={logo} alt="Logo"/>
                    <Typography.Title level={2} style={{margin: 0}}>{APP_TITLE}</Typography.Title>
                </div>

                <Divider/>

                {error && <Alert className="login-error-message"
                                 title={error.title}
                                 description={error.description}
                                 type="error"
                                 showIcon/>}

                <Form
                    name="login"
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="login-form">


                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[{required: true, message: 'Please input your Username!'}]}
                    >
                        <Input value={email}
                               prefix={<UserOutlined/>}
                               onChange={(e) => setEmail(e.target.value)}
                               placeholder="Username"
                               disabled={loading}/>
                    </Form.Item>


                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{required: true, message: 'Please input your Password!'}]}
                    >
                        <Input.Password
                            value={password}
                            prefix={<LockOutlined/>}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            disabled={loading}/>
                    </Form.Item>

                    <Form.Item>
                        <Checkbox id="check" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                                  disabled={loading}>Remember me</Checkbox>
                    </Form.Item>


                    <Form.Item>
                        <Button htmlType="submit"
                                loading={loading}
                                block
                                size="large"
                                type="primary">{loading ? "Logging in..." : "Login"}</Button>
                    </Form.Item>

                    <div>Need an account? <a href="/signup">Sign up!</a></div>
                </Form>
            </Card>
        </div>
    );
}

export default Login;