import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Spin, message, Statistic, Row, Col } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import 'antd/dist/reset.css';

export default function UserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取用户统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/users/stats');
        setStats(res.data);
      } catch (err) {
        console.error('获取用户统计数据失败:', err.response?.data || err.message);
        setError('获取用户统计数据失败');
        message.error('获取用户统计数据失败');
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  // 准备图表数据
  const prepareChartData = () => {
    if (!stats) return { barData: [], pieData: [] };

    // 按注册日期统计
    const barData = stats.registrationByDate.map(item => ({
      date: item.date,
      count: item.count
    }));

    // 按手机号是否设置统计
    const phoneCount = stats.totalUsers - stats.usersWithoutPhone;
    const pieData = [
      {
        name: '有手机号',
        value: phoneCount,
        color: '#1890ff'
      },
      {
        name: '无手机号',
        value: stats.usersWithoutPhone,
        color: '#f5f5f5'
      }
    ];

    return { barData, pieData };
  };

  const { barData, pieData } = prepareChartData();

  return (
    <div className="user-stats-container">
      <h2>用户统计</h2>

      {loading ? (
        <Spin size="large" className="loading-spinner" />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : stats ? (
        <div className="stats-content">
          {/* 统计卡片 */}
          <Row gutter={16} className="stats-cards">
            <Col span={24} xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered={true} className="stat-card">
                <Statistic
                  title="总用户数"
                  value={stats.totalUsers}
                  prefix={<span className="stat-icon">👥</span>}
                  className="stat"
                />
              </Card>
            </Col>
            <Col span={24} xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered={true} className="stat-card">
                <Statistic
                  title="有手机号用户"
                  value={stats.totalUsers - stats.usersWithoutPhone}
                  prefix={<span className="stat-icon">📱</span>}
                  className="stat"
                />
              </Card>
            </Col>
            <Col span={24} xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered={true} className="stat-card">
                <Statistic
                  title="无手机号用户"
                  value={stats.usersWithoutPhone}
                  prefix={<span className="stat-icon">📵</span>}
                  className="stat"
                />
              </Card>
            </Col>
            <Col span={24} xs={24} sm={12} md={6} lg={6} xl={6}>
              <Card bordered={true} className="stat-card">
                <Statistic
                  title="平均注册用户/天"
                  value={(stats.avgDailyRegistrations || 0).toFixed(2)}
                  prefix={<span className="stat-icon">📊</span>}
                  className="stat"
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <div className="charts-container">
            <Card bordered={true} className="chart-card">
              <h3 className="chart-title">用户注册趋势</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card bordered={true} className="chart-card">
              <h3 className="chart-title">用户手机号设置情况</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// 添加一些基本样式
const styles = `
.user-stats-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  box-sizing: border-box;
}

.loading-spinner {
  display: block;
  margin: 40px auto;
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #f5222d;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 24px;
  margin-right: 8px;
}

.stats-content {
  margin-top: 20px;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media (min-width: 768px) {
  .charts-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}
`;

// 注入样式
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
(document.head || document.documentElement).appendChild(styleSheet);