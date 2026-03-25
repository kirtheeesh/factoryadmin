import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        console.log('Login Success:', response.data);
    } catch (err: any) {
        console.log('Login Error:', err.response?.status, err.response?.data);
    }
}

testLogin();
