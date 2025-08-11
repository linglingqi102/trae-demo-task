import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Radio } from 'antd';
// Removed unused icon imports
import 'antd/dist/reset.css';
import authService from '../services/authService';
import './TaskForgotPassword.css';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resetMethod, setResetMethod] = useState('email');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, phone } = values;
      // 确保发送resetMethod参数给后端
      const data = {
        resetMethod,
        ...(resetMethod === 'email' ? { email } : { phone })
      };
      await authService.forgotPassword(data);
      message.success('重置密码链接已发送，请查收', 3, () => {
        if (mounted) {
          navigate('/login');
        }
      });
    } catch (err) {
      message.error(err.response?.data?.msg || '发送失败，请重试', 3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-forgot-password-container">
      {/* 左侧面板 */}
      <div className="task-forgot-password-left-panel">
        <div className="task-forgot-password-logo">
          <div className="task-forgot-password-logo-icon"></div>
          <span>Task</span>
        </div>
        <h3>重置您的密码</h3>
        <p>只需几步，您就可以重新设置您的密码并恢复账户访问权限</p>
      </div>

      {/* 右侧面板 */}
      <div className="task-forgot-password-right-panel">
        <div className="task-forgot-password-logo">
          <div className="task-forgot-password-logo-icon"></div>
          <span>Task</span>
        </div>
        <h1 className="task-forgot-password-title">忘记密码</h1>
        <p className="task-forgot-password-subtitle">请选择重置方式</p>

        <Form
          name="forgotPassword"
          layout="vertical"
          onFinish={onFinish}
          form={form}
          className="task-forgot-password-form"
        >
          <Form.Item name="resetMethod" initialValue="email">
            <div className="task-forgot-password-form-radio-group">
              <Radio.Group
                value={resetMethod}
                onChange={(e) => setResetMethod(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="email" className="task-forgot-password-form-radio">
                  邮箱重置
                </Radio.Button>
                <Radio.Button value="phone" className="task-forgot-password-form-radio">
                  手机重置
                </Radio.Button>
              </Radio.Group>
            </div>
          </Form.Item>

          {resetMethod === 'email' ? (
            <Form.Item
              name="email"
              label="电子邮箱"
              rules={[
                { required: true, message: '请输入电子邮箱' },
                { type: 'email', message: '请输入有效的电子邮箱地址' }
              ]}
              className="task-forgot-password-form-item"
            >
              <div className="task-forgot-password-form-input-container">
                <Input
                  placeholder="输入注册时的电子邮箱"
                  className="task-forgot-password-form-input"
                />
              </div>
            </Form.Item>
          ) : (
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
              className="task-forgot-password-form-item"
            >
              <div className="task-forgot-password-form-input-container">
                <Input
                  placeholder="输入注册时的手机号"
                  className="task-forgot-password-form-input"
                />
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="task-forgot-password-form-button"
              block
            >
              发送重置链接
            </Button>
          </Form.Item>
        </Form>

        <div className="task-forgot-password-footer">
          <p>返回 <Link to="/login" className="task-forgot-password-link">登录页面</Link></p>
          <p>© 2023 Task. 保留所有权利</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;