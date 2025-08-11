import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import 'antd/dist/reset.css';
import authService from '../services/authService';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.register(values);
      authService.setAuthToken(localStorage.getItem('token'));
      navigate('/');
      window.location.reload();
      message.success('注册成功');
    } catch (err) {
      message.error(err.response?.data?.msg || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '40px 20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>注册</h2>
      <Form
        name="register"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="输入用户名" />
        </Form.Item>

        <Form.Item
          label="电子邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入电子邮箱' },
            { type: 'email', message: '请输入有效的电子邮箱地址' }
          ]}
        >
          <Input placeholder="输入电子邮箱" />
        </Form.Item>

        <Form.Item
          label="手机号"
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]}
        >
          <Input placeholder="输入手机号" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度至少为6个字符' }
          ]}
        >
          <Input.Password placeholder="输入密码" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
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
        >
          <Input.Password placeholder="再次输入密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Register;