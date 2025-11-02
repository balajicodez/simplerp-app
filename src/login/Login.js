import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from './../assets/images/logo.jpg';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();

    const validate = () => {
        if (!email) return 'Email is required';
        // simple email regex
        const re = /\S+@\S+\.\S+/;
        if (!re.test(email)) return 'Please enter a valid email address';
        if (!password) return 'Password is required';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setLoading(true);
        try {
            // keep axios call for future API wiring; currently mock success
            // const response = await axios.post('/api/login', { email, password });
            // localStorage.setItem('authToken', response.data.token);
            // optionally persist email if "remember me" checked
            if (remember) localStorage.setItem('rememberedEmail', email);
            else localStorage.removeItem('rememberedEmail');

            // Simulate success (remove setTimeout when real API is connected)
            await new Promise((r) => setTimeout(r, 700));
            navigate('/dashboard');
        } catch (err) {
            setError('Login failed. Please check your credentials and try again.');
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

    // prevent vertical scrollbar on login page while mounted
    React.useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, []);

    return (
        <div className="login-page">
            <div className="login-card" role="main" aria-labelledby="loginHeading">
                <div className="brand">
                    <img src={logo} alt="DataSynOps logo" />
                    <h1 id="loginHeading">SimplERP - Sri Divya Sarees</h1>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <div className="error" role="alert">
                            {error}
                        </div>
                    )}

                    <label htmlFor="email">Email/Employee ID</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="username"
                        disabled={loading}
                    />

                    <label htmlFor="password">Password</label>
                    <div className="password-row">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="show-pass"
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword((s) => !s)}
                            tabIndex={0}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <div className="options">
                        <label className="remember">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                disabled={loading}
                            />
                            Remember me
                        </label>

                        <a className="forgot" href="#/forgot">Forgot?</a>
                    </div>

                    <button className="primary" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" aria-hidden="true" /> : 'Login'}
                    </button>

                    <div className="signup">Need an account? <a href="#/signup">Sign up</a></div>
                </form>
            </div>
        </div>
    );
}

export default Login;
