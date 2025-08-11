import axios from 'axios';

// 创建axios实例
const api = axios.create();

// 请求拦截器添加令牌
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器检测令牌过期
// 添加防抖标志避免重复登出重定向
let isRefreshing = false;

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      // 令牌过期，执行登出
      logout();
      // 重定向到登录页
      if (typeof window !== 'undefined') {
        // 避免立即重定向，给其他操作完成的时间
        setTimeout(() => {
          window.location.href = '/login';
          isRefreshing = false;
        }, 500);
      }
    }
    return Promise.reject(error);
  }
);

// 检查令牌是否过期
export const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// 注册用户
export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // 注册成功后立即设置令牌
      setAuthToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message);
    throw error;
  }
};

// 登录用户
export const login = async (userData) => {
  try {
    const response = await api.post('/api/auth/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // 登录成功后立即设置令牌
      setAuthToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
};

// 登出用户
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 获取当前用户
export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

// 设置认证令牌
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
    delete api.defaults.headers.common['x-auth-token'];
  }
};

// 找回密码
export const forgotPassword = async (data) => {
  const response = await axios.post('/api/auth/forgot-password', data);
  return response.data;
};

// 重置密码
export const resetPassword = async (resetToken, data) => {
  const response = await axios.put(`/api/auth/reset-password/${resetToken}`, data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  setAuthToken,
  forgotPassword,
  resetPassword
};

export default authService;
export { api };