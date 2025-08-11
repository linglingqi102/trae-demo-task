require('dotenv').config();
const nodemailer = require('nodemailer');

// 创建邮件传输器
// 从.env文件读取SMTP配置
console.log('SMTP配置:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.EMAIL_USER
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // 使用TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // 允许自签名证书
  }
});

// 测试SMTP连接
const testSmtpConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP连接成功，认证通过');
  } catch (error) {
    console.error('SMTP连接失败:', error);
  }
};

testSmtpConnection();

// 发送密码重置邮件
const sendResetPasswordEmail = async (user, resetToken) => {
  // 检查是否使用了默认的邮箱密码配置
  if (process.env.EMAIL_PASS === 'your_163_authorization_code') {
    console.error('错误: 请在.env文件中配置正确的163邮箱授权码，而不是使用默认占位符');
    console.error('生成163邮箱授权码步骤:');
    console.error('1. 登录163邮箱网页版');
    console.error('2. 进入"设置" -> "POP3/SMTP/IMAP"');
    console.error('3. 开启"SMTP服务"');
    console.error('4. 点击"生成授权码"，按照提示操作');
    throw new Error('邮箱配置错误: 请设置正确的163邮箱授权码');
  }

  const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;

  const mailOptions = {
    from: {name: 'Task Manager', address: process.env.EMAIL_USER},
    to: user.email,
    subject: '密码重置请求',
    text: `您收到此邮件是因为您（或其他人）请求重置您的账户密码。请点击以下链接重置密码：

${resetUrl}

如果您没有请求重置密码，请忽略此邮件。此链接将在10分钟后过期。`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('密码重置邮件已发送');
  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    throw new Error('发送密码重置邮件失败');
  }
};

module.exports = {
  sendResetPasswordEmail
};