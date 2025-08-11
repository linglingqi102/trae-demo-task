const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// 验证状态值的中间件
const validateStatus = (req, res, next) => {
  const { status } = req.body;
  if (status && !['待办', '进行中', '已完成'].includes(status)) {
    return res.status(400).json({ msg: '无效的任务状态: 待办, 进行中, 已完成' });
  }
  next();
};

// 批量操作验证中间件
const validateBatchOperation = (req, res, next) => {
  const { taskIds } = req.body;
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ msg: '请提供有效的任务ID数组' });
  }
  next();
};

// @route   GET /api/tasks
// @desc    获取当前用户的任务和共享的任务
// @access  私有
router.get('/', auth, async (req, res) => {
  try {
    // 获取任务
    const tasks = await Task.find({
      $or: [
        { user: req.user.id },
        { sharedWith: req.user.id }
      ]
    }).sort({ createdAt: -1 }).populate('user', ['username', 'email']).populate('sharedWith', ['username', 'email']).populate('parentTask', ['title', '_id']);

    // 添加hasSubtasks字段
    const tasksWithSubtasksInfo = tasks.map(task => {
      return {
        ...task.toObject(),
        hasSubtasks: task.subTasks && task.subTasks.length > 0
      };
    });

    res.json(tasksWithSubtasksInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   GET /api/tasks/:id
// @desc    获取单个任务
// @access  私有
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('user', ['username', 'email']).populate('sharedWith', ['username', 'email']).populate('parentTask', ['title', '_id']);

    if (!task) {
      return res.status(404).json({ msg: '任务不存在' });
    }

    // 检查任务是否属于当前用户或共享给当前用户
    if (task.user.toString() !== req.user.id && !task.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ msg: '无权访问此任务' });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).send('服务器错误');
  }
});

// @route   POST /api/tasks
// @desc    创建任务
// @access  私有
router.post('/', auth, async (req, res) => {
  const { title, description, status, priority, dueDate, sharedWith, parentTask, tags, isRecurring, recurrencePattern, recurrenceInterval, recurrenceEnd, recurrenceNeverEnd } = req.body;

    try {
      const newTask = new Task({        user: req.user.id,        title,        description,        status,        priority: priority || '中',        dueDate,        sharedWith: sharedWith || [],        parentTask: parentTask || null,        tags: tags || [],        isRecurring: isRecurring || false,        recurrencePattern: recurrencePattern || 'daily',        recurrenceInterval: recurrenceInterval || 1,        recurrenceEnd,        recurrenceNeverEnd: recurrenceNeverEnd !== false      });

      await newTask.save();

      // 如果有父任务，将当前任务添加到父任务的subTasks数组中
      if (parentTask) {
        const parent = await Task.findById(parentTask);
        if (parent) {
          await parent.addSubTask(newTask._id);
        }
      }

    const task = await Task.findById(newTask.id)
      .populate('user', ['username', 'email'])
      .populate('sharedWith', ['username', 'email'])
      .populate('parentTask', ['title']);
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   PUT /api/tasks/:id
// @desc    更新任务
// @access  私有
router.put('/:id', auth, validateStatus, async (req, res) => {
  console.log('===== PUT /api/tasks/:id 接口调试开始 =====');
  console.log('请求参数:', req.params);
  console.log('请求体:', req.body);
  
  const { title, description, status, priority, dueDate, sharedWith, parentTask, tags, isRecurring, recurrencePattern, recurrenceInterval, recurrenceEnd, recurrenceNeverEnd } = req.body;

  // 构建要更新的任务对象
  const taskFields = {};
  if (title) taskFields.title = title;
  if (description) taskFields.description = description;
  if (status) taskFields.status = status;
  if (priority) taskFields.priority = priority;
  if (dueDate) taskFields.dueDate = dueDate;
  if (sharedWith !== undefined) taskFields.sharedWith = sharedWith;
  if (parentTask !== undefined) taskFields.parentTask = parentTask;
  if (tags !== undefined) taskFields.tags = tags || [];
  if (isRecurring !== undefined) taskFields.isRecurring = isRecurring;
  if (recurrencePattern !== undefined) taskFields.recurrencePattern = recurrencePattern;
  if (recurrenceInterval !== undefined) taskFields.recurrenceInterval = recurrenceInterval;
  if (recurrenceEnd !== undefined) taskFields.recurrenceEnd = recurrenceEnd;
  if (recurrenceNeverEnd !== undefined) taskFields.recurrenceNeverEnd = recurrenceNeverEnd;

  console.log('要更新的字段:', taskFields);

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      console.log('任务不存在:', req.params.id);
      return res.status(404).json({ msg: '任务不存在' });
    }

    console.log('找到的任务:', task);

    // 检查是否为任务所有者或共享用户
    if (task.user.toString() !== req.user.id && !task.sharedWith.includes(req.user.id)) {
      console.log('无权更新此任务:', { userId: req.user.id, taskUser: task.user.toString(), sharedWith: task.sharedWith });
      return res.status(403).json({ msg: '无权更新此任务' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: taskFields }, { new: true })
      .populate('user', ['username', 'email'])
      .populate('sharedWith', ['username', 'email'])
      .populate('parentTask', ['title', '_id']);

    console.log('更新后的任务:', task);
    console.log('===== PUT /api/tasks/:id 接口调试结束 =====');
    res.json(task);
  } catch (err) {
    console.error('更新任务错误:', err.message);
    console.log('===== PUT /api/tasks/:id 接口调试结束(错误) =====');
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).send('服务器错误');
  }
});

// @route   POST /api/tasks/:id/subtasks
// @desc    为任务添加子任务
// @access  私有
router.post('/:id/subtasks', auth, async (req, res) => {
  try {
    const parentTask = await Task.findById(req.params.id);

    if (!parentTask) {
      return res.status(404).json({ msg: '父任务不存在' });
    }

    // 检查是否为任务所有者或共享用户
    if (parentTask.user.toString() !== req.user.id && !parentTask.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ msg: '无权为该任务添加子任务' });
    }

    const { title, description, status, priority, dueDate } = req.body;

    // 创建新的子任务
    const newSubTask = new Task({
      user: req.user.id,
      parentTask: req.params.id,
      title,
      description,
      status: status || '待办',
      priority: priority || '中',
      dueDate
    });

    await newSubTask.save();

    // 将子任务添加到父任务的subTasks数组中
    await parentTask.addSubTask(newSubTask._id);

    // 填充相关字段后返回
    const populatedSubTask = await Task.findById(newSubTask._id)
      .populate('user', ['username', 'email'])
      .populate('parentTask', ['title']);

    res.json(populatedSubTask);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).send('服务器错误');
  }
});

// @route   GET /api/tasks/:id/subtasks
// @desc    获取任务的所有子任务
// @access  私有
router.get('/:id/subtasks', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: '任务不存在' });
    }

    // 检查是否为任务所有者或共享用户
    if (task.user.toString() !== req.user.id && !task.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ msg: '无权访问该任务的子任务' });
    }

    // 获取子任务
    const subTasks = await Task.find({ parentTask: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', ['username', 'email']);

    res.json(subTasks);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).send('服务器错误');
  }
});

// @route   DELETE /api/tasks/:id/subtasks/:subTaskId
// @desc    从任务中移除子任务
// @access  私有
router.delete('/:id/subtasks/:subTaskId', auth, async (req, res) => {
  try {
    const parentTask = await Task.findById(req.params.id);

    if (!parentTask) {
      return res.status(404).json({ msg: '父任务不存在' });
    }

    // 检查是否为任务所有者或共享用户
    if (parentTask.user.toString() !== req.user.id && !parentTask.sharedWith.includes(req.user.id)) {
      return res.status(403).json({ msg: '无权修改该任务' });
    }

    // 检查子任务是否存在
    const subTask = await Task.findById(req.params.subTaskId);

    if (!subTask) {
      return res.status(404).json({ msg: '子任务不存在' });
    }

    // 确保子任务属于父任务
    if (subTask.parentTask.toString() !== req.params.id) {
      return res.status(400).json({ msg: '该任务不是指定父任务的子任务' });
    }

    // 移除子任务
    await subTask.remove();

    res.json({ msg: '子任务已删除' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).send('服务器错误');
  }
});

// @route   DELETE /api/tasks/batch
// @desc    批量删除任务
// @access  私有
router.delete('/batch', auth, validateBatchOperation, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ msg: '请提供有效的任务ID数组' });
    }

    // 查找所有任务，不管所有权
    const allTasks = await Task.find({
      _id: { $in: taskIds }
    });

    // 找出不存在的任务ID
    const existingTaskIds = allTasks.map(task => task._id.toString());
    const nonExistingTaskIds = taskIds.filter(id => !existingTaskIds.includes(id));

    if (nonExistingTaskIds.length > 0) {
      return res.status(404).json({
        msg: '部分任务不存在',
        nonExistingTaskIds: nonExistingTaskIds
      });
    }

    // 查找用户拥有的任务
    const userTasks = await Task.find({
      _id: { $in: taskIds },
      user: req.user.id
    });

    // 找出用户无权删除的任务ID
    const userTaskIds = userTasks.map(task => task._id.toString());
    const unauthorizedTaskIds = taskIds.filter(id => !userTaskIds.includes(id));

    if (unauthorizedTaskIds.length > 0) {
      return res.status(403).json({
        msg: '部分任务您无权删除',
        unauthorizedTaskIds: unauthorizedTaskIds
      });
    }

    // 删除所有匹配的任务
    await Task.deleteMany({
      _id: { $in: taskIds },
      user: req.user.id
    });

    res.json({ msg: '任务已批量删除', deletedCount: taskIds.length });
  } catch (err) {
    console.error('批量删除任务错误:', err.message);
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

// @route   DELETE /api/tasks/batch
// @desc    批量删除任务
// @access  私有
router.delete('/batch', auth, validateBatchOperation, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ msg: '请提供有效的任务ID数组' });
    }

    // 查找所有任务，不管所有权
    const allTasks = await Task.find({
      _id: { $in: taskIds }
    });

    // 找出不存在的任务ID
    const existingTaskIds = allTasks.map(task => task._id.toString());
    const nonExistingTaskIds = taskIds.filter(id => !existingTaskIds.includes(id));

    if (nonExistingTaskIds.length > 0) {
      return res.status(404).json({
        msg: '部分任务不存在',
        nonExistingTaskIds: nonExistingTaskIds
      });
    }

    // 查找用户拥有的任务
    const userTasks = await Task.find({
      _id: { $in: taskIds },
      user: req.user.id
    });

    // 找出用户无权删除的任务ID
    const userTaskIds = userTasks.map(task => task._id.toString());
    const unauthorizedTaskIds = taskIds.filter(id => !userTaskIds.includes(id));

    if (unauthorizedTaskIds.length > 0) {
      return res.status(403).json({
        msg: '部分任务您无权删除',
        unauthorizedTaskIds: unauthorizedTaskIds
      });
    }

    // 删除所有匹配的任务
    await Task.deleteMany({
      _id: { $in: taskIds },
      user: req.user.id
    });

    res.json({ msg: '任务已批量删除', deletedCount: taskIds.length });
  } catch (err) {
    console.error('批量删除任务错误:', err.message);
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    删除任务
// @access  私有
router.delete('/:id', auth, async (req, res) => {
  try {
    // 查找任务并验证所有权
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({ msg: '任务不存在或您无权删除此任务' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: '任务已成功删除' });
  } catch (err) {
    console.error('删除任务错误:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: '任务不存在' });
    }
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

// @route   PUT /api/tasks/batch/status
// @desc    批量更新任务状态
// @access  私有
router.put('/batch/status', auth, validateBatchOperation, validateStatus, async (req, res) => {
  try {
    const { taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ msg: '请提供有效的任务ID数组' });
    }

    if (!status || !['待办', '进行中', '已完成'].includes(status)) {
      return res.status(400).json({ msg: '请提供有效的任务状态: 待办, 进行中, 已完成' });
    }

    // 查找用户拥有的任务
    const tasks = await Task.find({
      _id: { $in: taskIds },
      user: req.user.id
    });

    if (tasks.length !== taskIds.length) {
      return res.status(403).json({ msg: '部分任务不存在或您无权更新' });
    }

    // 更新所有匹配任务的状态
    const result = await Task.updateMany(
      {
        _id: { $in: taskIds },
        user: req.user.id
      },
      { $set: { status } }
    );

    res.json({ msg: '任务状态已批量更新', updatedCount: result.nModified });
  } catch (err) {
    console.error('批量更新任务状态错误:', err.message);
    res.status(500).json({ msg: '服务器错误', error: err.message });
  }
});

module.exports = router;