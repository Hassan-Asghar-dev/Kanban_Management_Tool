import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

export const DashboardContext = React.createContext({
  tasks: [],
  setTasks: () => {},
  isLoadingTasks: false,
  selectedTeamId: null,
  setSelectedTeamId: () => {},
  hasWorkdayStarted: false,
  setHasWorkdayStarted: () => {},
});

function WorkDayTracker({ onClose }) {
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [workdayId, setWorkdayId] = useState(null);
  const [lastStartTime, setLastStartTime] = useState(null); // Track last workday start
  const { tasks, isLoadingTasks, selectedTeamId, setHasWorkdayStarted } = useContext(DashboardContext);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser);
        checkLastWorkday(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const profileResponse = await axios.get('http://localhost:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(profileResponse.data.role);
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      setUserRole(null);
      toast.error('Failed to load user profile');
    }
  };

  const checkLastWorkday = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('http://localhost:8000/api/workdays/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.length > 0) {
        const latestWorkday = response.data.reduce((latest, current) =>
          new Date(latest.start_time) > new Date(current.start_time) ? latest : current
        );
        setLastStartTime(new Date(latestWorkday.start_time));
        if (!latestWorkday.end_time) {
          setWorkdayId(latestWorkday.id);
          setIsDayStarted(true);
          setStartTime(new Date(latestWorkday.start_time).getTime());
          setElapsedTime(Date.now() - new Date(latestWorkday.start_time).getTime());
          toast.info('Resumed active workday');
        }
      }
    } catch (error) {
      console.error('Error checking last workday:', error.response?.data || error.message);
      toast.error('Failed to check last workday');
    }
  };

  useEffect(() => {
    let timer;
    if (isDayStarted) {
      timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isDayStarted, startTime]);

  useEffect(() => {
    setHasWorkdayStarted(isDayStarted);
  }, [isDayStarted, setHasWorkdayStarted]);

  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const canStartDay = () => {
    if (lastStartTime) {
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceLastStart = Date.now() - lastStartTime;
      return timeSinceLastStart >= twentyFourHours;
    }
    return true;
  };

  const handleStartDay = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    if (!canStartDay()) {
      const timeLeft = Math.floor((24 * 60 * 60 * 1000 - (Date.now() - lastStartTime)) / (60 * 1000));
      toast.error(`You can start a new workday after ${timeLeft} minutes`);
      return;
    }
    try {
      const token = await user.getIdToken();
      const payload = {
        start_time: new Date().toISOString(),
      };
      console.log('Start workday payload:', payload);
      const response = await axios.post('/api/workdays/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Start workday response:', response.data);
      setWorkdayId(response.data.id);
      setIsDayStarted(true);
      setStartTime(Date.now());
      setLastStartTime(new Date(response.data.start_time));
      toast.success('Work day started!');
    } catch (error) {
      console.error('Start workday error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to start workday');
    }
  };

  const handleEndDay = async () => {
    if (!user || !workdayId) {
      toast.error('No active workday to end');
      return;
    }
    try {
      const token = await user.getIdToken();
      const payload = {
        end_time: new Date().toISOString(),
        working_hours: formatTime(elapsedTime), // Send calculated time
      };
      console.log('End workday payload:', payload);
      const response = await axios.patch(`/api/workdays/${workdayId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('End workday response:', response.data);
      setIsDayStarted(false);
      const workingHours = formatTime(elapsedTime);
      const progressSummary =
        tasks && Array.isArray(tasks) && tasks.length > 0
          ? tasks
              .map((task) => `${task.title || 'Untitled'}: ${task.progress ?? 0}%`)
              .join(', ')
          : 'No tasks assigned';
      toast.info(
        `Your day has ended! Working hours: ${workingHours}. Task Progress: ${progressSummary}`
      );
      setElapsedTime(0);
      setWorkdayId(null);
    } catch (error) {
      console.error('End workday error:', error.response?.data || error.message);
      toast.error(error.response?.data?.detail || 'Failed to end workday');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-100 to-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 hover:shadow-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Work Day Tracker</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-700">Elapsed Time</p>
          <p className="text-4xl font-mono text-indigo-600 font-bold">{formatTime(elapsedTime)}</p>
        </div>
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handleStartDay}
            disabled={isDayStarted || !canStartDay()}
            className={`px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
              isDayStarted || !canStartDay()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            Start Day
          </button>
          <button
            onClick={handleEndDay}
            disabled={!isDayStarted}
            className={`px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
              !isDayStarted
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
            }`}
          >
            End Day
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Progress</h2>
          {isLoadingTasks ? (
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-500" />
              <p className="text-sm">Loading tasks...</p>
            </div>
          ) : !selectedTeamId ? (
            <p className="text-gray-500 text-sm text-center">Please select a team in the Dashboard.</p>
          ) : !tasks || !Array.isArray(tasks) || tasks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">No tasks assigned.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id || `task-${task.title || 'untitled'}-${Math.random()}`}
                  className="bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800 text-sm">{task.title || 'Untitled Task'}</span>
                    <span className="text-sm font-semibold text-gray-600">{task.progress !== undefined ? `${task.progress}%` : '0%'}</span>
                  </div>
                  {task.assigned_to && (
                    <p className="text-xs text-gray-500 mb-2">Assigned to: {task.assigned_to}</p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        task.progress < 30
                          ? 'bg-red-500'
                          : task.progress < 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkDayTracker;