import React from 'react';
import { Button, message } from 'antd';
import 'antd/dist/reset.css';

export default function MessageTest() {
  const showSuccessMessage = () => {
    message.success('这是一条成功消息');
  };

  const showErrorMessage = () => {
    message.error('这是一条错误消息');
  };

  const showInfoMessage = () => {
    message.info('这是一条信息消息');
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>消息测试</h2>
      <Button type="primary" onClick={showSuccessMessage} style={{ marginRight: '10px' }}>
        显示成功消息
      </Button>
      <Button type="danger" onClick={showErrorMessage} style={{ marginRight: '10px' }}>
        显示错误消息
      </Button>
      <Button onClick={showInfoMessage}>
        显示信息消息
      </Button>
    </div>
  );
}