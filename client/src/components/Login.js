import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import authService from '../services/authService';
import './TaskLogin.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values);
      authService.setAuthToken(localStorage.getItem('token'));
      message.success('登录成功');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.msg || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-login-container">
      {/* 左侧面板 */}
      <div className="task-left-panel">
        <div className="task-logo">
          <div className="task-logo-icon"></div>
          <span>Task</span>
        </div>
        <h3>秒级创建，可共享的云开发环境</h3>
        <svg className="task-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#ffffff" fillOpacity="1" d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,213.3C672,213,768,171,864,165.3C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* 右侧面板 */}
      <div className="task-right-panel">
        <div className="task-logo">
          <div className="task-logo-icon"></div>
          <span>Task</span>
        </div>
        <h1 className="task-title">欢迎来到 Task</h1>
        <p className="task-subtitle">登录到您的账户，开始使用我们的服务</p>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              className="task-form-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              className="task-form-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="task-form-button"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="task-divider">
          <div className="task-divider-line"></div>
          <div className="task-divider-text">或</div>
          <div className="task-divider-line"></div>
        </div>

        <div className="task-social-login">
          <div className="task-social-icon">
            <span>微</span>
          </div>
          <div className="task-social-icon">
            <span>G</span>
          </div>
        </div>

        <div className="task-footer">
          <p>忘记密码? <Link to="/forgot-password">找回密码</Link></p>
          <p>陕ICP备12345678号-1 © 2023 Task</p>
        </div>
      </div>
    </div>
  );
};

export default Login;