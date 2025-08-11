const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { sendResetPasswordEmail } = require('../utils/emailService');

// @route   POST /api/auth/register
// @desc    注册新用户
// @access  公开
router.post('/register', [
  check('username', '用户名不能为空').not().isEmpty(),
  check('email', '请输入有效的电子邮件').isEmail(),
  check('phone', '请输入有效的手机号').isMobilePhone('zh-CN'),
  check('password', '密码长度至少为6个字符').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, phone, password } = req.body;

  try {
    // 检查用户是否已存在
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: '用户已存在' });
    }

    user = new User({
      username,
      email,
      phone,
      password
    });

    await user.save();

    // 返回JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1h' },
          (err, token) => {
            if (err) throw err;
            res.json({
              token,
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone
              }
            });
          }
        );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   POST /api/auth/login
// @desc    验证用户并获取令牌
// @access  公开
router.post('/login', [
  check('username', '用户名不能为空').exists(),
  check('password', '密码不能为空').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // 检查用户是否存在
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: '无效的凭证' });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: '无效的凭证' });
    }

    // 返回JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    找回密码
// @access  公开
router.post('/forgot-password', [
  check('email', '请输入有效的电子邮件').if((value, { req }) => req.body.resetMethod === 'email').isEmail(),
  check('phone', '请输入有效的手机号').if((value, { req }) => req.body.resetMethod === 'phone').isMobilePhone('zh-CN')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, phone } = req.body;

  try {
    // 查找用户
    let user;
    console.log('找回密码请求数据:', req.body);
    if (email) {
      user = await User.findOne({ email });
      console.log('通过邮箱查找用户结果:', user);
    } else if (phone) {
      // 移除手机号可能的空格和特殊字符
      const formattedPhone = phone.replace(/\D/g, '');
      console.log('原始手机号:', phone, '格式化后手机号:', formattedPhone);
      // 尝试查找原始手机号和格式化后的手机号
      user = await User.findOne({ $or: [{ phone }, { phone: formattedPhone }] });
      console.log('通过手机号查找用户结果:', user);
      // 如果没找到，输出数据库中所有用户的手机号（仅用于调试）
      if (!user) {
        const allUsers = await User.find({}, 'phone');
        console.log('数据库中所有用户的手机号:', allUsers);
      }
    }

    if (!user) {
      return res.status(400).json({ msg: '未找到该用户' });
    }

    // 生成密码重置令牌
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 保存重置令牌到用户
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10分钟后过期

    await user.save();

    // 发送密码重置邮件
    try {
      await sendResetPasswordEmail(user, resetToken);
      res.json({ msg: '密码重置链接已发送，请查收邮件' });
    } catch (error) {
      // 如果发送邮件失败，清除重置令牌
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ msg: '发送密码重置邮件失败，请稍后重试' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @route   PUT /api/auth/reset-password/:resetToken
// @desc    通过重置令牌重置密码
// @access  公开
router.put('/reset-password/:resetToken', [
  check('password', '密码长度至少为6个字符').isLength({ min: 6 }),
  check('confirmPassword', '密码必须匹配').custom((value, { req }) => value === req.body.password)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password } = req.body;

  try {
    // 查找具有重置令牌的用户
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: '无效或已过期的重置令牌' });
    }

    // 更新密码
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // 返回新的JWT
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// 测试路由：检查手机号是否存在
router.get('/test-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    console.log('测试手机号:', phone);
    // 移除手机号可能的空格和特殊字符
    const formattedPhone = phone.replace(/\D/g, '');
    console.log('格式化后手机号:', formattedPhone);
    // 尝试查找原始手机号和格式化后的手机号
    const user = await User.findOne({ $or: [{ phone }, { phone: formattedPhone }] });
    console.log('查找结果:', user);
    // 如果没找到，输出数据库中所有用户的手机号
    if (!user) {
      const allUsers = await User.find({}, 'phone');
      console.log('数据库中所有用户的手机号:', allUsers);
    }
    res.json({ exists: !!user, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;