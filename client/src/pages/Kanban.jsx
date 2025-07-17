import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import socket from '../socket/socket';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import ActivityLog from '../components/ActivityLog';

const statusOptions = ['Todo', 'In Progress', 'Done'];

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

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

    socket.emit('update-task', {
      taskId: draggableId,
      updatedFields: { status: destination.droppableId },
    });
  };

  return (
    <div className="container my-4">
      <h2 className="mb-4 text-primary">Welcome, {user.name}</h2>

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
                                  snapshot.isDragging ? 'border-primary shadow' : ''
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
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleSmartAssign(task._id)}
                                  >
                                    🤖 Smart Assign
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
