// 测试邮件发送功能
require('dotenv').config();
const { sendResetPasswordEmail } = require('./utils/emailService');

// 模拟用户数据
const testUser = {
  email: 'test@example.com',
  username: 'testuser'
};

// 测试发送密码重置邮件
const testEmail = async () => {
  try {
    console.log('开始测试邮件发送...');
    await sendResetPasswordEmail(testUser, 'test-reset-token');
    console.log('邮件发送成功！');
  } catch (error) {
    console.error('邮件发送测试失败:', error.message);
  }
};

testEmail();