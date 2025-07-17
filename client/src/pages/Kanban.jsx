import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import socket from '../socket/socket';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import ActivityLog from '../components/ActivityLog';
import { useNavigate } from 'react-router-dom';

const statusOptions = ['Todo', 'In Progress', 'Done'];

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data);
    } catch {
      alert('Failed to fetch tasks');
    }
  };

  useEffect(() => {
    socket.emit('user-connected', user.id);

    socket.on('task-created', (task) => {
      setTasks((prev) => [...prev, task]);
    });

    socket.on('task-updated', (updatedTask) => {
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
    });

    socket.on('task-deleted', (id) => {
      setTasks((prev) => prev.filter((task) => task._id !== id));
    });

    return () => {
      socket.off('task-created');
      socket.off('task-updated');
      socket.off('task-deleted');
    };
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSmartAssign = async (taskId) => {
    try {
      const res = await axios.post(`/tasks/${taskId}/smart-assign`);
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? res.data : task))
      );
    } catch {
      alert('Smart assign failed');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;

    // Don't update if dropped in same column
    if (destination.droppableId === source.droppableId) return;

    // Optimistically update task status locally:
    setTasks((prev) =>
      prev.map((task) =>
        task._id === draggableId ? { ...task, status: destination.droppableId } : task
      )
    );

    socket.emit('update-task', {
      taskId: draggableId,
      updatedFields: { status: destination.droppableId },
    });
  };

  // Add Task
  const handleAddTask = async () => {
    const title = prompt('Enter task title');
    if (!title) return;
    const description = prompt('Enter task description');
    try {
      const res = await axios.post('/tasks', {
        title,
        description,
        status: 'Todo',
        priority: 'Medium',
      });
      setTasks((prev) => [...prev, res.data]);
      socket.emit('task-created', res.data);
    } catch (err) {
      alert('Failed to add task');
    }
  };

  // Remove Task
  const handleRemoveTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      socket.emit('task-deleted', taskId);
    } catch {
      alert('Failed to delete task');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    socket.emit('user-disconnected', user.id);
    navigate('/login');
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary">Welcome, {user.name}</h2>
        <div>
          <button className="btn btn-success me-2" onClick={handleAddTask}>
            + Add Task
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="row gx-3">
          {statusOptions.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  className="col-md-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="card mb-4 shadow-sm">
                    <div className="card-header bg-info text-white fw-bold">
                      {status}
                    </div>
                    <div className="card-body" style={{ minHeight: '300px' }}>
                      {tasks
                        .filter((task) => task.status === status)
                        .map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                className={`card mb-3 ${
                                  snapshot.isDragging
                                    ? 'border-primary shadow'
                                    : ''
                                }`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="card-body">
                                  <h5 className="card-title">{task.title}</h5>
                                  <p className="card-text">{task.description}</p>
                                  <p className="mb-1">
                                    <strong>👤 Assigned to: </strong>
                                    {task.assignedTo?.name || 'Unassigned'}
                                  </p>
                                  <p className="mb-3">
                                    <strong>⭐ Priority: </strong>
                                    {task.priority}
                                  </p>

                                  <button
                                    className="btn btn-sm btn-outline-success me-2"
                                    onClick={() => handleSmartAssign(task._id)}
                                  >
                                    🤖 Smart Assign
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveTask(task._id)}
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <ActivityLog />
    </div>
  );
};

export default Kanban;
