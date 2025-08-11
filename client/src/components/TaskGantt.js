import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Modal, Descriptions, Badge } from 'antd';
import dayjs from 'dayjs';

const TaskGantt = ({ tasks, currentUser }) => {

  const [ganttData, setGanttData] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

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

  // 处理任务点击事件
  const handleTaskClick = (task) => {
    setSelectedTaskDetail(task);
    setVisible(true);
  };

  // 准备甘特图数据
  useEffect(() => {
    console.log('TaskGantt - useEffect triggered with tasks:', tasks);
    if (tasks && tasks.length > 0) {
      console.log('TaskGantt - tasks.length:', tasks.length);
      // 去重处理
      const uniqueTasks = Array.from(new Map(tasks.map(task => [task._id, task])).values());
      console.log('TaskGantt - uniqueTasks.length:', uniqueTasks.length);

      // 计算日期范围
      const dueDates = uniqueTasks.map(task => task.dueDate).filter(Boolean);
      console.log('TaskGantt - dueDates.length:', dueDates.length);
      if (dueDates.length > 0) {
        const dayjsDates = dueDates.map(date => dayjs(date));
        // 使用Math.min和Math.max结合valueOf()方法计算最小和最大日期
        const min = dayjs(Math.min(...dayjsDates.map(date => date.valueOf())));
        const max = dayjs(Math.max(...dayjsDates.map(date => date.valueOf())));
        console.log('TaskGantt - min date:', min.format('YYYY-MM-DD'));
        console.log('TaskGantt - max date:', max.format('YYYY-MM-DD'));
        // 扩展日期范围以确保图表有足够空间
        setMinDate(min.subtract(1, 'day'));
        setMaxDate(max.add(3, 'day'));
      } else {
        console.log('TaskGantt - No due dates found');
        // 设置默认日期范围
        const today = dayjs();
        setMinDate(today.subtract(1, 'day'));
        setMaxDate(today.add(7, 'day'));
      }

      // 转换任务数据为甘特图格式
      const transformedData = uniqueTasks.map((task, index) => {
        // 假设任务持续1天
        const startDate = task.dueDate ? dayjs(task.dueDate).subtract(1, 'day') : dayjs();
        const endDate = task.dueDate ? dayjs(task.dueDate) : dayjs().add(1, 'day');

        console.log(`TaskGantt - Task ${index + 1}:`, task.name || `未命名任务 ${index + 1}`);
        console.log(`TaskGantt - Task ${index + 1} start date:`, startDate.format('YYYY-MM-DD'));
        console.log(`TaskGantt - Task ${index + 1} end date:`, endDate.format('YYYY-MM-DD'));

        return {
          id: task._id,
          name: task.name || `未命名任务 ${index + 1}`,
          start: startDate.format('YYYY-MM-DD'), // 转换为字符串格式
          end: endDate.format('YYYY-MM-DD'),     // 转换为字符串格式
          duration: 1,
          status: task.status || '待办',
          priority: task.priority || '中',
          fullTask: task
        };
      });

      console.log('TaskGantt - transformedData.length:', transformedData.length);
      setGanttData(transformedData);
    } else {
      console.log('TaskGantt - No tasks received or tasks is empty');
      setGanttData([]);
      // 设置默认日期范围
      const today = dayjs();
      setMinDate(today.subtract(1, 'day'));
      setMaxDate(today.add(7, 'day'));
    }
  }, [tasks]);

  // 生成X轴刻度
  const generateTicks = () => {
    if (!minDate || !maxDate) return [];

    const ticks = [];
    let current = minDate;

    while (current.isBefore(maxDate.add(1, 'day'))) {
      ticks.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    return ticks;
  };

  // 自定义Tooltip内容
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const task = payload[0].payload.fullTask;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
          <p style={{ fontWeight: 'bold' }}>{task.name}</p>
          <p>状态: <Badge status={getStatusColor(task.status) === '#d9d9d9' ? 'default' : getStatusColor(task.status) === '#1890ff' ? 'processing' : 'success'} text={task.status} /></p>
          <p>截止日期: {formatDate(task.dueDate)}</p>
          <p>优先级: {task.priority}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      <h2>项目甘特图</h2>
      {console.log('TaskGantt - ganttData.length:', ganttData.length)}
{console.log('渲染甘特图:', ganttData.length > 0)} {ganttData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400} style={{ minWidth: '0px' }}>
          <BarChart
            data={ganttData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
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
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="duration"
              fill="#8884d8"
              radius={[4, 4, 4, 4]}
              barSize={20}
              layout="vertical"
              onClick={(_, index) => handleTaskClick(ganttData[index].fullTask)}
              data={ganttData}
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
  <p>接收到的任务数量: {tasks?.length || 0}</p>
  <p>转换后的甘特图数据数量: {ganttData.length}</p>
</div>
      )}

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTaskDetail && (
          <Descriptions column={1} title={selectedTaskDetail.name}>
            <Descriptions.Item label="状态">
              <Badge status={getStatusColor(selectedTaskDetail.status) === '#d9d9d9' ? 'default' : getStatusColor(selectedTaskDetail.status) === '#1890ff' ? 'processing' : 'success'} text={selectedTaskDetail.status} />
            </Descriptions.Item>
            <Descriptions.Item label="优先级">{selectedTaskDetail.priority}</Descriptions.Item>
            <Descriptions.Item label="截止日期">{formatDate(selectedTaskDetail.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="创建者">{selectedTaskDetail.createdBy?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(selectedTaskDetail.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="描述">{selectedTaskDetail.description || '无'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TaskGantt;