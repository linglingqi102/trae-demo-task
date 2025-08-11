import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import dayjs from 'dayjs';
import { Badge } from 'antd';

const SimpleGantt = ({ tasks }) => {
  // 获取状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case '待办':
        return '#d9d9d9';
      case '进行中':
        return '#1890ff';
      case '已完成':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    return dayjs(dateString).format('YYYY-MM-DD');
  };

  // 准备甘特图数据
  const ganttData = tasks && tasks.length > 0 ? (
    tasks.map((task, index) => {
      console.log(`处理任务 ${index + 1}:`, task);
      console.log(`任务 ${index + 1} dueDate:`, task.dueDate, '类型:', typeof task.dueDate);
      
      const startDate = task.dueDate ? dayjs(task.dueDate).subtract(1, 'day') : dayjs();
      const endDate = task.dueDate ? dayjs(task.dueDate) : dayjs().add(1, 'day');

      console.log(`任务 ${index + 1} 开始日期:`, startDate.format('YYYY-MM-DD'));
      console.log(`任务 ${index + 1} 结束日期:`, endDate.format('YYYY-MM-DD'));

      return {
        id: task._id,
        name: task.name || `未命名任务 ${index + 1}`,
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
        duration: 1,
        status: task.status || '待办',
        fullTask: task
      };
    })
  ) : [];

  console.log('SimpleGantt - ganttData:', ganttData);

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      <h2>简易甘特图</h2>
      <p>任务数量: {tasks?.length || 0}</p>
      <p>甘特图数据数量: {ganttData.length}</p>

      {ganttData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={ganttData}
            margin={{ top: 20, right: 30, left: 100, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="start"
              tickFormatter={(date) => dayjs(date).format('YYYY-MM-DD')}
              angle={-45}
              textAnchor="end"
              height={70}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar
              dataKey="duration"
              radius={[4, 4, 4, 4]}
              barSize={20}
              layout="vertical"
            >
              {ganttData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>暂无任务数据</p>
        </div>
      )}
    </div>
  );
};

export default SimpleGantt;