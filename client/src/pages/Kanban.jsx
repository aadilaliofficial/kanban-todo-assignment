import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import socket from '../socket/socket';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';

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
  }, []);

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

    const taskId = draggableId;
    const newStatus = destination.droppableId;

    // Don't update if dropped in same column
    if (destination.droppableId === source.droppableId) return;

    socket.emit('update-task', {
      taskId,
      updatedFields: { status: newStatus },
    });
  };

  return (
    <div className="kanban-container">
      <h2>Welcome, {user.name}</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-columns">
          {statusOptions.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  className="kanban-column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3>{status}</h3>
                  {tasks
                    .filter((task) => task.status === status)
                    .map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            className="kanban-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                            <p>👤 {task.assignedTo?.name || 'Unassigned'}</p>
                            <p>⭐ {task.priority}</p>

                            <button
                              onClick={() => handleSmartAssign(task._id)}
                            >
                              🤖 Smart Assign
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
        <div className="kanban-container">
      ...
    </div>
      </div>
    <ActivityLog />
    
    
  );
};

export default Kanban;
