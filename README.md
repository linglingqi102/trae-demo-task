# 多人任务管理系统

这是一个基于React和Node.js的多人任务管理系统，提供任务创建、分配、跟踪和统计功能。

## 功能特性

- 用户认证（注册、登录、密码重置）
- 任务管理（创建、编辑、删除、状态更新）
- 任务分类（标签、优先级、状态）
- 任务关系（父子任务）
- 任务可视化（看板、日历、甘特图）
- 用户统计和任务统计

## 技术栈

### 前端
- React
- Ant Design
- React Router
- Axios
- Recharts

### 后端
- Node.js
- Express
- MongoDB
- Mongoose
- JWT认证

## 安装说明

1. 克隆仓库
```
git clone https://github.com/linglingqi102/trae-demo-task.git
cd trae-demo-task
```

2. 安装依赖
```
npm install
cd client
npm install
cd ..
```

3. 配置环境变量
创建.env文件并配置以下内容：
```
PORT=5001
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_USER=your_email@163.com
EMAIL_PASS=your_email_password
```

4. 启动应用
```
npm start
```

5. 在浏览器中访问
http://localhost:3000