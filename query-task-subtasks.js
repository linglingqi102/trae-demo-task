const mongoose = require('mongoose');
const Task = require('./models/task');
require('dotenv').config();

// 连接到MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 查询任务及其子任务
async function queryTaskSubtasks() {
  try {
    const taskId = '689054e0e897c17b30f101e5';
    console.log(`查询任务: ${taskId}`);

    // 查询主任务
    const mainTask = await Task.findById(taskId);
    if (!mainTask) {
      console.log('未找到任务');
      return;
    }

    console.log('主任务标题:', mainTask.title);
    console.log('subTasks数组长度:', mainTask.subTasks.length);
    console.log('subTasks数组内容:', mainTask.subTasks);

    // 查询所有子任务
    const subTasks = await Task.find({ parentTask: taskId });
    console.log('实际子任务数量:', subTasks.length);
    console.log('子任务列表:');
    subTasks.forEach(task => {
      console.log(`- ID: ${task._id}, 标题: ${task.title}`);
    });

    // 找出未包含在subTasks数组中的子任务
    const missingSubtasks = subTasks.filter(task => !mainTask.subTasks.includes(task._id));
    if (missingSubtasks.length > 0) {
      console.log('未包含在subTasks数组中的子任务:');
      missingSubtasks.forEach(task => {
        console.log(`- ID: ${task._id}, 标题: ${task.title}`);
        // 可选：将缺失的子任务添加到mainTask的subTasks数组中
        // mainTask.subTasks.push(task._id);
      });
      // 保存更新后的mainTask
      // await mainTask.save();
      // console.log('已更新主任务的subTasks数组');
    } else {
      console.log('所有子任务都已包含在subTasks数组中');
    }
  } catch (err) {
    console.error('查询出错:', err);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
}

// 执行查询
queryTaskSubtasks();