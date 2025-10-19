import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export async function callapi(path, { method = 'POST', body = {}, headers = {}, navigate, ...rest } = {}) {
  const token = localStorage.getItem('token');
  const config = {
    url: API_BASE + path,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  };
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (method.toUpperCase() !== 'GET') {
    config.data = body;
  }
  try {
    const response = await axios(config);
    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 403) {
      localStorage.removeItem('token');
      if (navigate) {
        navigate('/');
      } else {
        window.location.href = '/';
      }
      return;
    }
    throw err;
  }
}
