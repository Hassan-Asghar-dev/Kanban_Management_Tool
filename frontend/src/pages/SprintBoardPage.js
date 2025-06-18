import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GripVertical, X, Edit } from 'lucide-react';
import axios from 'axios';

// Set axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Item type for react-dnd
const ItemTypes = {
  CARD: 'card',
};

// Draggable Card Component
const Card = ({ card, moveCard, openEditPopUp, userRole }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.CARD,
    item: { id: card.id, status: card.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return 'None';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={preview}
      className={`bg-gray-900 border-2 border-emerald-400 rounded-lg p-4 mb-3 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center ${
        isDragging ? 'opacity-70 scale-105' : 'opacity-100'
      }`}
    >
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing p-2 -ml-2 mr-2 text-emerald-400 hover:text-emerald-300"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-white">{card.title}</h3>
        <p className="text-xs text-gray-300 mt-1">Sprint Start: {formatDateTime(card.sprintStart)}</p>
        <p className="text-xs text-gray-300 mt-1">Sprint Finish: {formatDateTime(card.sprintFinish)}</p>
        {userRole === 'Project Manager' && (
          <button
            onClick={() => openEditPopUp(card)}
            className="mt-2 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

// Droppable Column Component
const Column = ({ column, cards, moveCard, openEditPopUp, userRole }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop: (item) => moveCard(item.id, column.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[200px] max-w-[280px] rounded-lg p-4 shadow-xl transition-all duration-300 ${
        isOver
          ? 'border-2 border-emerald-400 bg-emerald-900/50 animate-pulse'
          : 'border border-emerald-700 bg-gradient-to-b from-emerald-900 to-emerald-950'
      }`}
    >
      <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
        {column.title}
        <span className="text-sm font-medium text-emerald-300">({cards.length})</span>
      </h2>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          moveCard={moveCard}
          openEditPopUp={openEditPopUp}
          userRole={userRole}
        />
      ))}
    </div>
  );
};

// Add Task Pop-Up Component
const AddTaskPopUp = ({ isOpen, onClose, onSave, teamId, user }) => {
  const [sprintStart, setSprintStart] = useState('');
  const [sprintFinish, setSprintFinish] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

  const handleSave = async () => {
    if (!sprintStart) {
      setError('Sprint start date and time are required');
      return;
    }
    if (!sprintFinish) {
      setError('Sprint finish date and time are required');
      return;
    }
    if (sprintStart > sprintFinish) {
      setError('Sprint finish must be after sprint start');
      return;
    }
    setError('');
    const payload = {
      team: teamId,
      title: `Task for Sprint ${new Date(sprintStart).toLocaleDateString()}`,
      column: 'backlog',
      sprint_start: new Date(sprintStart).toISOString(),
      sprint_finish: new Date(sprintFinish).toISOString(),
    };
    console.log('Add task payload:', payload); // Debug log
    try {
      const response = await axios.post(`/api/cards/`, payload, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      console.log('Add task response:', response.data); // Debug log
      onSave(response.data);
      setSprintStart('');
      setSprintFinish('');
      onClose();
    } catch (error) {
      console.error('Add task error:', error.response?.status, error.response?.data); // Debug log
      setError(error.response?.data?.detail || 'Failed to add task');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-in">
      <div className="bg-gray-900 border-2 border-emerald-500 rounded-lg p-6 w-full max-w-sm shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-emerald-400">Add New Task</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Sprint Start</label>
            <input
              type="datetime-local"
              value={sprintStart}
              onChange={(e) => setSprintStart(e.target.value)}
              min={today}
              className="w-full bg-gray-800 border border-emerald-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Sprint Finish</label>
            <input
              type="datetime-local"
              value={sprintFinish}
              onChange={(e) => setSprintFinish(e.target.value)}
              min={sprintStart || today}
              className="w-full bg-gray-800 border border-emerald-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Task Pop-Up Component
const EditTaskPopUp = ({ isOpen, onClose, onSave, card, user }) => {
  const [sprintStart, setSprintStart] = useState(card?.sprint_start || '');
  const [sprintFinish, setSprintFinish] = useState(card?.sprint_finish || '');
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 16);

  // Define statusToColumn mapping
  const statusToColumn = {
    Backlog: 'backlog',
    TODO: 'todo',
    'In Progress': 'doing',
    Review: 'review',
    Done: 'done',
  };

  const handleSave = async () => {
    if (!sprintStart) {
      setError('Sprint start date and time are required');
      return;
    }
    if (!sprintFinish) {
      setError('Sprint finish date and time are required');
      return;
    }
    if (sprintStart > sprintFinish) {
      setError('Sprint finish must be after sprint start');
      return;
    }
    setError('');
    const payload = {
      sprint_start: new Date(sprintStart).toISOString(),
      sprint_finish: new Date(sprintFinish).toISOString(),
      column: statusToColumn[card.status],
    };
    console.log('Edit task payload:', payload); // Debug log
    try {
      const response = await axios.patch(`/api/cards/${card.id}/`, payload, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      console.log('Edit task response:', response.data); // Debug log
      onSave(response.data);
      onClose();
    } catch (error) {
      console.error('Edit task error:', error.response?.status, error.response?.data); // Debug log
      setError(error.response?.data?.detail || 'Failed to update task');
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-in">
      <div className="bg-gray-900 border-2 border-emerald-500 rounded-lg p-6 w-full max-w-sm shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-emerald-400">Edit Task</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Sprint Start</label>
            <input
              type="datetime-local"
              value={sprintStart}
              onChange={(e) => setSprintStart(e.target.value)}
              min={today}
              className="w-full bg-gray-800 border border-emerald-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Sprint Finish</label>
            <input
              type="datetime-local"
              value={sprintFinish}
              onChange={(e) => setSprintFinish(e.target.value)}
              min={sprintStart || today}
              className="w-full bg-gray-800 border border-emerald-600 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const SprintBoardPage = ({ teamId, user, onClose }) => {
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isAddPopUpOpen, setIsAddPopUpOpen] = useState(false);
  const [isEditPopUpOpen, setIsEditPopUpOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState('');

  // Map backend column values to frontend status values
  const columnToStatus = {
    backlog: 'Backlog',
    todo: 'todo',
    doing: 'In Progress',
    review: 'Review',
    done: 'Done',
  };
  const statusToColumn = {
    Backlog: 'backlog',
    TODO: 'todo',
    'In Progress': 'doing',
    Review: 'review',
    Done: 'done',
  };

  // Fetch user role, cards, and members
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Team ID:', teamId); // Debug log
        console.log('User:', user); // Debug log
        const token = await user.getIdToken();
        console.log('Token:', token); // Debug log

        // Fetch user role
        console.log('Fetching profile...');
        const profileResponse = await axios.get('/api/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Profile response:', profileResponse.data);
        setUserRole(profileResponse.data.role);

        // Fetch cards
        console.log('Fetching cards...');
        const cardsResponse = await axios.get(`/api/cards/?team_id=${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Cards response:', cardsResponse.data);
        setCards(
          cardsResponse.data.map((card) => ({
            id: card.id.toString(),
            title: card.title,
            status: columnToStatus[card.column] || 'Backlog',
            sprintStart: card.sprint_start,
            sprintFinish: card.sprint_finish,
          }))
        );

        // Fetch team details to get members
        console.log('Fetching team details...');
        const teamResponse = await axios.get(`/api/teams/${teamId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Team response:', teamResponse.data);
        setMembers(teamResponse.data.members || []);
      } catch (error) {
        console.error('Fetch error:', error.response?.status, error.response?.data); // Debug log
        if (error.response?.status === 403) {
          setError('You are not a member of this team');
        } else if (error.response?.status === 404) {
          setError('Team not found');
        } else {
          setError(error.response?.data?.detail || 'Failed to load data');
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user]);

  // Check for expired sprints and move tasks to Backlog
  useEffect(() => {
    const checkExpiredSprints = async () => {
      const today = new Date();
      const expiredCards = cards.filter((card) => {
        if (!card.sprintFinish) return false;
        const sprintFinishDate = new Date(card.sprintFinish);
        return sprintFinishDate < today && card.status !== 'Backlog';
      });

      if (expiredCards.length > 0) {
        try {
          const token = await user.getIdToken();
          for (const card of expiredCards) {
            await axios.patch(
              `/api/cards/${card.id}/`,
              { column: 'backlog' },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          setCards((prevCards) =>
            prevCards.map((card) =>
              expiredCards.find((c) => c.id === card.id)
                ? { ...card, status: 'Backlog' }
                : card
            )
          );
        } catch (error) {
          console.error('Expired sprints error:', error.response?.status, error.response?.data); // Debug log
          setError(error.response?.data?.detail || 'Failed to update expired tasks');
        }
      }
    };

    checkExpiredSprints(); // Run on mount
    const interval = setInterval(checkExpiredSprints, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [cards, user]);

  // Move card to new column
  const moveCard = async (cardId, newStatus) => {
    const today = new Date();
    const card = cards.find((c) => c.id === cardId);
    if (card && card.sprintFinish) {
      const sprintFinishDate = new Date(card.sprintFinish);
      if (sprintFinishDate < today && newStatus !== 'Backlog') {
        alert('Cannot move expired sprint task. It has been moved to Backlog.');
        return;
      }
    }
    try {
      const token = await user.getIdToken();
      const response = await axios.patch(
        `/api/cards/${cardId}/`,
        { column: statusToColumn[newStatus] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Move card response:', response.data); // Debug log
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                status: newStatus,
                sprintStart: response.data.sprint_start,
                sprintFinish: response.data.sprint_finish,
              }
            : card
        )
      );
    } catch (error) {
      console.error('Move card error:', error.response?.status, error.response?.data); // Debug log
      setError(error.response?.data?.detail || 'Failed to move task');
    }
  };

  // Add new task
  const addTask = (newTask) => {
    setCards((prevCards) => [
      ...prevCards,
      {
        id: newTask.id.toString(),
        title: newTask.title,
        status: columnToStatus[newTask.column] || 'Backlog',
        sprintStart: newTask.sprint_start,
        sprintFinish: newTask.sprint_finish,
      },
    ]);
  };

  // Edit task
  const editTask = (updatedTask) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === updatedTask.id
          ? {
              ...card,
              title: updatedTask.title,
              status: columnToStatus[updatedTask.column] || 'Backlog',
              sprintStart: updatedTask.sprint_start,
              sprintFinish: updatedTask.sprint_finish,
            }
          : card
      )
    );
  };

  // Open edit pop-up
  const openEditPopUp = (card) => {
    setSelectedCard(card);
    setIsEditPopUpOpen(true);
  };

  // Define columns
  const columns = [
    { id: 'Backlog', title: 'Backlog' },
    { id: 'TODO', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Review', title: 'Review' },
    { id: 'Done', title: 'Done' },
  ];

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-in">
      <div className="bg-gray-900 border-2 border-emerald-500 rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto shadow-2xl backdrop-blur-sm">
        <div className="relative flex items-center justify-center mb-4">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              Sprint Board
            </h1>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <button onClick={onClose} className="absolute right-0 text-gray-300 hover:text-white">
            <X className="w-8 h-8" />
          </button>
        </div>
        <DndProvider backend={HTML5Backend}>
          <div className="flex flex-wrap gap-4 justify-center">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                cards={cards.filter((card) => card.status === column.id)}
                moveCard={moveCard}
                openEditPopUp={openEditPopUp}
                userRole={userRole}
              />
            ))}
          </div>

          {/* Team Members */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">
              Team Members
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center bg-gray-900 border border-emerald-500 p-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-4 text-lg font-semibold">
                    {member.name[0]}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">{member.name}</span>
                    <p className="text-xs text-gray-300">{member.role || 'Team Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Task Pop-Up */}
          <AddTaskPopUp
            isOpen={isAddPopUpOpen}
            onClose={() => setIsAddPopUpOpen(false)}
            onSave={addTask}
            teamId={teamId}
            user={user}
          />

          {/* Edit Task Pop-Up */}
          <EditTaskPopUp
            isOpen={isEditPopUpOpen}
            onClose={() => {
              setIsEditPopUpOpen(false);
              setSelectedCard(null);
            }}
            onSave={editTask}
            card={selectedCard}
            user={user}
          />
        </DndProvider>
      </div>
    </div>
  );
};

export default SprintBoardPage;