import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Form, Descriptions } from 'antd';
import { Tabs } from 'antd';
// 已从authService导入api实例，无需再导入axios
import { api } from '../services/authService';
import { Card, Badge, Button, Tooltip, message, Dropdown, Menu } from 'antd';
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import authService from '../services/authService';
import '../App.css'; // 导入App.css以使用新样式
import COLORS from '../constants/colors';
import TaskForm from './TaskForm';

const { Tab } = Tabs;

const TaskBoard = ({ tasks, currentTask, setCurrentTask, setTasks, currentUser }) => {
  const [validTaskIds, setValidTaskIds] = useState(new Set());
  // 添加分组方式状态 (status: 按状态分组, priority: 按优先级分组)
  const [groupBy, setGroupBy] = useState('status');
  // 子任务相关状态
  const [subTasksModalVisible, setSubTasksModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  // 添加状态来跟踪是否正在获取子任务数据
  const [isFetchingSubTasks, setIsFetchingSubTasks] = useState(false);
  // 任务详情相关状态
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  // 维护有效的任务ID集合
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return;
    }
    const ids = new Set(tasks.map(task => task._id));
    setValidTaskIds(ids);
  }, [tasks]);

  // 动态分组任务
  const groupedTasks = useMemo(() => {
    // 检查tasks是否存在且是数组
    if (!tasks || !Array.isArray(tasks)) {
      return groupBy === 'status' ? {
        '待办': [],
        '进行中': [],
        '已完成': []
      } : {
        '高': [],
        '中': [],
        '低': []
      };
    }

    if (groupBy === 'status') {
      return {
        '待办': tasks.filter(task => task.status === '待办'),
        '进行中': tasks.filter(task => task.status === '进行中'),
        '已完成': tasks.filter(task => task.status === '已完成')
      };
    } else if (groupBy === 'priority') {
      return {
        '高': tasks.filter(task => task.priority === '高'),
        '中': tasks.filter(task => task.priority === '中' || !task.priority),
        '低': tasks.filter(task => task.priority === '低')
      };
    }

    return {};
  }, [tasks, groupBy]);

  // 监听任务数据变化
  useEffect(() => {
  }, [tasks]);

  // 获取任务的子任务
  const fetchSubTasks = async (taskId) => {
    // 防止重复请求
    if (isFetchingSubTasks) {
      return;
    }
    try {
      setIsFetchingSubTasks(true);
      // 检查任务ID是否有效
      if (!taskId || typeof taskId !== 'string') {
        message.error('无效的任务ID');
        return;
      }
      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await api.get(`/api/tasks/${taskId}/subtasks`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      // 检查响应数据格式
      if (!Array.isArray(res.data)) {
        message.error('子任务数据格式不正确');
        setSubTasks([]);
        return;
      }
      setSubTasks(res.data);
    } catch (err) {
      if (err.name === 'AbortError') {
        message.error('获取子任务超时，请重试');
      } else if (err.response) {
        message.error(`获取子任务失败: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        message.error('获取子任务失败，没有收到响应，请检查网络连接');
      } else {
        message.error(`获取子任务失败: ${err.message}`);
      }
    } finally {
      // 无论请求成功或失败，都将isFetchingSubTasks设置为false
      setIsFetchingSubTasks(false);
    }
  };

  // 打开子任务模态框
  const openSubTasksModal = async (task) => {
    if (!task || !task._id) {
      message.error('无法打开子任务：无效的任务');
      return;
    }
    setSelectedTask(task);
    try {
      await fetchSubTasks(task._id);
    } catch (err) {
      // 错误已在fetchSubTasks中处理
    }
    setSubTasksModalVisible(true);
  };

  // 关闭子任务模态框
  const closeSubTasksModal = () => {
    setSubTasksModalVisible(false);
    setSelectedTask(null);
    setSubTasks([]);
  };

  // 打开任务详情模态框
  const openTaskDetailModal = (task) => {
    console.log('打开任务详情模态框，任务数据:', task);
    if (!task || !task._id) {
      console.error('无效的任务对象:', task);
      message.error('无法打开任务详情：无效的任务');
      return;
    }
    setSelectedTaskDetail(task);
    setTaskDetailModalVisible(true);
  };

  // 关闭任务详情模态框
  const closeTaskDetailModal = () => {
    setTaskDetailModalVisible(false);
    setSelectedTaskDetail(null);
  };

  // 创建子任务
  const createSubTask = () => {
    closeSubTasksModal();
    setCurrentTask({ parentTask: selectedTask._id });
  };

  // 删除任务
  const deleteTask = async (id) => {
    try {
      const currentUser = authService.getCurrentUser();
      const taskToDelete = tasks.find(task => task._id === id);

      if (!currentUser || !taskToDelete) {
        message.error('无法删除任务：用户未登录或任务不存在');
        return;
      }

      // 检查是否有权限删除
      if (taskToDelete.user._id !== currentUser.id) {
        message.error('无法删除任务：没有权限');
        return;
      }

      await api.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
      message.success('任务删除成功');
    } catch (err) {
      message.error('删除任务失败，请重试');
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

  // 更改任务字段
  const handleFieldChange = async (taskId, field, value) => {
    // 忽略占位符任务
    if (taskId.startsWith('placeholder-')) {
      return;
    }
    try {
      const res = await api.put(`/api/tasks/${taskId}`, { [field]: value });
      if (tasks && Array.isArray(tasks)) {
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, [field]: value } : task
        ));
      }
      message.success(`任务${field}已更新为${value}`);
    } catch (err) {
      message.error(`更新任务${field}失败，请重试`);
    }
  };

  // 检查任务数据是否存在且有效
  if (!tasks || !Array.isArray(tasks)) {
    return <div className="task-board-container"><div className="task-board"><h2>任务看板</h2><p style={{color: 'red'}}>没有可用的任务数据，请先添加任务。</p></div></div>;
  }

  // 检查任务数据长度
  if (tasks.length === 0) {
    return <div className="task-board-container"><div className="task-board"><h2>任务看板</h2><p>当前没有任务，请添加新任务。</p></div></div>;
  }

  return (
    <div className="task-board-container">
        <div className="task-board">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ textAlign: 'center' }}>任务看板</h2>
            <Button
              type="primary"
              onClick={() => setCurrentTask({})}
              style={{ backgroundColor: COLORS.primary, boxShadow: `0 1px 2px ${COLORS.primary}40` }}
            >
              创建任务
            </Button>
          </div>
        <Tabs
          defaultValue="status"
          onChange={(key) => setGroupBy(key)}
          style={{ marginBottom: 24, width: '100%', maxWidth: '600px', margin: '0 auto 24px auto' }}
          items={[
            { key: 'status', label: '按状态分组' },
            { key: 'priority', label: '按优先级分组' },
          ]}
        />
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-start', flexWrap: 'wrap', width: '100%', overflowX: 'auto', padding: '10px 0' }}>
          {/* 动态生成任务列 */}
          {Object.entries(groupedTasks).map(([columnId, columnTasks], columnIndex) => {
            // 根据分组类型和列ID获取样式
            let columnColor, columnTextColor, badgeStatus;
            if (groupBy === 'status') {
              switch (columnId) {
                case '待办':
                  columnColor = COLORS.backlog;
                  columnTextColor = COLORS.backlogText;
                  badgeStatus = 'default';
                  break;
                case '进行中':
                  columnColor = COLORS.inProgress;
                  columnTextColor = COLORS.inProgressText;
                  badgeStatus = 'processing';
                  break;
                case '已完成':
                  columnColor = COLORS.completed;
                  columnTextColor = COLORS.completedText;
                  badgeStatus = 'success';
                  break;
                default:
                  columnColor = '#f1f5f9';
                  columnTextColor = '#64748b';
                  badgeStatus = 'default';
              }
            } else if (groupBy === 'priority') {
              switch (columnId) {
                case '高':
                  columnColor = '#fee2e2';
                  columnTextColor = '#dc2626';
                  badgeStatus = 'error';
                  break;
                case '中':
                  columnColor = '#fef3c7';
                  columnTextColor = '#d97706';
                  badgeStatus = 'warning';
                  break;
                case '低':
                  columnColor = '#d1fae5';
                  columnTextColor = '#065f46';
                  badgeStatus = 'success';
                  break;
                default:
                  columnColor = '#f1f5f9';
                  columnTextColor = '#64748b';
                  badgeStatus = 'default';
              }
            }

            return (
                  <div
                key={`column-${columnIndex}-${columnId}`}
                className="board-column"
                style={{ backgroundColor: columnColor }}
              >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ color: columnTextColor, fontWeight: 600 }}>
                        {groupBy === 'status' ? `${columnId}任务` : `${columnId}优先级任务`}
                      </h3>
                      <Badge count={columnTasks.length} status={badgeStatus} />
                    </div>
                    {columnTasks.length > 0 ? columnTasks.map((task, taskIndex) => (
                            <div
                              key={`task-${taskIndex}-${task._id}`}
                              style={{
                                marginBottom: 12
                              }}
                            >
                              <Card
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span
                                        style={{ color: '#1677ff', cursor: 'pointer' }}
                                        onClick={() => openTaskDetailModal(task)}
                                      >
                                        {task.title}
                                      </span>
                                      {task.subTasks && task.subTasks.length > 0 ? (
                                        <Tooltip title="有子任务">
                                          <Badge
                                            status="success"
                                            text="子"
                                            style={{ marginRight: 4 }}
                                          />
                                        </Tooltip>
                                      ) : (
                                        <Tooltip title="无子任务">
                                          <Badge
                                            status="default"
                                            text="无"
                                            style={{ marginRight: 4 }}
                                          />
                                        </Tooltip>
                                      )}
                                      <Badge
                                        status={getPriorityColor(task.priority || '中')}
                                        text={task.priority || '中'}
                                      />
                                    </div>
                                    <Badge
                                      status={getStatusColor(task.status)}
                                      text={task.status}
                                    />
                                  </div>
                                }
                                style={{
                                  width: '100%',
                                  backgroundColor: COLORS.cardBg,
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: 6,
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.3s ease',
                                  opacity: task.status === '已完成' ? 0.8 : 1
                                }}
                                hoverable
                              >
                                {task.description && (
                                  <p style={{ marginBottom: 16, color: COLORS.textSecondary }}>{task.description}</p>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                  <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>截止日期: {formatDate(task.dueDate)}</span>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <Button
                                      type="primary"
                                      icon={<EditOutlined />}
                                      size="small"
                                      onClick={() => setCurrentTask(task)}
                                      style={{ backgroundColor: '#1677ff', boxShadow: '0 1px 2px rgba(22, 119, 255, 0.4)' }}
                                    >
                                      编辑
                                    </Button>
                                    {/* 使用对象配置形式传递menu */}
                                    <Dropdown
                                      menu={{
                                        items: [
                                          {
                                            key: 'subtasks',
                                            icon: <PlusOutlined />,
                                            label: '子任务',
                                            onClick: () => openSubTasksModal(task)
                                          },
                                          {
                                            key: 'delete',
                                            icon: <DeleteOutlined />,
                                            label: '删除',
                                            danger: true,
                                            disabled: !authService.getCurrentUser() || task.user._id !== authService.getCurrentUser().id,
                                            onClick: () => deleteTask(task._id)
                                          }
                                        ]
                                      }}
                                      placement="bottomRight"
                                      trigger={['hover']}
                                    >
                                      <Button
                                        type="default"
                                        size="small"
                                        icon={<MoreOutlined />}
                                        style={{ backgroundColor: '#e5e7eb', boxShadow: '0 1px 2px rgba(229, 231, 235, 0.4)' }}
                                      >
                                        更多
                                      </Button>
                                    </Dropdown>
                                  </div>
                                </div>
                              </Card>
                            </div>
                    )) : null}
                  </div>
            );
          })}
        </div>
      </div>
      <TaskForm
        currentTask={currentTask}
        setCurrentTask={setCurrentTask}
        setTasks={setTasks}
        currentUser={currentUser}
      />

      {/* 任务详情模态框 */}
      <Modal
        title={`任务详情 - ${selectedTaskDetail?.title}`}
        open={taskDetailModalVisible}
        onCancel={closeTaskDetailModal}
        footer={[
          <Button key="close" onClick={closeTaskDetailModal}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setCurrentTask(selectedTaskDetail);
            closeTaskDetailModal();
          }}>
            编辑
          </Button>
        ]}
        width={600}
      >
        {selectedTaskDetail && (
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
        )}
      </Modal>

      {/* 子任务模态框 */}
      <Modal
        title={`${selectedTask?.title} - 子任务`}
        open={subTasksModalVisible}
        onCancel={closeSubTasksModal}
        footer={[
          <Button key="create" type="primary" onClick={createSubTask}>
            创建子任务
          </Button>,
          <Button key="cancel" onClick={closeSubTasksModal}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {subTasks.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {subTasks.map((subTask) => (
              <Card key={subTask._id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>{subTask.title}</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge status={getStatusColor(subTask.status)} text={subTask.status} />
                    <Badge status={getPriorityColor(subTask.priority || '中')} text={subTask.priority || '中'} />
                  </div>
                </div>
                {subTask.description && <p style={{ marginTop: 8 }}>{subTask.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    截止日期: {formatDate(subTask.dueDate)}
                  </span>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setCurrentTask(subTask);
                      closeSubTasksModal();
                    }}
                  >
                    编辑
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p>暂无子任务</p>
        )}
      </Modal>
    </div>
  );
}

export default TaskBoard;