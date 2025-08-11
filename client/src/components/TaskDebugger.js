import React, { useEffect } from 'react';

const TaskDebugger = ({ tasks }) => {
  useEffect(() => {
    console.log('TaskDebugger - 接收到的任务数据:', tasks);
    console.log('TaskDebugger - 任务数量:', tasks?.length);
  }, [tasks]);

  const downloadTasksData = () => {
    if (!tasks || tasks.length === 0) {
      alert('没有任务数据可下载');
      return;
    }

    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks-data.json';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>任务数据调试器</h2>
      <p>任务总数: {tasks?.length || 0}</p>
      <button
        onClick={downloadTasksData}
        style={{
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        下载任务数据
      </button>

      {tasks && tasks.length > 0 ? (
        <div>
          <h3>任务列表:</h3>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {tasks.map((task, index) => (
              <li key={task._id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee' }}>
                <div><strong>任务 {index + 1}:</strong> {task.name}</div>
                <div><strong>ID:</strong> {task._id}</div>
                <div><strong>状态:</strong> {task.status}</div>
                <div><strong>截止日期:</strong> {task.dueDate} (类型: {typeof task.dueDate})</div>
                <div><strong>子任务数量:</strong> {task.subTasks?.length || 0}</div>
                <pre style={{ maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
                  {JSON.stringify(task, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>没有任务数据</p>
      )}
    </div>
  );
};

export default TaskDebugger;