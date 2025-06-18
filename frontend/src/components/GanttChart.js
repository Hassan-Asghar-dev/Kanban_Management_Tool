import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const GanttChart = ({ isOpen, onClose, teamId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentDate = new Date('2025-06-02');

  useEffect(() => {
    if (isOpen && teamId) {
      setLoading(true);
      const fetchTasks = async () => {
        try {
          const auth = getAuth();
          const token = await auth.currentUser.getIdToken();
          const response = await axios.get(`http://localhost:8000/api/cards/?team_id=${teamId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const formattedTasks = response.data.map((task, index) => {
            const startDate = new Date(task.deadline ? task.deadline : currentDate);
            let endDate = new Date(startDate);
            let duration = 5;

            switch (task.column) {
              case 'backlog': duration = 7; break;
              case 'todo': duration = 5; break;
              case 'doing': duration = 3; break;
              case 'review': duration = 2; break;
              case 'done': duration = 1; break;
              default: duration = 5;
            }
            endDate.setDate(startDate.getDate() + duration - 1);

            const priority = task.priority || ['High', 'Medium', 'Low'][index % 3]; // Simulated priority

            return {
              id: task.id || index,
              task: task.title,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              duration,
              progress: Math.min(100, Math.max(0, task.progress || 0)),
              priority,
            };
          });
          formattedTasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
          setTasks(formattedTasks);
        } catch (error) {
          console.error('Error fetching tasks:', error);
          toast.error('Failed to load tasks for Gantt chart');
          setTasks([]);
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [isOpen, teamId]);

  const { projectStart, projectEnd, totalDays } = tasks.length
    ? {
        projectStart: new Date(Math.min(...tasks.map(t => new Date(t.startDate)))),
        projectEnd: new Date(Math.max(...tasks.map(t => new Date(t.endDate)))),
        totalDays: Math.ceil((new Date(Math.max(...tasks.map(t => new Date(t.endDate)))) - new Date(Math.min(...tasks.map(t => new Date(t.startDate))))) / (1000 * 60 * 60 * 24)) + 1,
      }
    : { projectStart: currentDate, projectEnd: currentDate, totalDays: 1 };

  const getTimelineStyles = (task) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const offsetDays = (start - projectStart) / (1000 * 60 * 60 * 24);
    const durationDays = (end - start) / (1000 * 60 * 60 * 24) + 1;
    const offsetPercent = (offsetDays / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    let barColor;
    if (task.progress >= 100) {
      barColor = 'bg-green-600';
    } else {
      switch (task.priority) {
        case 'High': barColor = 'bg-red-600'; break;
        case 'Medium': barColor = 'bg-yellow-500'; break;
        case 'Low': barColor = 'bg-blue-600'; break;
        default: barColor = 'bg-gray-600';
      }
    }

    const progressPercent = (task.progress / 100) * widthPercent;
    return { left: `${offsetPercent}%`, width: `${widthPercent}%`, barColor, progressWidth: `${progressPercent}%` };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-90vw shadow-lg overflow-x-auto max-h-80vh">
        <h2 className="text-2xl font-bold text-white mb-2">Gantt Chart for Team {teamId}</h2>
        <div className="mb-4 text-sm text-gray-400">
          Timeline: {projectStart.toISOString().split('T')[0]} to {projectEnd.toISOString().split('T')[0]} ({totalDays} days)
        </div>
        <div className="mb-4 text-sm text-gray-400">
          <p><strong>Priority Legend:</strong></p>
          <p><span className="inline-block w-4 h-4 bg-red-600 mr-2"></span>High Priority</p>
          <p><span className="inline-block w-4 h-4 bg-yellow-500 mr-2"></span>Medium Priority</p>
          <p><span className="inline-block w-4 h-4 bg-blue-600 mr-2"></span>Low Priority</p>
          <p><span className="inline-block w-4 h-4 bg-green-600 mr-2"></span>Completed</p>
        </div>
        {loading ? (
          <p className="text-gray-300">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-300">No tasks available for this team.</p>
        ) : (
          <div className="relative h-[400px]">
            <div className="absolute inset-0 grid grid-cols-[150px_1fr] gap-4">
              <div className="text-white">
                {tasks.map((task) => (
                  <div key={task.id} className="py-4 text-right pr-2">{task.task}</div>
                ))}
              </div>
              <div className="relative w-full h-full">
                {tasks.map((task, index) => {
                  const { left, width, barColor, progressWidth } = getTimelineStyles(task);
                  const topPosition = index * 48;
                  return (
                    <div
                      key={task.id}
                      className={`absolute h-6 ${barColor} arrow-bar`}
                      style={{ left, width, top: `${topPosition}px` }}
                    >
                      <div
                        className="absolute h-6 bg-green-500 arrow-bar"
                        style={{ width: progressWidth }}
                      ></div>
                    </div>
                  );
                })}
                <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-600"></div>
                {Array.from({ length: totalDays }, (_, i) => {
                  const date = new Date(projectStart);
                  date.setDate(date.getDate() + i);
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-gray-600"
                      style={{ left: `${(i / totalDays) * 100}%` }}
                    >
                      <span className="absolute -top-6 text-xs text-gray-400">{date.toISOString().split('T')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg"
        >
          Close
        </button>
      </div>
      <style>{`
        .max-w-90vw { max-width: 90vw; }
        .max-h-80vh { max-height: 80vh; }
        .arrow-bar {
          clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
        }
      `}</style>
    </div>
  );
};

export default GanttChart;