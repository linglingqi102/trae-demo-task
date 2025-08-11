import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Spin, message } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const TaskStats = ({ tasks }) => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    taskStatusDistribution: [],
    taskPriorityDistribution: [],
    tasksByDueDate: [],
  });
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    return dayjs(dateString).format('YYYY-MM-DD');
  };

  // 计算任务统计数据
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 总任务数
      const totalTasks = tasks.length;

      // 按状态分类
      const completedTasks = tasks.filter(task => task.status === '已完成').length;
      const inProgressTasks = tasks.filter(task => task.status === '进行中').length;
      const pendingTasks = tasks.filter(task => task.status === '待办').length;

      // 完成率
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 状态分布数据
      const taskStatusDistribution = [
        { name: '已完成', value: completedTasks, color: '#52c41a' },
        { name: '进行中', value: inProgressTasks, color: '#1890ff' },
        { name: '待办', value: pendingTasks, color: '#d9d9d9' },
      ];

      // 优先级分布数据
      const priorityCounts = {
        '高': tasks.filter(task => task.priority === '高').length,
        '中': tasks.filter(task => task.priority === '中').length,
        '低': tasks.filter(task => task.priority === '低').length,
      };
      const taskPriorityDistribution = [
        { name: '高', value: priorityCounts['高'], color: '#ff4d4f' },
        { name: '中', value: priorityCounts['中'], color: '#faad14' },
        { name: '低', value: priorityCounts['低'], color: '#4e6ef2' },
      ];

      // 按截止日期分布
      const dateCounts = {};
      tasks.forEach(task => {
        if (task.dueDate) {
          const date = dayjs(task.dueDate).format('YYYY-MM-DD');
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
      });
      const tasksByDueDate = Object.keys(dateCounts).map(date => ({
        date,
        count: dateCounts[date]
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      // 更新状态
      setStatsData({
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        taskStatusDistribution,
        taskPriorityDistribution,
        tasksByDueDate,
      });

      setLoading(false);
    } catch (error) {
      console.error('计算任务统计数据失败:', error);
      message.error('计算任务统计数据失败');
      setLoading(false);
    }
  }, [tasks]);


  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', boxSizing: 'border-box' }}>


      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic title="总任务数" value={statsData.totalTasks} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="已完成任务" value={statsData.completedTasks} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="进行中任务" value={statsData.inProgressTasks} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="待办任务" value={statsData.pendingTasks} />
              </Card>
            </Col>
          </Row>

          {/* 完成率 */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <h3>任务完成率</h3>
                <Progress 
                  type="circle" 
                  percent={statsData.completionRate} 
                  strokeWidth={10}
                  style={{ marginTop: '20px' }}
                />
              </Col>
              <Col span={12}>
                <h3>状态分布</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statsData.taskStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statsData.taskStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
            </Row>
          </Card>

          {/* 优先级分布和截止日期分布 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={12}>
              <Card>
                <h3>优先级分布</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statsData.taskPriorityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statsData.taskPriorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <h3>按截止日期分布</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={statsData.tasksByDueDate}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>


        </>
      )}
    </div>
  );
};

export default TaskStats;