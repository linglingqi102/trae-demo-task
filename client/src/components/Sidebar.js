import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Menu, Layout } from 'antd';
import { 
  AppstoreOutlined, 
  BlockOutlined, 
  UserOutlined, 
  BarChartOutlined, 
  LogoutOutlined, 
  LoginOutlined, 
  UserAddOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  CalendarOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';

const { Sider } = Layout;

export default function Sidebar({ isAuthenticated, handleLogout, collapsed, toggleSidebar }) {
  const location = useLocation();

  // 根据当前路由确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/board') || path.includes('/task-board')) return 'board';
    if (path.includes('/users')) return 'users';
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/task-stats')) return 'task-stats';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/gantt')) return 'gantt';
    return 'tasks'; // 默认选中任务列表
  };

  return (
    <Sider width={collapsed ? 64 : 200} className="sidebar" collapsed={collapsed} style={{ transition: 'width 0.3s' }}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ display: collapsed ? 'none' : 'block' }}>导航菜单</h2>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
      <Menu 
        mode="inline" 
        className="sidebar-menu"
        inlineCollapsed={collapsed}
        selectedKeys={[getSelectedKey()]}
        items={isAuthenticated ? [
          {
            key: 'tasks',
            icon: <AppstoreOutlined />,
            label: <Link to="/tasks">任务列表</Link>
          },
          {
            key: 'board',
            icon: <BlockOutlined />,
            label: <Link to="/board">任务看板</Link>
          },
          {
            key: 'users',
            icon: <UserOutlined />,
            label: <Link to="/users">用户列表</Link>
          },
          {            key: 'stats',            icon: <BarChartOutlined />,            label: <Link to="/stats">用户统计</Link>          },          {            key: 'task-stats',            icon: <BarChartOutlined />,            label: <Link to="/task-stats">任务统计</Link>          },          {            key: 'calendar',            icon: <CalendarOutlined />,            label: <Link to="/calendar">任务日历</Link>          },          {            key: 'gantt',            icon: <BarChartOutlined />,            label: <Link to="/gantt">甘特图</Link>          },          {            key: 'logout',            icon: <LogoutOutlined />,            label: '登出',            onClick: handleLogout          }
        ] : [
          {
            key: 'login',
            icon: <LoginOutlined />,
            label: <Link to="/login">登录</Link>
          },
          {
            key: 'register',
            icon: <UserAddOutlined />,
            label: <Link to="/register">注册</Link>
          }
        ]}
      />
    </Sider>
  );
}

// 添加样式
const styles = `
.sidebar {
  height: 100vh;
  background: #f0f2f5;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #1890ff;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
}

.toggle-btn:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 16px;
  color: #1890ff;
}

.sidebar-menu {
  padding-top: 20px;
}
`;

// 注入样式
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
(document.head || document.documentElement).appendChild(styleSheet);