import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, GithubOutlined, WechatOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import authService from '../services/authService';
import './TaskLogin.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values);
      authService.setAuthToken(localStorage.getItem('token'));
      if (values.remember) {
        localStorage.setItem('rememberedUser', values.username);
      } else {
        localStorage.removeItem('rememberedUser');
      }
      message.success('登录成功，正在跳转...', 1.5, () => {
        if (mounted) navigate('/');
      });
    } catch (err) {
      message.error(err.response?.data?.msg || '登录失败，请检查用户名和密码', 3);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform) => {
    message.info(`即将跳转到${platform}登录`);
    // 这里可以实现社交媒体登录逻辑
  };

  // 检查是否有记住的用户
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      form.setFieldsValue({ username: rememberedUser, remember: true });
    }
  }, [form]);

  return (
    <div className="task-login-container">
      {/* 左侧面板 */}
      <div className="task-left-panel">
        <div className="task-logo">
          <div className="task-logo-icon"></div>
          <span>Task</span>
        </div>
        <h3>现代化任务管理平台</h3>
        <p>高效协作，智能管理，让工作更轻松</p>
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
        <h1 className="task-title">欢迎回来</h1>
        <p className="task-subtitle">登录到您的账户，继续您的工作</p>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          form={form}
          initialValues={{ remember: false }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名长度不能少于3个字符' }
            ]}
            className="task-form-item"
          >
            <div className="task-form-input-container">
              <Input
                prefix={<UserOutlined className="task-input-icon" />}
                placeholder="用户名或邮箱"
                className="task-form-input"
                autoComplete="username"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能少于6个字符' }
            ]}
            className="task-form-item"
          >
            <div className="task-form-input-container">
              <Input.Password
                prefix={<LockOutlined className="task-input-icon" />}
                placeholder="密码"
                className="task-form-input"
                visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                autoComplete="current-password"
              />
            </div>
          </Form.Item>

          <div className="task-form-options">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="task-form-checkbox">
                记住我
              </Checkbox>
            </Form.Item>
            <Link to="/forgot-password" className="task-forgot-password">
              忘记密码?
            </Link>
          </div>

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
          <div className="task-divider-text">快捷登录</div>
          <div className="task-divider-line"></div>
        </div>

        <div className="task-social-login">
          <div 
            className="task-social-icon"
            onClick={() => handleSocialLogin('微信')}
          >
            <WechatOutlined />
          </div>
          <div 
            className="task-social-icon"
            onClick={() => handleSocialLogin('GitHub')}
          >
            <GithubOutlined />
          </div>
        </div>

        <div className="task-footer">
          <p>还没有账户? <Link to="/register">立即注册</Link></p>
          <p>© 2023 Task. 保留所有权利</p>
        </div>
      </div>
    </div>
  );
};

export default Login;