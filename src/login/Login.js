import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
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

        if (remember) localStorage.setItem('rememberedEmail', email);
        else localStorage.removeItem('rememberedEmail');

        await new Promise((r) => setTimeout(r, 700));

        setLoading(true);
        try {
            const res = await fetch(APP_SERVER_URL_PREFIX + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to create employee');
            navigate('/dashboard');
            localStorage.setItem('token', data.token);
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

    React.useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, []);

    return (
        <div className="login-page">

            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>

            <div className="login-card" role="main" aria-labelledby="loginHeading">
                <div className="brand">
                    <img src={logo} alt="DataSynOps logo" />
                    <h3 id="loginHeading">SimplERP - Sri Divya Sarees</h3>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>


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
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                disabled={loading}
                                id='check'
                            />
                            Remember me
                        </label>

                        <a className="forgot" href="#/forgot">Forgot Password?</a>
                    </div>
                    {error && (
                        <div className="error" role="alert">
                            {error}
                        </div>
                    )}
                    <button className="primary" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" aria-hidden="true" /> : 'Login to Dashboard'}
                    </button>

                    <div className="signup">
                        Need an account? <a href="#/signup">Sign up here</a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;