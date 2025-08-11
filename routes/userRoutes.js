const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const moment = require('moment');

// @route   GET /api/users
// @desc    获取所有用户
// @access  私有
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   GET /api/users/stats
// @desc    获取用户统计数据
// @access  私有
router.get('/stats', auth, async (req, res) => {
  try {
    // 获取总用户数
    const totalUsers = await User.countDocuments();

    // 获取无手机号的用户数
    const usersWithoutPhone = await User.countDocuments({ phone: { $exists: false } }) + await User.countDocuments({ phone: null }) + await User.countDocuments({ phone: '' });

    // 获取所有用户的注册日期
    const users = await User.find({}, { createdAt: 1 });

    // 按日期分组统计注册用户数
    const registrationCounts = {};
    users.forEach(user => {
      const date = moment(user.createdAt).format('YYYY-MM-DD');
      registrationCounts[date] = (registrationCounts[date] || 0) + 1;
    });

    // 转换为数组格式
    const registrationByDate = Object.keys(registrationCounts).map(date => ({
      date,
      count: registrationCounts[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 计算平均每日注册用户数
    if (registrationByDate.length > 0) {
      const firstDate = new Date(registrationByDate[0].date);
      const lastDate = new Date(registrationByDate[registrationByDate.length - 1].date);
      const days = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
      const avgDailyRegistrations = totalUsers / days;

      res.json({
        totalUsers,
        usersWithoutPhone,
        registrationByDate,
        avgDailyRegistrations
      });
    } else {
      res.json({
        totalUsers,
        usersWithoutPhone,
        registrationByDate: [],
        avgDailyRegistrations: 0
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;