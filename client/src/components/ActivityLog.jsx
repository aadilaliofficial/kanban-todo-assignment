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
    <div className="container my-4" style={{ maxWidth: '700px' }}>
      <h3 className="mb-4 text-secondary">
        <span role="img" aria-label="clock">🕒</span> Activity Log
      </h3>
      <ul className="list-group shadow-sm">
        {logs.length === 0 && (
          <li className="list-group-item text-center text-muted">No activity yet.</li>
        )}
        {logs.map((log) => (
          <li key={log._id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <strong>{log.action}</strong>
              <small className="text-muted">{new Date(log.createdAt).toLocaleString()}</small>
            </div>
            <div className="text-muted fst-italic mt-1">
              by {log.performedBy?.name || 'Unknown'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;
