import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, message, Spin, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';

export default function UserList() {
  // 美化样式定义
  const styles = `
  /* 全局容器样式 */
  body .user-list-container {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #ff6b6b !important;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    position: relative;
    z-index: 1;
  }

  /* 标题样式 */
  .user-list-container h2 {
    color: #333;
    font-size: 24px;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #4a90e2;
    font-weight: 600;
  }

  /* 搜索栏样式 */
  .search-bar {
    display: flex;
    margin-bottom: 24px;
    gap: 12px;
  }

  .search-input {
    flex: 1;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }

  /* 加载动画样式 */
  .loading-spinner {
    display: block;
    margin: 60px auto;
  }

  /* 表格样式 */
  .user-table {
    margin-top: 24px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  /* 美化antd表格 */
  .user-table .ant-table-thead > tr > th {
    background-color: #4a90e2;
    color: white;
    font-weight: 500;
    text-align: left;
    padding: 12px 16px;
  }

  .user-table .ant-table-tbody > tr {
    transition: background-color 0.3s ease;
  }

  .user-table .ant-table-tbody > tr:hover {
    background-color: #f0f7ff;
  }

  .user-table .ant-table-tbody > tr > td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* 无结果样式 */
  .no-results {
    text-align: center;
    padding: 60px 20px;
    color: #666;
    background-color: white;
    border-radius: 8px;
    margin-top: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .no-results p {
    margin: 0;
    font-size: 16px;
  }

  /* 响应式调整 */
  @media (max-width: 768px) {
    .user-list-container {
      padding: 16px;
    }

    .search-bar {
      flex-direction: column;
    }

    .search-input {
      width: 100%;
    }
  }
  `;

  // 样式注入
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    (document.head || document.documentElement).appendChild(styleSheet);
    console.log('样式已注入');

    return () => {
      // 清理样式
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  // 将ref移到组件顶层
  const successMessageShown = React.useRef(false);

  // 表格列定义
  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机号', dataIndex: 'phone', key: 'phone', render: (phone) => phone || '未设置' },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleString() }
  ];

  // 获取所有用户
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (err) {
        console.error('获取用户列表失败:', err.response?.data || err.message);
        message.error('获取用户列表失败');
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  // 搜索用户
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // 处理搜索
  const handleSearch = () => {
    // 搜索逻辑已在useEffect中处理
  };

  return (
    <div className="user-list-container" style={{ backgroundColor: '#ff0000 !important' }}>
      <h2>用户列表</h2>
      <div className="search-bar">
        <Input
          placeholder="搜索用户名、邮箱或手机号..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
        />
      </div>

      {loading ? (
        <Spin size="large" className="loading-spinner" />
      ) : filteredUsers.length > 0 ? (
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          className="user-table"
        />
      ) : (
        <div className="no-results">
          <p>没有找到匹配的用户</p>
        </div>
      )}
    </div>
  );
}