const mongoose = require('mongoose');
const Task = require('./models/Task');
const fs = require('fs');
require('dotenv').config();

// 连接到MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 查询所有任务及其子任务，重点关注dueDate字段
async function queryAllTasksWithSubtasks() {
  console.log('开始查询任务及其dueDate字段...');
  try {
    // 查询所有任务，包含subTasks和dueDate字段
    const tasks = await Task.find({}).select('_id title subTasks parentTask dueDate');
    console.log(`找到 ${tasks.length} 个任务`);

    // 准备输出内容
    let output = `共找到 ${tasks.length} 个任务:\n\n`;
    tasks.forEach(task => {
      output += `任务ID: ${task._id}\n`;
      output += `任务标题: ${task.title}\n`;
      output += `父任务ID: ${task.parentTask || '无'}\n`;
      output += `子任务数量: ${task.subTasks.length}\n`;
      output += `子任务ID列表: ${task.subTasks.join(', ')}\n`;
      // 检查任务是否有dueDate字段
      if ('dueDate' in task && task.dueDate) {
        console.log(`任务 ${task._id} (${task.title}) 的dueDate: ${task.dueDate}`);
        console.log(`任务 ${task._id} (${task.title}) 的dueDate类型: ${typeof task.dueDate}`);
        output += `dueDate: ${task.dueDate}\n`;
        output += `dueDate类型: ${typeof task.dueDate}\n`;
      } else {
        console.log(`任务 ${task._id} (${task.title}) 没有dueDate字段或dueDate为空`);
        output += `没有dueDate字段或dueDate为空\n`;
      }
      output += '----------------------------\n\n';
    });

    // 输出到控制台
    console.log(output);

    // 写入到文件
    fs.writeFileSync('tasks-subtasks-output.txt', output, 'utf8');
    console.log('查询结果已保存到 tasks-subtasks-output.txt 文件');

    // 关闭数据库连接
    mongoose.disconnect();
  } catch (err) {
    console.error('查询任务失败:', err);
    mongoose.disconnect();
  }
}

// 执行查询
queryAllTasksWithSubtasks();