import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Radio, message } from 'antd';
import 'antd/dist/reset.css';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { resetMethod, email, phone } = values;
      // 确保发送resetMethod参数给后端
      const data = {
        resetMethod,
        ...(resetMethod === 'email' ? { email } : { phone })
      };
      await authService.forgotPassword(data);
      message.success('密码重置链接已发送，请查收');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      message.error(err.response?.data?.msg || '发送失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: 8, backgroundColor: 'white', textAlign: 'center' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>找回密码</h2>
      <Form
        form={form}
        name="forgotPassword"
        layout="vertical"
        onFinish={onFinish}
        style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}
      >
        <Form.Item name="resetMethod" label="重置方式" initialValue="email">
          <Radio.Group>
            <Radio value="email">电子邮箱</Radio>
            <Radio value="phone">手机号</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="email"
          label="电子邮箱"
          dependencies={['resetMethod']}
          rules={[
            ({ getFieldValue }) => (
              getFieldValue('resetMethod') === 'email'
                ? { required: true, message: '请输入电子邮箱' }
                : []
            ),
            { type: 'email', message: '请输入有效的电子邮箱地址' }
          ]}
        >
          <Input placeholder="输入注册时的电子邮箱" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="手机号"
          dependencies={['resetMethod']}
          rules={[
            ({ getFieldValue }) => (
              getFieldValue('resetMethod') === 'phone'
                ? { required: true, message: '请输入手机号' }
                : []
            ),
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]}
        >
          <Input placeholder="输入注册时的手机号" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            发送重置链接
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link to="/login">返回登录</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;