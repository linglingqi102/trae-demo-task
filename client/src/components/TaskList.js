import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { api } from '../services/authService';
import { Table, Button, Badge, Tooltip, Empty, message, Dropdown, Menu, Modal, Card, Form, Descriptions, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined, ClockOutlined, PlusOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import './TaskListHorizontal.css';
import authService from '../services/authService';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// 确保XLSX库可用，如果不可用会回退到JSON导出

// 简化的树形结构构建函数
const buildTreeData = (tasks) => {
  // 1. 先将所有任务放入Map中
  const taskMap = new Map();
  if (!tasks) return [];
  tasks.forEach(task => taskMap.set(task._id, { ...task, children: [] }));

  // 2. 构建树结构
  const rootTasks = [];
  tasks.forEach(task => {
    if (task.parentTask) {
      // 处理父任务
      const parentTaskId = typeof task.parentTask === 'object' ? task.parentTask._id : task.parentTask;
      const parentTask = taskMap.get(parentTaskId);

      if (parentTask) {
        // 父任务存在，添加到子任务列表
        parentTask.children.push(taskMap.get(task._id));
      } else {
        // 父任务不存在，作为根节点
        rootTasks.push(taskMap.get(task._id));
      }
    } else {
      // 没有父任务，作为根节点
      rootTasks.push(taskMap.get(task._id));
    }
  });

  return rootTasks;
};

const TaskList = ({ tasks, setTasks, setCurrentTask }) => {
  // 用于强制刷新组件的状态
  const [refreshFlag, setRefreshFlag] = useState(0);
  const forceUpdate = () => setRefreshFlag(prev => prev + 1);
  console.log('===== TaskList 组件渲染 =====');
  console.log('接收到的 tasks 数量:', tasks?.length || 0);
  console.log('tasks 数据:', tasks);
  
  // 树形结构数据状态
  const [treeData, setTreeData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [subTasks, setSubTasks] = useState([]);
  const [isSubTasksModalOpen, setIsSubTasksModalOpen] = useState(false);
  const [currentTaskForSubTasks, setCurrentTaskForSubTasks] = useState(null);
  // 任务详情模态框状态
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  
  // 批量操作状态
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // 缓存当前页的所有任务ID，用于全选功能
  const currentPageTaskIds = useMemo(() => {
    if (!treeData || treeData.length === 0) return [];
    // 计算当前页显示的任务
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, treeData.length);
    const currentPageTasks = treeData.slice(startIndex, endIndex);
    return currentPageTasks.map(task => task._id);
  }, [treeData, currentPage, pageSize]);
  
  // 检查当前页是否全选
  const isCurrentPageSelected = useMemo(() => {
    return currentPageTaskIds.every(id => selectedRowKeys.includes(id)) && currentPageTaskIds.length > 0;
  }, [selectedRowKeys, currentPageTaskIds]);
  
  // 检查是否有任务被选择
  const hasSelected = selectedRowKeys.length > 0;
  
  // 监听 tasks 变化，更新树形数据
  useEffect(() => {
    console.log('===== tasks 状态变化 =====');
    console.log('新的 tasks 数量:', tasks?.length || 0);
    const newTreeData = buildTreeData(tasks || []);
    console.log('重新构建的 treeData 数量:', newTreeData.length);
    setTreeData(newTreeData);
  }, [tasks]);

  // 初始加载时构建树形数据
  useEffect(() => {
    if (tasks) {
      const initialTreeData = buildTreeData(tasks || []);
      setTreeData(initialTreeData);
    }
  }, []);

  // 获取子任务
  const fetchSubTasks = async (taskId) => {
    try {
      const res = await api.get(`/api/tasks/${taskId}/subtasks`);
      setSubTasks(res.data);
    } catch (err) {
      console.error('获取子任务失败:', err.response?.data || err.message);
      message.error('获取子任务失败');
      setSubTasks([]);
    }
  };

  // 打开子任务模态框
  const openSubTasksModal = (task) => {
    setCurrentTaskForSubTasks(task);
    fetchSubTasks(task._id);
    setIsSubTasksModalOpen(true);
  };

  // 关闭子任务模态框
  const closeSubTasksModal = () => {
    setIsSubTasksModalOpen(false);
    setCurrentTaskForSubTasks(null);
    setSubTasks([]);
  };

  // 打开任务详情模态框
  const openTaskDetailModal = (task) => {
    setSelectedTaskDetail(task);
    setTaskDetailModalVisible(true);
  };

  // 关闭任务详情模态框
  const closeTaskDetailModal = () => {
    setTaskDetailModalVisible(false);
    setSelectedTaskDetail(null);
  };

  // 分页处理函数
  const handlePageChange = (current, size) => {
    setCurrentPage(current);
    setPageSize(size);
  };

  const handleShowSizeChange = (current, size) => {
    setCurrentPage(1);
    setPageSize(size);
  };

  // 监听登录状态变化，确保登录后获取最新任务数据
    useEffect(() => {
      let isLoggedIn = !!authService.getCurrentUser();
      console.log('初始登录状态:', isLoggedIn);

      // 如果已经登录，强制刷新一次
      if (isLoggedIn) {
        forceUpdate();
      }

      // 设置轮询检查登录状态变化
      const intervalId = setInterval(() => {
        const currentLoginStatus = !!authService.getCurrentUser();
        if (currentLoginStatus !== isLoggedIn) {
          console.log('登录状态变化，强制刷新任务列表');
          isLoggedIn = currentLoginStatus;
          forceUpdate();
        }
      }, 1000); // 每秒检查一次

      // 清理轮询
      return () => {
        clearInterval(intervalId);
      };
    }, []);

  // 不再单独请求任务数据，完全依赖从父组件传递的tasks
  useEffect(() => {
    if (tasks && tasks.length === 0) {
      setLoading(true);
      // 如果父组件没有传递任务数据，显示空状态
      setTimeout(() => setLoading(false), 500);
    }
  }, [tasks]);



  // 删除任务
  const deleteTask = async (id) => {
    try {
      const currentUser = authService.getCurrentUser();
      const taskToDelete = tasks.find(task => task._id === id);

      if (!currentUser || !taskToDelete) {
        message.error('无法删除任务：用户未登录或任务不存在');
        return;
      }

      // 修正用户ID字段比较，后端返回的是id而不是_id
      if (taskToDelete.user._id !== currentUser.id) {
        message.error('无法删除任务：没有权限');
        return;
      }

      await api.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
      message.success('任务删除成功');
    } catch (err) {
      console.error('删除任务失败:', err.response?.data || err.message);
      message.error('删除任务失败，请重试');
    }
  };

  // 解析日期，处理各种常见格式
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // 确保dateString是字符串
    if (typeof dateString !== 'string') {
        dateString = String(dateString);
    }

    // 去除前后空白
    const trimmedDateStr = dateString.trim();
    if (!trimmedDateStr) return null;

    // 尝试直接解析
    let date = new Date(trimmedDateStr);
    if (!isNaN(date.getTime())) {
      // 确保时间是UTC午夜
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    }

    // 尝试解析YYYY-MM-DD格式
    const ymdMatch = trimmedDateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      }
    }

    // 尝试解析MM/DD/YYYY格式
    const mdyMatch = trimmedDateStr.match(/^(\d{1,2})[/](\d{1,2})[/](\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      }
    }

    // 尝试解析中文日期格式，如2023年10月5日
    const chineseDateMatch = trimmedDateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (chineseDateMatch) {
      const [, year, month, day] = chineseDateMatch;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      }
    }

    // 尝试解析YYYYMMDD格式
    const ymdNoSepMatch = trimmedDateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (ymdNoSepMatch) {
      const [, year, month, day] = ymdNoSepMatch;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      }
    }

    // 所有解析尝试失败
    console.warn('无法解析日期:', dateString);
    // 返回原始字符串以便用户查看错误
    return trimmedDateStr;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    const date = new Date(dateString);
    // 检查日期是否有效
    if (isNaN(date.getTime())) return '无效日期';
    // 使用更稳定的日期格式化方式
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
      case 'high':
      case '高':
        return 'error';
      case 'medium':
      case '中':
        return 'warning';
      case 'low':
      case '低':
        return 'success';
      default:
        return 'default';
    }
  };

  // 格式化优先级
  const formatPriority = (priority) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '无';
    }
  };

  // 定义表格列
  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={isCurrentPageSelected}
          onChange={(e) => {
            if (e.target.checked) {
              // 全选当前页
              setSelectedRowKeys(Array.from(new Set([...selectedRowKeys, ...currentPageTaskIds])));
            } else {
              // 取消选择当前页
              setSelectedRowKeys(selectedRowKeys.filter(id => !currentPageTaskIds.includes(id)));
            }
          }}
          style={{ marginLeft: 8 }} 
       />
      ),
      dataIndex: '_id',
      key: 'selection',
      render: (id, record) => (
        <input
          type="checkbox"
          checked={selectedRowKeys.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, id]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter(selectedId => selectedId !== id));
            }
          }}
        />
      ),
      width: 60,
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <span style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => openTaskDetailModal(record)}>
          {text}
        </span>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => {
        // 使用简单的span元素显示标签
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return <span style={{ color: '#999' }}>无标签</span>;
        }
        return tags.map((tag, index) => (
          <span
            key={index}
            style={{ 
              marginRight: '8px', 
              padding: '2px 8px', 
              backgroundColor: '#e6f7ff', 
              color: '#1890ff',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            {tag}
          </span>
        ));
      },
    },

    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '无',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={getStatusColor(status)} text={status} />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate) => formatDate(dueDate),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, task) => {
        // 使用对象配置形式定义menu
        const menu = {
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
              disabled: task.user._id !== authService.getCurrentUser()?.id,
              onClick: () => deleteTask(task._id)
            }
          ]
        };

        // 当按钮数量超过两个时，使用下拉菜单
        return (
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
            {/* 使用Menu组件实例而不是对象 */}
            <Dropdown
              menu={menu}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="default"
                icon={<MoreOutlined />}
                size="small"
                style={{ backgroundColor: '#e5e7eb', boxShadow: '0 1px 2px rgba(229, 231, 235, 0.4)' }}
              >
                更多
              </Button>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  // 渲染子任务列表
  const renderSubTasks = () => {
    if (subTasks.length === 0) {
      return <p style={{ textAlign: 'center', padding: '20px' }}>暂无子任务</p>;
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        {subTasks.map((subTask) => (
          <Card
            key={subTask._id}
            title={subTask.title}
            extra={
              <Badge
                status={subTask.completed ? 'success' : 'default'}
                text={subTask.completed ? '已完成' : '未完成'}
              />
            }
          >
            <p>描述: {subTask.description || '无'}</p>
            <p>优先级: {formatPriority(subTask.priority)}</p>
            <p>截止日期: {formatDate(subTask.dueDate)}</p>
            <p>标签: {subTask.tags && subTask.tags.length > 0 ? subTask.tags.join(', ') : '无'}</p>
          </Card>
        ))}
      </div>
    );
  };

  // 导出任务为CSV/Excel
  const exportTasks = () => {
    if (!tasks || tasks.length === 0) {
      message.warning('没有任务可导出');
      return;
    }

    try {
      // 格式化任务数据
      const formattedTasks = tasks.map(task => ({
        '任务ID': task._id,
        '标题': task.title,
        '描述': task.description || '',
        '状态': task.status,
        '优先级': task.priority || '中',
        '截止日期': formatDate(task.dueDate),
        '创建时间': formatDate(task.createdAt),
        '创建者': task.user?.username || '未知',
        '标签': task.tags?.join(', ') || '无'
      }));

      // 尝试使用XLSX库导出Excel
      if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(formattedTasks);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '任务列表');
        XLSX.writeFile(workbook, `任务列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
        message.success('任务导出成功');
      } else {
        // 回退到CSV导出
        const csvContent = 'data:text/csv;charset=utf-8,'
          + Object.keys(formattedTasks[0]).join(',') + '\n'
          + formattedTasks.map(row => Object.values(row).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `任务列表_${new Date().toISOString().slice(0, 10)}.csv`);
        message.success('任务导出成功');
      }
    } catch (error) {
      console.error('导出任务失败:', error);
      message.error('导出任务失败，请重试');
    }
  };

  // 导入任务状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // 处理文件上传
  const handleFileUpload = (file) => {
    setImportFile(file);
    return false; // 阻止自动上传
  };

  // 导入任务
  const importTasks = async () => {
    if (!importFile) {
      message.warning('请选择要导入的文件');
      return;
    }

    setImportLoading(true);
    try {
      // 读取文件内容
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let importedTasks;
          const fileExtension = importFile.name.split('.').pop().toLowerCase();

          if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // 处理Excel文件
            if (typeof XLSX !== 'undefined') {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              importedTasks = XLSX.utils.sheet_to_json(worksheet);
            } else {
              throw new Error('无法导入Excel文件，缺少必要的库');
            }
          } else if (fileExtension === 'csv') {
            // 处理CSV文件
            const text = new TextDecoder().decode(e.target.result);
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            importedTasks = lines.slice(1)
              .filter(line => line.trim())
              .map(line => {
                const values = line.split(',');
                const task = {};
                headers.forEach((header, index) => {
                  task[header.trim()] = values[index]?.trim() || '';
                });
                return task;
              });
          } else {
            throw new Error('不支持的文件格式，请上传Excel或CSV文件');
          }

          // 验证导入的数据
          if (!importedTasks || importedTasks.length === 0) {
            message.warning('没有从文件中读取到任务数据');
            setImportLoading(false);
            return;
          }

          // 处理导入的数据并发送到服务器
          const createdTasks = [];
          for (const taskData of importedTasks) {
            // 构建任务对象
            const newTask = {
              title: taskData['标题'] || taskData['title'] || '未命名任务',
              description: taskData['描述'] || taskData['description'] || '',
              status: taskData['状态'] || taskData['status'] || '待办',
              priority: taskData['优先级'] || taskData['priority'] || '中',
              // 处理截止日期，确保正确解析各种日期格式
              dueDate: taskData['截止日期'] || taskData['dueDate'] ? parseDate(taskData['截止日期'] || taskData['dueDate']) : null,
              // 处理标签，支持逗号分隔的字符串或数组格式
              tags: Array.isArray(taskData['标签'] || taskData['tags']) 
                ? (taskData['标签'] || taskData['tags']).map(tag => String(tag).trim()) 
                : (
                    // 确保在调用split前值为字符串
                    typeof (taskData['标签'] || taskData['tags']) !== 'string' ? 
                    String(taskData['标签'] || taskData['tags'] || '') : 
                    (taskData['标签'] || taskData['tags'] || '')
                  )
                  .split(/[,;]/) // 支持逗号或分号分隔
                  .map(tag => tag.trim())
                  .filter(tag => tag) // 过滤空标签
            };

            // 发送创建任务的请求
            const res = await api.post('/api/tasks', newTask);
            createdTasks.push(res.data);
          }

          // 使用函数式更新确保获取最新状态
          setTasks(prevTasks => {
            const newTasks = [...prevTasks, ...createdTasks];
            // 在函数式更新中直接更新treeData，确保使用最新数据
            setTreeData(buildTreeData(newTasks));
            return newTasks;
          });
          message.success(`成功导入 ${createdTasks.length} 个任务`);
          setImportModalVisible(false);
          setImportFile(null);
          // 强制刷新组件
          forceUpdate();
        } catch (error) {
          console.error('解析文件失败:', error);
          message.error(`解析文件失败: ${error.message}`);
        } finally {
          setImportLoading(false);
        }
      };

      if (importFile.type.includes('text/csv')) {
        reader.readAsArrayBuffer(importFile);
      } else {
        reader.readAsArrayBuffer(importFile);
      }
    } catch (error) {
      console.error('导入任务失败:', error);
      message.error(`导入任务失败: ${error.message}`);
      setImportLoading(false);
    }
  };

  // 批量删除任务
  const batchDeleteTasks = async () => {
    console.log('批量删除任务开始');
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的任务');
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      console.log('当前用户:', currentUser);
      if (!currentUser) {
        message.error('无法删除任务：用户未登录');
        return;
      }

      // 筛选出当前用户有权删除且存在的任务
      const deletableTaskIds = [];
      const invalidTaskIds = [];
      for (const taskId of selectedRowKeys) {
        const task = tasks.find(t => t._id === taskId);
        console.log('检查任务:', taskId, '存在:', !!task);
        if (task) {
          if (task.user._id === currentUser.id) {
            deletableTaskIds.push(taskId);
            console.log('任务', taskId, '可删除');
          } else {
            console.log('任务', taskId, '不可删除，不属于当前用户');
          }
        } else {
          invalidTaskIds.push(taskId);
          console.log('任务', taskId, '不存在');
        }
      }

      if (invalidTaskIds.length > 0) {
        message.warning(`以下任务不存在：${invalidTaskIds.join(', ')}`);
      }

      if (deletableTaskIds.length === 0) {
        message.error('没有权限删除所选任务或任务不存在');
        return;
      }

      console.log('准备删除的任务ID:', deletableTaskIds);
      // 发送批量删除请求
      const response = await api.delete('/api/tasks/batch', { data: { taskIds: deletableTaskIds } });
      console.log('删除响应:', response.data);

      // 更新任务列表
      setTasks(tasks.filter(task => !deletableTaskIds.includes(task._id)));
      // 清空选择
      setSelectedRowKeys([]);
      message.success(`成功删除 ${deletableTaskIds.length} 个任务`);
    } catch (err) {
        console.error('批量删除任务失败:', err);
        console.error('错误响应:', err.response);
        const errorData = err.response?.data;
        if (errorData) {
          if (errorData.msg === '部分任务不存在') {
            message.error(`以下任务不存在：${errorData.nonExistingTaskIds.join(', ')}`);
          } else if (errorData.msg === '部分任务您无权删除') {
            message.error(`以下任务您无权删除：${errorData.unauthorizedTaskIds.join(', ')}`);
          } else {
            message.error(errorData.msg || '批量删除任务失败，请重试');
          }
        } else {
          message.error('批量删除任务失败，请重试');
        }
      }
    console.log('批量删除任务结束');
  };

  // 批量更改任务状态
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('待办');

  const batchUpdateStatus = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的任务');
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        message.error('无法修改任务：用户未登录');
        return;
      }

      // 筛选出当前用户有权修改的任务
      const editableTaskIds = [];
      for (const taskId of selectedRowKeys) {
        const task = tasks.find(t => t._id === taskId);
        if (task && task.user._id === currentUser.id) {
          editableTaskIds.push(taskId);
        }
      }

      if (editableTaskIds.length === 0) {
        message.error('没有权限修改所选任务');
        return;
      }

      // 发送批量更新请求
      await api.put('/api/tasks/batch/status', {
        taskIds: editableTaskIds,
        status: newStatus
      });

      // 更新任务列表
      setTasks(tasks.map(task => {
        if (editableTaskIds.includes(task._id)) {
          return { ...task, status: newStatus };
        }
        return task;
      }));
      // 清空选择
      setSelectedRowKeys([]);
      setStatusModalVisible(false);
      message.success(`成功更新 ${editableTaskIds.length} 个任务的状态`);
    } catch (err) {
      console.error('批量更新任务状态失败:', err.response?.data || err.message);
      message.error('批量更新任务状态失败，请重试');
    }
  };

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      {/* 操作工具栏 - 批量操作和导入导出在同一行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {/* 左侧：批量操作工具栏 */}
        {hasSelected && (
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <span style={{ marginRight: '16px' }}>已选择 {selectedRowKeys.length} 个任务</span>
            <Button
              type="danger"
              icon={<DeleteOutlined />}
              onClick={batchDeleteTasks}
            >
              批量删除
            </Button>
            <Button
              type="primary"
              style={{ marginLeft: '8px' }}
              onClick={() => setStatusModalVisible(true)}
            >
              批量更改状态
            </Button>
          </div>
        )}

        {/* 右侧：导入导出按钮 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setImportModalVisible(true)}
          >
            导入任务
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportTasks}
          >
            导出任务
          </Button>
        </div>
      </div>

      {/* 任务表格 - 横排布局 */}
      <div className="horizontal-table-container">
        <Table
          className="horizontal-table"
          columns={columns}
          dataSource={treeData}
          loading={loading}
          rowKey="_id"
          style={{ width: '100%' }}
          pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: treeData?.length || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['5', '10', '20'],
          defaultPageSize: 5,
          onChange: handlePageChange,
          onShowSizeChange: handleShowSizeChange,
          showTotal: (total) => `共 ${total} 条记录`,
          prevIcon: <span>上一页</span>,
          nextIcon: <span>下一页</span>,
          itemRender: (current, type, originalElement) => {
            if (type === 'prev') {
              return <a>上一页</a>;
            }
            if (type === 'next') {
              return <a>下一页</a>;
            }
            if (type === 'pageSize') {
              return <span>{pageSize} / 页</span>;
            }
            return originalElement;
          },
          showSizeChangerText: '每页条数',
          locale: {
            items_per_page: '/ 页',
            jump_to: '跳转到',
            page: '页'
          }
        }}
      />
      </div>

      {/* 子任务模态框 */}
      <Modal
        title={`${currentTaskForSubTasks?.title || ''} 的子任务`}
        open={isSubTasksModalOpen}
        onCancel={closeSubTasksModal}
        width={800}
      >
        {renderSubTasks()}
      </Modal>

      {/* 批量更改状态模态框 */}
      <Modal
        title="批量更改状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setStatusModalVisible(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={batchUpdateStatus}>
            确认
          </Button>
        ]}
      >
        <div style={{ padding: '20px' }}>
          <Form layout="vertical">
            <Form.Item label="选择新状态" required>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
              >
                <option value="待办">待办</option>
                <option value="进行中">进行中</option>
                <option value="已完成">已完成</option>
              </select>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 导入任务模态框 */}
      <Modal
        title="导入任务"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportFile(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setImportModalVisible(false);
            setImportFile(null);
          }}>
            取消
          </Button>,
          <Button key="import" type="primary" loading={importLoading} onClick={importTasks}>
            导入
          </Button>
        ]}
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '16px' }}>请上传Excel或CSV格式的任务文件</p>

          <Upload
            beforeUpload={handleFileUpload}
            fileList={importFile ? [importFile] : []}
            onChange={({ file }) => setImportFile(file)}
            maxCount={1}
            accept=".xlsx,.xls,.csv"
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          {importFile && (
            <p style={{ marginTop: '16px', color: '#1890ff' }}>{importFile.name}</p>
          )}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ marginBottom: '8px' }}>文件格式要求：</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>支持Excel (.xlsx, .xls) 和 CSV 格式</li>
              <li>文件第一行必须是表头，包含以下字段：标题、描述、状态、优先级、截止日期、标签</li>
              <li>状态可选值：待办、进行中、已完成</li>
              <li>优先级可选值：高、中、低</li>
              <li>标签多个值用逗号分隔</li>
            </ul>
          </div>
        </div>
      </Modal>

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
            <Descriptions.Item label="标签" span={2}>
              {!selectedTaskDetail.tags || !Array.isArray(selectedTaskDetail.tags) || selectedTaskDetail.tags.length === 0 ? (
                <span style={{ color: '#999' }}>无标签</span>
              ) : (
                selectedTaskDetail.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      marginRight: '8px',
                      padding: '2px 8px',
                      backgroundColor: '#e6f7ff',
                      color: '#1890ff',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}
                  >
                    {tag}
                  </span>
                ))
              )}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDate(selectedTaskDetail.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDate(selectedTaskDetail.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="创建者" span={2}>{selectedTaskDetail.user?.username || '未知'}</Descriptions.Item>
            <Descriptions.Item label="子任务数量" span={2}>{selectedTaskDetail.children?.length || 0}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
</div>
  );
}

export default TaskList;
