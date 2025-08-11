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

// 修复任务的子任务数组
async function fixTaskSubtasks() {
  try {
    const taskId = '689054e0e897c17b30f101e5';
    console.log(`修复任务: ${taskId}`);

    // 查询主任务
    const mainTask = await Task.findById(taskId);
    if (!mainTask) {
      console.log('未找到任务');
      return;
    }

    console.log('修复前 - 主任务标题:', mainTask.title);
    console.log('修复前 - subTasks数组长度:', mainTask.subTasks.length);
    console.log('修复前 - subTasks数组内容:', mainTask.subTasks);

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
        // 将缺失的子任务添加到mainTask的subTasks数组中
        mainTask.subTasks.push(task._id);
      });
      // 保存更新后的mainTask
      await mainTask.save();
      console.log('已更新主任务的subTasks数组');
      
      // 验证更新结果
      const updatedTask = await Task.findById(taskId);
      console.log('修复后 - subTasks数组长度:', updatedTask.subTasks.length);
      console.log('修复后 - subTasks数组内容:', updatedTask.subTasks);
    } else {
      console.log('所有子任务都已包含在subTasks数组中，无需修复');
    }
  } catch (err) {
    console.error('修复出错:', err);
  } finally {
    // 关闭数据库连接
    mongoose.disconnect();
  }
}

// 执行修复
fixTaskSubtasks();