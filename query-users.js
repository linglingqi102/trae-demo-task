// 查询数据库中所有用户数据的脚本
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// 连接到MongoDB数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
}

// 查询所有用户数据
async function queryAllUsers() {
  try {
    const users = await User.find({});
    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log('\n用户信息:');
      console.log(`ID: ${user._id}`);
      console.log(`用户名: ${user.username}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`手机号: ${user.phone}`);
      console.log(`创建时间: ${user.createdAt}`);
    });
  } catch (error) {
    console.error('查询用户失败:', error.message);
  }
}

// 执行查询
async function main() {
  await connectDB();
  await queryAllUsers();
  // 关闭数据库连接
  mongoose.connection.close();
}

main();