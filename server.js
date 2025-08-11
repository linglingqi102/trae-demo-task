const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// 加载环境变量
dotenv.config();

// 连接MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}) .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 引入路由
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// 使用路由
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 服务静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// 启动服务器
// 修改端口为5002以避免冲突
const PORT = 5002;
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log('服务器已成功启动，等待连接...');
});

// 处理服务器错误
server.on('error', (err) => {
  console.error('服务器错误:', err);
});

// 确保进程保持运行
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});