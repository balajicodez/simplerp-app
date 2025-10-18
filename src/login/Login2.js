import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from './../assets/images/logo.jpg';
import Dashboard from './../dashboard/Dashboard';

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
        <div>             
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <table style={{ width: '100%' }}>   
                <tr>        
                <td style={{ width: '100%' }}>
                <img src={logo} style={{ width: '68%', overflow: 'hidden' }}/>
                </td>
                <td style={{ width: '100%', overflow: 'hidden' }}>               
                <div style={{align: 'left'}}>  
                    <h1>DataSynOps</h1>                   
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label>Password:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit">Login</button>
                    </form>
                    </div>
                </td>
                </tr>
            </table>
        </div>
    );
}

export default Login;
