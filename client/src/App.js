// 移除未使用的logo导入
import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import TaskBoard from './components/TaskBoard';
import TaskCalendar from './components/TaskCalendar';
import TaskGantt from './components/TaskGantt';
import SimpleGantt from './components/SimpleGantt';
import TaskDebugger from './components/TaskDebugger';
import GanttTestPage from './components/GanttTestPage';
import TaskStats from './components/TaskStats';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserList from './components/UserList';
import UserStats from './components/UserStats';
import MessageTest from './components/MessageTest';
import Sidebar from './components/Sidebar';
import authService, { api, isTokenExpired } from './services/authService';
import { Layout, ConfigProvider } from 'antd';

const { Content, Header, Footer } = Layout;

// 带布局的路由组件
const LayoutRoute = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // 检查是否有认证令牌
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 检查令牌是否过期
      if (isTokenExpired()) {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        // 避免在组件挂载时立即重定向
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        authService.setAuthToken(token);
        setIsAuthenticated(true);
        // 获取用户信息
        const userInfo = authService.getCurrentUser();
        if (userInfo) {
          setUser(userInfo);
        } else {
          authService.logout();
          setIsAuthenticated(false);
          // 避免在组件挂载时立即重定向
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
  }, []);

  // 登出处理
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    authService.setAuthToken(null);
    // 重定向到登录页
    window.location.href = '/login';
  };

  return (
    <Layout className="app-layout">
      <Sidebar isAuthenticated={isAuthenticated} handleLogout={handleLogout} collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <Layout className="main-content" style={{ marginLeft: collapsed ? '64px' : '200px', width: collapsed ? 'calc(100% - 64px)' : 'calc(100% - 200px)', transition: 'margin-left 0.3s, width 0.3s' }}>
        <Header className="app-header">
          <h1>多人任务管理系统</h1>
          {isAuthenticated && user && <p className="welcome-message">欢迎, {user.username}!</p>}
        </Header>
        <Content className="app-content">
          {children}
        </Content>
        <Footer className="app-footer">
          <p>© {new Date().getFullYear()} 多人任务管理系统</p>
        </Footer>
      </Layout>
    </Layout>
  );
};

// 不带布局的路由组件
const NoLayoutRoute = ({ children }) => {
  return <>{children}</>;
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // 获取当前登录用户
  useEffect(() => {
    const userInfo = authService.getCurrentUser();
    if (userInfo) {
      setCurrentUser(userInfo);
    }
  }, []);

  // 获取所有任务数据
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        const res = await api.get('/api/tasks');
        setTasks(res.data);
      } catch (err) {
        // 错误处理可以留空或添加到错误状态中
      }
    };

    fetchTasks();
  }, []);

  return (
    <ConfigProvider>
      <Router>
        <div style={{ padding: '20px', margin: '0 auto' }}>
          <Routes>
          {/* 不需要布局的页面 */}
          <Route path="/login" element={<NoLayoutRoute><Login /></NoLayoutRoute>} /> 
          <Route path="/register" element={<NoLayoutRoute><Register /></NoLayoutRoute>} /> 
          <Route path="/forgot-password" element={<NoLayoutRoute><ForgotPassword /></NoLayoutRoute>} /> 
          <Route path="/reset-password/:resetToken" element={<NoLayoutRoute><ResetPassword /></NoLayoutRoute>} /> 
          {/* 移除测试路由 */}

          {/* 需要布局的页面 - 已添加LayoutRoute包裹 */} 
                      <Route path="/tasks"
                        element={<LayoutRoute>
                          <>
                            <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
                            <TaskList tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} />
                          </>
                        </LayoutRoute>}
                      /> 
                      <Route
                        path="/users"
                        element={<LayoutRoute><UserList /></LayoutRoute>}
                      /> 
                      <Route
                        path="/stats"
                        element={<LayoutRoute><UserStats /></LayoutRoute>}
                      /> 
                      <Route path="/board"
                        element={<LayoutRoute>
                          <>
                            <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
                            <TaskBoard tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
                          </>
                        </LayoutRoute>}
                      />
                      <Route path="/calendar"
                        element={<LayoutRoute>
                          <>
                            <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
                            <TaskCalendar tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
                          </>
                        </LayoutRoute>}
                      /> 
                      <Route path="/gantt"
                        element={<LayoutRoute>
                          <>
                            <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
                            <TaskGantt tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
                          </> 
                        </LayoutRoute>}
                      />
                      <Route path="/simple-gantt"
                        element={<LayoutRoute>
                          <>
                            <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
                            <SimpleGantt tasks={tasks} />
                          </> 
                        </LayoutRoute>}
                      />
                      <Route path="/task-debugger"
                        element={<LayoutRoute><TaskDebugger /></LayoutRoute>}
                      />
                      <Route path="/gantt-test"
                        element={<LayoutRoute><GanttTestPage /></LayoutRoute>}
                      />
                      <Route path="/task-stats"
                        element={<LayoutRoute><TaskStats tasks={tasks} /></LayoutRoute>}
                      />
          {/* 首页 */}
          <Route path="/" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <TaskList tasks={tasks} setTasks={setTasks} setCurrentTask={setCurrentTask} />
            </>
          </LayoutRoute>} />

          {/* 其他需要布局的页面 */}
          <Route path="/user-list" element={<LayoutRoute><UserList /></LayoutRoute>} />
          <Route path="/user-stats" element={<LayoutRoute><UserStats /></LayoutRoute>} />
          <Route path="/message-test" element={<LayoutRoute><MessageTest /></LayoutRoute>} />
          <Route path="/tasks" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <TaskList tasks={tasks} setTasks={setTasks} setCurrentTask={setCurrentTask} />
            </>
          </LayoutRoute>} />
          <Route path="/users" element={<LayoutRoute><UserList /></LayoutRoute>} />
          <Route path="/stats" element={<LayoutRoute><UserStats /></LayoutRoute>} />
          <Route path="/board" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <TaskBoard tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
            </>
          </LayoutRoute>} />
          <Route path="/calendar" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <TaskCalendar tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
            </>
          </LayoutRoute>} />
          <Route path="/gantt" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <TaskGantt tasks={tasks} setTasks={setTasks} currentTask={currentTask} setCurrentTask={setCurrentTask} currentUser={currentUser} />
            </>
          </LayoutRoute>} />
          <Route path="/simple-gantt" element={<LayoutRoute>
            <>
              <TaskForm currentTask={currentTask} setCurrentTask={setCurrentTask} setTasks={setTasks} currentUser={currentUser} />
              <SimpleGantt tasks={tasks} />
            </>
          </LayoutRoute>} />
          <Route path="/task-debugger" element={<LayoutRoute><TaskDebugger /></LayoutRoute>} />
          <Route path="/gantt-test" element={<LayoutRoute><GanttTestPage /></LayoutRoute>} />
          <Route path="/task-stats" element={<LayoutRoute><TaskStats tasks={tasks} /></LayoutRoute>} />
          </Routes>
            </div>
            </Router> 
          </ConfigProvider> 
  );
}

export default App;
