import React, { useState, useEffect } from 'react';
import { Calendar, message, Modal, Button, Descriptions, Badge } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { api } from '../services/authService';
import { PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import TaskForm from './TaskForm';

const TaskCalendar = ({ currentUser, setCurrentTask, currentTask, setTasks, tasks }) => {
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [visible, setVisible] = useState(false);
  const [dayTasks, setDayTasks] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs()); // 添加当前月份状态
  const [isUserSelecting, setIsUserSelecting] = useState(false); // 区分用户主动选择和月份切换导致的日期选择
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null); // 存储选中的任务详情

  // 获取状态标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case '待办':
        return 'default';
      case '进行中':
        return 'processing';
      case '已完成':
        return 'success';
      default:
        return 'default';
    }
  };

  // 获取优先级标签颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高':
        return 'error';
      case '中':
        return 'warning';
      case '低':
        return 'success';
      default:
        return 'default';
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
  };

  // 获取所有任务数据
  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      // 去重处理
      const uniqueTasks = Array.from(new Map(res.data.map(task => [task._id, task])).values());
      setCalendarTasks(uniqueTasks);
    } catch (err) {
      message.error('获取任务数据失败: ' + (err.response?.data || err.message));
    }
  };

  // 当组件挂载时获取任务数据
  useEffect(() => {
    fetchTasks();
  }, []);

  // 监听tasks prop的变化，并更新calendarTasks状态
  useEffect(() => {
    if (tasks) {
      // 去重处理
      const uniqueTasks = Array.from(new Map(tasks.map(task => [task._id, task])).values());
      setCalendarTasks(uniqueTasks);
    }
  }, [tasks]);

  // 处理日期选择
  const onSelect = (date) => {
    const selectedDate = dayjs(date).format('YYYY-MM-DD');
    setSelectedTaskDetail(null); // 清空选中的任务详情
    
    // 筛选出选定日期的任务
    const filteredTasks = calendarTasks.filter(task => {
      const taskDate = dayjs(task.dueDate).format('YYYY-MM-DD');
      return taskDate === selectedDate;
    });
    
    setDayTasks(filteredTasks);
    
    // 只有当用户主动选择日期时才显示弹窗
    if (isUserSelecting) {
      setVisible(true);
    }
  };

  // 处理月份切换
  const handlePanelChange = (value) => {
    setCurrentMonth(value);
  };

  // 监听日期单元格鼠标按下事件，标识用户开始主动选择日期
  const handleDateMouseDown = () => {
    setIsUserSelecting(true);
  };

  // 自定义日历单元格内容
  const dateCellRender = (current) => {
    const dateStr = current.format('YYYY-MM-DD');
    const tasksForDate = calendarTasks.filter(task => {
      return dayjs(task.dueDate).format('YYYY-MM-DD') === dateStr;
    });

    // 处理点击查看更多的逻辑
    const handleViewMore = () => {
      setDayTasks(tasksForDate);
      setVisible(true);
    };

    // 最多显示2个任务名称
    const maxVisibleTasks = 2;
    const visibleTasks = tasksForDate.slice(0, maxVisibleTasks);
    const hasMoreTasks = tasksForDate.length > maxVisibleTasks;

    return (
      <div className="calendar-cell">
        {/* 移除了日期显示 */}
        {tasksForDate.length > 0 && (
          <div className="tasks-container">
            {visibleTasks.map((task, index) => (
              <div key={index} className="task-name" title={task.title} onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡到日历单元格
                setSelectedTaskDetail(task);
                setVisible(true);
              }}>
                {task.title.length > 8 ? task.title.substring(0, 8) + '...' : task.title}
              </div>
            ))}
            {hasMoreTasks && (
              <div className="view-more" onClick={handleViewMore}>
                +{tasksForDate.length - maxVisibleTasks} 查看更多
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="task-calendar-container">
      <h2>任务日历</h2>
      <Calendar
        dateCellRender={dateCellRender}
        onSelect={onSelect}
        onPanelChange={handlePanelChange} // 修改为新的月份切换处理函数
        value={currentMonth} // 设置当前月份
        dateCellMouseDown={handleDateMouseDown} // 添加日期单元格鼠标按下事件处理
        headerRender={({ value, onChange }) => {
          const year = value.year();
          const month = value.month() + 1;
          
          // 切换到上个月
          const handlePrevMonth = () => {
            setIsUserSelecting(false); // 标识不是用户主动选择日期
            const prevMonth = value.subtract(1, 'month');
            onChange(prevMonth);
          };
          
          // 切换到下个月
          const handleNextMonth = () => {
            setIsUserSelecting(false); // 标识不是用户主动选择日期
            const nextMonth = value.add(1, 'month');
            onChange(nextMonth);
          };
          
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button onClick={handlePrevMonth} size="small" icon={<LeftOutlined />} />
                
                <h3 style={{ margin: 0 }}>{year}年 {month}月</h3>
                <Button onClick={handleNextMonth} size="small" icon={<RightOutlined />} />
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentTask({});
                }}
              >
                添加任务
              </Button>
            </div>
          );
        }}
      />

      {/* 任务详情弹窗 */}
      <Modal
        title={`任务详情 - ${selectedTaskDetail?.title}`}
        visible={visible && selectedTaskDetail}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setCurrentTask(selectedTaskDetail);
            setVisible(false);
          }}>
            编辑
          </Button>
        ]}
        width={600}
      >
        {selectedTaskDetail ? (
          <Descriptions column={2} title="任务信息" bordered>
            <Descriptions.Item label="任务标题">{selectedTaskDetail.title}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={getStatusColor(selectedTaskDetail.status)} text={selectedTaskDetail.status} />
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Badge status={getPriorityColor(selectedTaskDetail.priority || '中')} text={selectedTaskDetail.priority || '中'} />
            </Descriptions.Item>
            <Descriptions.Item label="截止日期">{formatDate(selectedTaskDetail.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{selectedTaskDetail.description || '无描述'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(selectedTaskDetail.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDate(selectedTaskDetail.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="创建者" span={2}>{selectedTaskDetail.user?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="子任务数量" span={2}>{selectedTaskDetail.subTasks?.length || 0}</Descriptions.Item>
          </Descriptions>
        ) : dayTasks.length === 0 ? (
          <p>该日期没有任务</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {dayTasks.map(task => (
              <div key={task._id} className="task-item" onClick={() => {
                setSelectedTaskDetail(task);
              }}>
                <div className="task-title">{task.title}</div>
                <div className="task-details">
                  <p>截止时间: {formatDate(task.dueDate)}</p>
                  <p>状态: {task.status}</p>
                  <p>优先级: {task.priority || '中'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 任务表单 */}
      <TaskForm
        currentTask={currentTask}
        setCurrentTask={setCurrentTask}
        currentUser={currentUser}
        setTasks={setTasks}
      />

      <style jsx global>{`
        .calendar-cell {
          position: relative;
          height: 80px;
          padding: 4px;
          overflow: hidden;
          outline: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .ant-picker-cell-inner,
        .ant-picker-calendar-date {
          outline: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* 强制去除选中日期的浅蓝色背景 */
        .ant-picker-calendar.ant-picker-calendar-full .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-calendar-date {
          background-color: transparent !important;
        }
        ::selection {
          background-color: transparent;
        }
        .tasks-container {
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .task-name {
          font-size: 12px;
          padding: 2px 4px;
          border-radius: 2px;
          background-color: #e6f7ff;
          color: #1890ff;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          outline: none;
          user-select: none;
        }
        .view-more {
          font-size: 12px;
          color: #ff7a45;
          cursor: pointer;
          padding: 2px 4px;
          text-align: left;
          outline: none;
          user-select: none;
        }
        .date-number {
          font-size: 16px;
          font-weight: bold;
        }
        .task-indicator {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .task-calendar-container {
          padding: 20px;
          background-color: #f7f9fc;
          min-height: calc(100vh - 160px);
        }
        .ant-modal .ant-modal-content .task-list {
          list-style: none;
          padding: 0;
          background: #ffffff !important; /* 强制设置为白色背景 */
          margin: 0;
        }
        .ant-modal .ant-modal-content .task-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          background: #ffffff !important; /* 强制设置为白色背景 */
          color: #000000 !important; /* 确保文字颜色为黑色 */
          transition: background-color 0.2s;
        }
        .task-item:hover {
          background: #f5f7fa; /* 保留悬停效果 */
        }
        .task-title {
          font-weight: 600;
          margin-bottom: 6px;
          color: #1d2129;
          font-size: 14px;
        }
        .task-details {
          font-size: 12px;
          color: #4e5969;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default TaskCalendar;