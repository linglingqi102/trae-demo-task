import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import dayjs from 'dayjs';

const GanttTestPage = () => {
  // 模拟任务数据
  const mockTasks = [
    {
      _id: '1',
      name: '测试任务 1',
      status: '进行中',
      dueDate: '2025-08-10'
    },
    {
      _id: '2',
      name: '测试任务 2',
      status: '待办',
      dueDate: '2025-08-15'
    },
    {
      _id: '3',
      name: '测试任务 3',
      status: '已完成',
      dueDate: '2025-08-05'
    }
  ];

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

  // 准备甘特图数据
  const ganttData = mockTasks.map((task) => {
    const startDate = dayjs(task.dueDate).subtract(1, 'day');
    const endDate = dayjs(task.dueDate);

    return {
      id: task._id,
      name: task.name,
      start: startDate.format('YYYY-MM-DD'),
      end: endDate.format('YYYY-MM-DD'),
      duration: 1,
      status: task.status
    };
  });

  console.log('模拟甘特图数据:', ganttData);

  return (
    <div style={{ padding: '20px' }}>
      <h2>甘特图测试页面</h2>
      <p>使用模拟数据测试甘特图显示</p>

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

      <div style={{ marginTop: '40px' }}>
        <h3>模拟数据:</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(mockTasks, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default GanttTestPage;