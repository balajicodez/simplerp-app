import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from './../assets/images/logo.jpg';
import './Login.css';
import './../App.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const history = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://yourapi.com/login', { email, password });
            localStorage.setItem('authToken', response.data.token);

        } catch (err) {
            //setError('Invalid credentials');
            history('/dashboard');
        }
    };

    return (
        <body>
            <div class="image-container">
                <img src={logo} />
                <div class="overlay-text">
                    <form onSubmit={handleSubmit}>
                        <table align="left">
                            <tr>
                                <th> <label>Email:</label></th>
                                <th>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </th>
                            </tr>
                            <tr>
                                <th> <label>Password:</label></th>
                                <th>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </th>
                            </tr>
                            <tr >
                                <th style={{ colSpan: '30%' }}></th>
                                <th style={{ colSpan: '30%' }}>
                                    <button class="login" align="center" type="submit">Login</button>
                                </th>
                                <th style={{ colSpan: '30%' }}></th>
                            </tr>
                        </table>
                    </form></div>
            </div>
        </body>
    );
}

export default Login;
