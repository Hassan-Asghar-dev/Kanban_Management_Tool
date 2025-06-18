import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FiX, FiCheck, FiFlag, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const API_BASE_URL = 'http://localhost:8000';
const API_ENDPOINT = '/api/cards/';

const priorityColors = {
  high: '#ef4444',   // red-500
  medium: '#facc15', // yellow-400
  low: '#22c55e',    // green-500
  default: '#9ca3af' // gray-400
};

const Roadmap = ({ isOpen, onClose, teamId, members, tasks: propTasks }) => {
  const [cards, setCards] = useState(propTasks || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      if (propTasks?.length > 0) {
        setCards(propTasks);
        return;
      }

      if (!teamId) {
        toast.error('No team selected');
        return;
      }

      setIsLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
        const token = await user.getIdToken();
        const response = await axios.get(
          `${API_BASE_URL}${API_ENDPOINT}?team_id=${encodeURIComponent(teamId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format: Expected array');
        }

        const fetchedCards = response.data.map(card => ({
          ...card,
          progress: card.progress ?? 0,
          title: card.title || `Task ${card.id}`,
          deadline: card.deadline || null,
          priority: card.priority || 'Low',
          assigned_to: card.assigned_to || null,
        }));

        setCards(fetchedCards);
        if (fetchedCards.length === 0) {
          toast.warn('No tasks found for this team');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && teamId && !propTasks) fetchCards();
  }, [isOpen, teamId, propTasks]);

  // Filter valid cards with deadlines for chart
  const validCards = cards.filter(card => card.deadline && !isNaN(new Date(card.deadline).getTime()));

  // Extract unique sorted due dates (X axis) as category labels
  const dueDates = Array.from(
    new Set(validCards.map(card => format(parseISO(card.deadline), 'MMM dd, yyyy')))
  ).sort((a, b) => new Date(a) - new Date(b));

  // Map due date string to index for categorical x-axis
  const dueDateIndex = dueDates.reduce((acc, date, idx) => {
    acc[date] = idx;
    return acc;
  }, {});

  // Prepare chart data points with x = due date index, y = card index
  const chartData = {
    labels: validCards.map(card => card.title), // y-axis labels (task titles)
    datasets: [
      {
        label: 'Tasks',
        data: validCards.map((card, idx) => {
          const dateStr = format(parseISO(card.deadline), 'MMM dd, yyyy');
          return { x: dueDateIndex[dateStr], y: idx };
        }),
        backgroundColor: validCards.map(card =>
          priorityColors[(card.priority || 'default').toLowerCase()] || priorityColors.default
        ),
        pointRadius: 10,
        pointHoverRadius: 14,
      },
    ],
  };

  // Chart options with categorical x-axis and y-axis
  const chartOptions = {
    scales: {
      x: {
        type: 'category',
        labels: dueDates,
        title: {
          display: true,
          text: 'Due Dates',
          color: '#22c55e',
          font: { size: 16, weight: 'bold' },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: '#22c55e',
          autoSkip: false,
        },
        grid: {
          color: '#374151',
        },
      },
      y: {
        type: 'category',
        labels: validCards.map(card => card.title),
        title: {
          display: true,
          text: 'Tasks',
          color: '#22c55e',
          font: { size: 16, weight: 'bold' },
        },
        ticks: {
          color: '#22c55e',
        },
        grid: {
          color: '#374151',
        },
        offset: true,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const card = validCards[context.dataIndex];
            const assigned =
              card.assigned_to !== null
                ? members.find(m => m.id === card.assigned_to)?.name || 'Unknown'
                : 'Unassigned';
            return [
              `Title: ${card.title}`,
              `Due: ${format(parseISO(card.deadline), 'MMM dd, yyyy')}`,
              `Progress: ${card.progress}%`,
              `Priority: ${card.priority}`,
              `Assigned To: ${assigned}`,
            ];
          },
        },
        backgroundColor: '#15803d',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
      legend: {
        labels: { color: '#22c55e', font: { size: 14 } },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Function to get priority color for text
  const getPriorityColor = priority => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl border border-green-700">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-green-400 tracking-wide">Team Roadmap</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="text-green-300 hover:text-green-100 transition-colors duration-200"
          aria-label="Close roadmap"
        >
          <FiX size={28} />
        </motion.button>
      </div>

      {validCards.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-green-700"
          style={{ height: '400px' }}
        >
          <h3 className="text-xl font-semibold mb-4 text-green-300">Task Due Dates</h3>
          <Scatter data={chartData} options={chartOptions} />
        </motion.div>
      ) : (
        <p className="text-green-300 text-center py-4">No tasks with valid due dates found.</p>
      )}

      {validCards.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-green-700">
          <div className="space-y-3">
            {validCards.map((card, index) => (
              <motion.div
                key={index}
                className="flex items-center text-green-200 bg-gray-700/50 p-2 rounded-md"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <span className="flex-1 flex items-center space-x-2">
                  <span>{card.title}:</span>
                  <span className="flex items-center">
                    {card.progress}% 
                    {card.progress === 100 && (
                      <FiCheck className="text-green-500 ml-1" size={16} />
                    )}
                  </span>
                  <span className="flex items-center">
                    <FiFlag className={`${getPriorityColor(card.priority)} ml-2 mr-1`} size={16} />
                    {card.priority}
                  </span>
                  <span className="flex items-center">
                    <FiUser className="text-blue-400 ml-2 mr-1" size={16} />
                    {card.assigned_to ? members.find(m => m.id === card.assigned_to)?.name || 'Unknown' : 'Unassigned'}
                  </span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;