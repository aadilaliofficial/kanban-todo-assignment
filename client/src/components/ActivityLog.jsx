import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import socket from '../socket/socket';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs');
    }
  };

  useEffect(() => {
    fetchLogs();

    socket.on('action-log-updated', () => {
      fetchLogs(); // refetch when log is updated
    });

    return () => {
      socket.off('action-log-updated');
    };
  }, []);

  return (
    <div className="activity-log">
      <h3>🕒 Activity Log</h3>
      <ul>
        {logs.map((log) => (
          <li key={log._id}>
            <strong>{log.action}</strong> by {log.performedBy?.name || 'Unknown'}<br />
            <small>{new Date(log.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;
