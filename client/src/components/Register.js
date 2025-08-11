import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import authService from '../services/authService';
import './TaskRegister.css';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
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
      await authService.register(values);
      message.success('注册成功，正在跳转...', 1.5, () => {
        if (mounted) {
          authService.setAuthToken(localStorage.getItem('token'));
          navigate('/');
        }
      });
    } catch (err) {
      message.error(err.response?.data?.msg || '注册失败，请重试', 3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-register-container">
      {/* 左侧面板 */}
      <div className="task-register-left-panel">
        <div className="task-register-logo">
          <div className="task-register-logo-icon"></div>
          <span>Task</span>
        </div>
        <h3>创建您的账户</h3>
        <p>加入我们的平台，体验高效的任务管理和协作</p>
      </div>

      {/* 右侧面板 */}
      <div className="task-register-right-panel">
        <div className="task-register-logo">
          <div className="task-register-logo-icon"></div>
          <span>Task</span>
        </div>
        <h1 className="task-register-title">创建账户</h1>
        <p className="task-register-subtitle">开始您的高效任务管理之旅</p>

        <Form
          name="register"
          layout="vertical"
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名长度不能少于3个字符' }
            ]}
            className="task-register-form-item"
          >
            <div className="task-register-form-input-container">
              <Input
                prefix={<UserOutlined className="task-register-input-icon" />}
                placeholder="输入用户名"
                className="task-register-form-input"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="email"
            label="电子邮箱"
            rules={[
              { required: true, message: '请输入电子邮箱' },
              { type: 'email', message: '请输入有效的电子邮箱地址' }
            ]}
            className="task-register-form-item"
          >
            <div className="task-register-form-input-container">
              <Input
                prefix={<MailOutlined className="task-register-input-icon" />}
                placeholder="输入电子邮箱"
                className="task-register-form-input"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
            className="task-register-form-item"
          >
            <div className="task-register-form-input-container">
              <Input
                prefix={<PhoneOutlined className="task-register-input-icon" />}
                placeholder="输入手机号"
                className="task-register-form-input"
              />
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少为6个字符' }
            ]}
            className="task-register-form-item"
          >
            <div className="task-register-form-input-container">
              <Input.Password
                prefix={<LockOutlined className="task-register-input-icon" />}
                placeholder="输入密码"
                className="task-register-form-input"
                visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              />
            </div>
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
            className="task-register-form-item"
          >
            <div className="task-register-form-input-container">
              <Input.Password
                prefix={<LockOutlined className="task-register-input-icon" />}
                placeholder="再次输入密码"
                className="task-register-form-input"
                visibilityToggle={{ visible: confirmPasswordVisible, onVisibleChange: setConfirmPasswordVisible }}
                iconRender={visible => visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              />
            </div>
          </Form.Item>

          <Form.Item name="agreement" valuePropName="checked" rules={[{ required: true, message: '请阅读并同意用户协议和隐私政策' }]} className="task-register-form-item">
            <Checkbox className="task-register-form-checkbox">
              我已阅读并同意 <a href="#" className="task-register-link">用户协议</a> 和 <a href="#" className="task-register-link">隐私政策</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="task-register-form-button"
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="task-register-footer">
          <p>已有账户? <Link to="/login" className="task-register-link">立即登录</Link></p>
          <p>© 2023 Task. 保留所有权利</p>
        </div>
      </div>
    </div>
  );
};

export default Register;