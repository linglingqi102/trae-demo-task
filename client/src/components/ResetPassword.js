import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import 'antd/dist/reset.css';
import authService from '../services/authService';

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.resetPassword(resetToken, { password: values.password });
      message.success('密码重置成功，请登录');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      message.error(err.response?.data?.msg || '密码重置失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '40px 20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>重置密码</h2>
      <Form
        form={form}
        name="resetPassword"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少为6个字符' }
          ]}
        >
          <Input.Password placeholder="输入新密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          rules={[
            { required: true, message: '请确认新密码' },
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
          <Input.Password placeholder="再次输入新密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            重置密码
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPassword;