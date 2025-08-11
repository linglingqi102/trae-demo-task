const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  subTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  title: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['待办', '进行中', '已完成'],
    default: '待办'
  },
  priority: {
    type: String,
    enum: ['高', '中', '低'],
    default: '中'
  },
  dueDate: {    type: Date  },  
  // 重复任务相关字段
  isRecurring: {    type: Boolean,    default: false  },
  recurrencePattern: {    type: String,    enum: ['daily', 'weekly', 'monthly', 'yearly'],    default: 'daily'  },
  recurrenceInterval: {    type: Number,    default: 1  },
  recurrenceEnd: {    type: Date  },
  recurrenceNeverEnd: {    type: Boolean,    default: true  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 查找任务的所有子任务
TaskSchema.methods.getSubTasks = async function() {
  return await Task.find({ parentTask: this._id });
};

// 添加子任务
TaskSchema.methods.addSubTask = async function(subTaskId) {
  if (!this.subTasks.includes(subTaskId)) {
    this.subTasks.push(subTaskId);
    await this.save();
  }
  return this;
};

// 移除子任务
TaskSchema.methods.removeSubTask = async function(subTaskId) {
  this.subTasks = this.subTasks.filter(id => id.toString() !== subTaskId.toString());
  await this.save();
  return this;
};

// 设置更新时间中间件
TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Task = mongoose.model('Task', TaskSchema);

// 中间件：当删除任务时，同时删除其子任务
TaskSchema.pre('remove', async function(next) {
  // 删除所有子任务
  await Task.deleteMany({ parentTask: this._id });
  // 从父任务的subTasks数组中移除当前任务
  if (this.parentTask) {
    const parentTask = await Task.findById(this.parentTask);
    if (parentTask) {
      await parentTask.removeSubTask(this._id);
    }
  }
  next();
});

module.exports = Task;