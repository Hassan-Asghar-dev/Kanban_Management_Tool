import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const BacklogManagement = ({ teamId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', deadline: '' });

  useEffect(() => {
    if (teamId) {
      setLoading(true);
      const fetchTasks = async () => {
        try {
          const auth = getAuth();
          const token = await auth.currentUser.getIdToken();
          const response = await axios.get(`http://localhost:8000/api/cards/?team_id=${teamId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Filter for backlog tasks and add priority if not present
          const backlogTasks = response.data
            .filter(task => task.column.toLowerCase() === 'backlog')
            .map(task => ({
              id: task.id,
              title: task.title,
              priority: task.priority || ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)], // Simulated priority
              deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
            }));
          setTasks(backlogTasks);
        } catch (error) {
          console.error('Error fetching backlog tasks:', error);
          toast.error('Failed to load backlog tasks');
          setTasks([]);
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [teamId]);

  const handleAddTask = async () => {
    if (!newTask.title) {
      toast.error('Task title is required');
      return;
    }
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      const taskData = {
        title: newTask.title,
        column: 'backlog',
        priority: newTask.priority,
        deadline: newTask.deadline || null,
        team_id: teamId,
      };
      const response = await axios.post(`http://localhost:8000/api/cards/`, taskData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks([...tasks, { ...taskData, id: response.data.id }]);
      setNewTask({ title: '', priority: 'Medium', deadline: '' });
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      await axios.delete(`http://localhost:8000/api/cards/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-600';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-5xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-white mb-4">Backlog Management for Team {teamId}</h2>
      
      {/* Add Task Form */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Add New Task</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="flex-1 p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-500"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-500"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="date"
            value={newTask.deadline}
            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <p className="text-gray-300">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-300">No backlog tasks available for this team.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-white border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2 text-left">Task</th >
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Deadline</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-2">{task.title}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block w-4 h-4 mr-2 ${getPriorityColor(task.priority)} rounded-full`}></span>
                    {task.priority}
                  </td>
                  <td className="px-4 py-2">{task.deadline || 'Not set'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BacklogManagement;