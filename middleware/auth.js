const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 获取令牌
  const token = req.header('x-auth-token');

  // 检查令牌是否存在
  if (!token) {
    return res.status(401).json({ msg: '无令牌，授权被拒绝' });
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: '令牌无效' });
  }
};