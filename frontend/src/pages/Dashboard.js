import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FiTrash, FiEdit, FiMoreVertical, FiCalendar, FiCheckCircle, FiPlus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import GanttChart from '../components/GanttChart';
import SprintBoardPage from './SprintBoardPage';
import WorkDayTracker from '../components/WorkDayTracker';
import BurndownChart from '../components/BurndownChart';
import Roadmap from '../components/Roadmap';

import { DashboardContext } from '../components/WorkDayTracker';

const ChartDropdown = ({ teamId, setIsGanttOpen, setIsSprintBoardOpen, setIsBurndownChartOpen, toast }) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownVariants = {
    hidden: { opacity: 0, scaleY: 0, transformOrigin: 'top' },
    visible: { opacity: 1, scaleY: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scaleY: 0, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    pressed: { scale: 0.95 },
  };

  return (
    <div className="relative inline-block text- ml-8">
      <motion.button
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="pressed"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors duration-300 shadow-md"
      >
        Chart
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-10 bg-neutral-800 rounded-lg shadow-lg mt-2 w-48 border border-neutral-700"
          >
            <div className="flex flex-col gap-2 p-2">
              <motion.button
                whileHover={{ backgroundColor: '#15803d', color: '#86efac' }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Show Gantt Chart clicked (Board), teamId:', teamId);
                  if (!teamId) {
                    toast.error('No team selected');
                    return;
                  }
                  setIsGanttOpen(true);
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-900 hover:text-green-500 rounded-lg text-sm text-white text-left"
              >
                 Gantt Chart
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#047857', color: '#d1fae5' }}
                onClick={() => {
                  setIsSprintBoardOpen(true);
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-300 text-left"
              >
                 Sprint Board
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#4f46e5', color: '#a5b4fc' }}
                onClick={() => {
                  if (!teamId) {
                    toast.error('No team selected');
                    return;
                  }
                  setIsBurndownChartOpen(true);
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-900 hover:text-indigo-500 rounded-lg text-sm text-white text-left"
              >
                 Burndown Chart
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null);
  const [teamCode, setTeamCode] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [isGanttOpen, setIsGanttOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false); // New state for roadmap
  const [isWorkDayTrackerOpen, setIsWorkDayTrackerOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [hasWorkdayStarted, setHasWorkdayStarted] = useState(false);

  const contextValue = {
    tasks,
    setTasks,
    isLoadingTasks,
    selectedTeamId,
    setSelectedTeamId,
    hasWorkdayStarted,
    setHasWorkdayStarted,
  };

  useEffect(() => {
    console.log('isRoadmapOpen state changed:', isRoadmapOpen);
  }, [isRoadmapOpen]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser);
        fetchTeams(currentUser);
      } else {
        setUserRole(null);
        setUserProfileId(null);
        setTeams([]);
        setSelectedTeamId(null);
      }
    });
    return () => unsubscribe();
  }, [setSelectedTeamId]);

  useEffect(() => {
    console.log('Selected team changed:', selectedTeam);
    setSelectedTeamId(selectedTeam?.id || null);
  }, [selectedTeam, setSelectedTeamId]);

  const fetchUserProfile = async (user) => {
    try {
      const response = await axios.get('http://localhost:8000/api/profile/', {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      setUserRole(response.data.role);
      setUserProfileId(response.data.id);
      console.log('UserProfile fetched:', response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const fetchTeams = async (user) => {
    try {
      const response = await axios.get('http://localhost:8000/api/teams/', {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      console.log('Fetched teams:', response.data);
      setTeams(response.data);
      if (teamDetails) {
        const updatedTeam = response.data.find((team) => team.id === teamDetails.id);
        if (updatedTeam) {
          setTeamDetails(updatedTeam);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    }
  };

  const generateTeamCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const createTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }
    try {
      const newTeamCode = generateTeamCode();
      const response = await axios.post(
        'http://localhost:8000/api/teams/',
        { name: teamName, code: newTeamCode },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      const newTeam = response.data;
      setTeams([...teams, newTeam]);
      setTeamName('');
      setShowCreateTeam(false);
      setTeamCode(newTeam.code);
      toast.success(`Team ${newTeam.name} created successfully`);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(error.response?.data?.detail || 'Failed to create team');
    }
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Please enter a team code');
      setJoinSuccess(null);
      toast.error('Team code is required');
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:8000/api/teams/join/',
        { code: joinCode.trim() },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setJoinCode('');
      setJoinError(null);
      setJoinSuccess(`Successfully joined team: ${response.data.name}`);
      fetchTeams(user);
      toast.success(`Joined team ${response.data.name}`);
    } catch (error) {
      console.error('Error joining team:', error);
      setJoinError(error.response?.data?.detail || 'Error joining team');
      setJoinSuccess(null);
      toast.error('Failed to join team');
    }
  };

  const deleteTeam = async (teamId, teamName) => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can delete teams');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"?`)) return;

    const originalTeams = [...teams];
    setTeams(teams.filter((team) => team.id !== teamId));
    if (teamDetails && teamDetails.id === teamId) {
      setTeamDetails(null);
    }
    if (selectedTeam && selectedTeam.id === teamId) {
      setSelectedTeam(null);
      setSelectedTeamId(null);
    }

    try {
      await axios.delete(`http://localhost:8000/api/teams/${teamId}/`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      toast.success(`Team ${teamName} deleted`);
    } catch (error) {
      console.error('Error deleting team:', error.response?.data || error.message);
      setTeams(originalTeams);
      if (teamDetails && teamDetails.id === teamId) {
        setTeamDetails(originalTeams.find((team) => team.id === teamId));
      }
      toast.error('Failed to delete team: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const removeMember = async (teamId, memberId) => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can remove team members');
      return;
    }
    const member = teamDetails.members.find((m) => m.id === memberId);
    const memberName = member ? member.name : `User ${memberId}`;
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    const originalTeamDetails = teamDetails ? { ...teamDetails } : null;
    if (teamDetails && teamDetails.id === teamId) {
      setTeamDetails({
        ...teamDetails,
        members: teamDetails.members.filter((m) => m.id !== memberId),
      });
    }
    const originalTeams = [...teams];
    setTeams(
      teams.map((team) =>
        team.id === teamId
          ? { ...team, members: team.members.filter((m) => m.id !== memberId) }
          : team
      )
    );

    try {
      const response = await axios.delete(`http://localhost:8000/api/teams/${teamId}/members/${memberId}/`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      if (teamDetails && teamDetails.id === teamId) {
        setTeamDetails(response.data);
      }
      setTeams(
        teams.map((team) => (team.id === teamId ? response.data : team))
      );
      toast.success(`Removed ${memberName} from team`);
    } catch (error) {
      console.error('Error removing member:', error.response?.data || error.message);
      if (originalTeamDetails && teamDetails && teamDetails.id === teamId) {
        setTeamDetails(originalTeamDetails);
      }
      setTeams(originalTeams);
      toast.error('Failed to remove member: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen w-full bg-neutral-900 text-neutral-50 p-4">
        {!user ? (
          <div className="flex justify-center items-center h-full">
            <p>Please sign in to continue</p>
          </div>
        ) : !selectedTeam ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold mt-11 mb-9 text-green-700">Your Teams</h1>
            {userRole === 'Project Manager' && (
              <button
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm mb-4"
              >
                <FiPlus /> Create New Team
              </button>
            )}
            {userRole === 'Project Manager' && showCreateTeam && (
              <form onSubmit={createTeam} className="mt-4 bg-neutral-800 p-4 rounded-lg shadow-lg w-full max-w-md">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full p-2 bg-neutral-700 rounded text-neutral-50 mb-2"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-3 py-1 text-neutral-400 hover:text-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-neutral-50 text-neutral-950 rounded"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
            <div className="mt-8 w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">
                {userRole === 'Project Manager' ? 'Team List' : 'Joined Teams'}
              </h2>
              {userRole === 'Project Manager' ? (
                !teamDetails ? (
                  <div className="bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-700">
                          <th className="px-4 py-2 text-left">Team Name</th>
                          <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.length > 0 ? (
                          teams.map((team) => (
                            <tr key={team.id} className="border-t border-neutral-700">
                              <td
                                className="px-4 py-2 text-violet-400 hover:text-violet-300 cursor-pointer"
                                onClick={() => setTeamDetails(team)}
                              >
                                {team.name}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => deleteTeam(team.id, team.name)}
                                  className="text-red-400 hover:text-red-300"
                                  title="Delete Team"
                                >
                                  <FiTrash size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              className="px-4 py-2 text-center text-neutral-400"
                              colSpan={2}
                            >
                              No teams available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-2">
                      <h3 className="text-lg font-bold">{teamDetails.name} Details</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const currentTeamId = teamDetails?.id;
                            if (!currentTeamId) {
                              toast.error('No team selected');
                              return;
                            }
                            console.log('Show Roadmap clicked, teamId:', currentTeamId);
                            setIsRoadmapOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
                        >
                          Show Roadmap
                        </button>
                        <button
                          onClick={() => setTeamDetails(null)}
                          className="px-3 py-1 text-neutral-400 hover:text-neutral-50 text-sm"
                        >
                          Back to Team List
                        </button>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-700">
                          <th className="px-4 py-2 text-left">Team Name</th>
                          <th className="px-4 py-2 text-left">Team Code</th>
                          <th className="px-4 py-2 text-left">Members</th>
                          {userRole === 'Project Manager' && (
                            <th className="px-4 py-2 text-left">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-neutral-700">
                          <td
                            className="px-4 py-2 text-violet-400 hover:text-violet-300 cursor-pointer"
                            onClick={() => setSelectedTeam(teamDetails)}
                          >
                            {teamDetails.name}
                          </td>
                          <td className="px-4 py-2 font-mono">{teamDetails.code}</td>
                          <td className="px-4 py-2">
                            {teamDetails.members && Array.isArray(teamDetails.members) && teamDetails.members.length > 0
                              ? teamDetails.members.map((member) => member.name).join(', ')
                              : 'No members'}
                          </td>
                          {userRole === 'Project Manager' && (
                            <td className="px-4 py-2">
                              {teamDetails.members && Array.isArray(teamDetails.members) && teamDetails.members.length > 0 ? (
                                teamDetails.members.map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={() => removeMember(teamDetails.id, member.id)}
                                    className="text-red-400 hover:text-red-300 mr-2"
                                    title={`Remove ${member.name}`}
                                  >
                                    <FiTrash size={16} />
                                  </button>
                                ))
                              ) : (
                                '-'
                              )}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="w-full max-w-md">
                  <form onSubmit={joinTeam} className="bg-neutral-800 p-4 rounded-lg shadow-lg mb-4">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter team code"
                      className="w-full p-2 bg-neutral-700 rounded text-neutral-50 mb-2"
                      autoFocus
                    />
                    {joinError && (
                      <p className="text-sm text-red-400 mb-2">{joinError}</p>
                    )}
                    {joinSuccess && (
                      <p className="text-sm text-green-400 mb-2">{joinSuccess}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1 bg-neutral-50 text-neutral-950 rounded"
                      >
                        Join Team
                      </button>
                    </div>
                  </form>
                  {teams.length > 0 && (
                    <div className="bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-700">
                            <th className="px-4 py-2 text-left">Joined Team</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((team) => (
                            <tr key={team.id} className="border-t border-neutral-700">
                              <td
                                className="px-4 py-2 text-violet-400 hover:text-violet-300 cursor-pointer"
                                onClick={() => setSelectedTeam(team)}
                              >
                                {team.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            {teamCode && (
              <div className="mt-4 bg-neutral-800 p-4 rounded-lg shadow-lg flex flex-col items-center w-full max-w-md">
                <p className="text-sm mb-2">Team created! Share this code with team members to join:</p>
                <p className="text-lg font-mono bg-neutral-700 px-3 py-1 rounded">{teamCode}</p>
                <button
                  onClick={() => setTeamCode(null)}
                  className="mt-2 px-3 py-1 text-neutral-400 hover:text-neutral-50 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="relative flex items-center justify-end mb-4 gap-2">
              <h1 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-green-600">
                {selectedTeam.name}
              </h1>
              <button
                onClick={() => setIsWorkDayTrackerOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-900 hover:text-blue-500 rounded-lg text-sm text-white"
              >
                WorkDay Tracker
              </button>
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setSelectedTeamId(null);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-900 hover:text-green-500 rounded-lg text-sm text-white"
              >
                Back to Teams
              </button>
            </div>
            <CustomKanban
              teamId={selectedTeam.id}
              members={selectedTeam.members || []}
              userRole={userRole}
              setIsGanttOpen={setIsGanttOpen}
              userProfileId={userProfileId}
            />
          </div>
        )}
        {isRoadmapOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
              <button
                onClick={() => {
                  console.log('Roadmap onClose called');
                  setIsRoadmapOpen(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50"
              >
                Close
              </button>
              <Roadmap
                isOpen={isRoadmapOpen}
                onClose={() => {
                  console.log('Roadmap onClose called');
                  setIsRoadmapOpen(false);
                }}
                teamId={teamDetails?.id}
                members={teamDetails?.members || []}
              />
            </div>
          </div>
        )}
        {isGanttOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
              <button
                onClick={() => {
                  console.log('GanttChart onClose called');
                  setIsGanttOpen(false);
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50"
              >
                Close
              </button>
              <GanttChart
                isOpen={isGanttOpen}
                onClose={() => {
                  console.log('GanttChart onClose called');
                  setIsGanttOpen(false);
                }}
                teamId={selectedTeam?.id || teamDetails?.id}
              />
            </div>
          </div>
        )}
        {isWorkDayTrackerOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
              <button
                onClick={() => setIsWorkDayTrackerOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50"
              >
                Close
              </button>
              <WorkDayTracker onClose={() => setIsWorkDayTrackerOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
};

const CustomKanban = ({ teamId, members, userRole, setIsGanttOpen, userProfileId }) => {
  return (
    <div className="h-screen w-full flex justify-center items-center bg-neutral-900 text-neutral-50 p-4">
      <Board teamId={teamId} members={members} userRole={userRole} setIsGanttOpen={setIsGanttOpen} userProfileId={userProfileId} />
    </div>
  );
};

const Board = ({ teamId, members, userRole, setIsGanttOpen, userProfileId }) => {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [isSprintBoardOpen, setIsSprintBoardOpen] = useState(false);
  const [isBurndownChartOpen, setIsBurndownChartOpen] = useState(false);
  const { setTasks } = useContext(DashboardContext);

  const fetchCards = useCallback(async (currentUser) => {
    if (!currentUser || !teamId) {
      setCards([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8000/api/cards/?team_id=${teamId}`, {
        headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
      });
      console.log('Fetched cards for teamId', teamId, ':', response.data);
      const updatedCards = response.data.map(card => ({
        ...card,
        progress: card.progress ?? 0,
      }));
      setCards(updatedCards);
      setTasks(updatedCards);
    } catch (error) {
      console.error('Error fetching cards:', error.response?.data || error.message);
      toast.error('Failed to load cards: ' + (error.response?.data?.detail || 'Unknown error'));
      setCards([]);
    }
  }, [teamId, setTasks]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && teamId) {
        fetchCards(currentUser);
      }
    });
    return () => unsubscribe();
  }, [teamId, fetchCards]);

  return (
    <div className="flex flex-col items-center justify-center w-full px-2 sm:px-4 md:px-6 lg:px-8 gap-4 flex-grow">
      <div className="w-full max-w-full overflow-x-auto pb-4">
        <div className="flex flex-nowrap md:flex-row justify-start md:justify-center w-full gap-2 md:gap-3 min-w-max">
          <Column
            title="Backlog"
            column="backlog"
            headingColor="text-neutral-500"
            cards={cards}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
          <Column
            title="TODO"
            column="todo"
            headingColor="text-yellow-200"
            cards={cards}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
          <Column
            title="In Progress"
            column="doing"
            headingColor="text-blue-200"
            cards={cards}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
          <Column
            title="Review"
            column="review"
            headingColor="text-purple-200"
            cards={cards}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
          <Column
            title="Done"
            column="done"
            headingColor="text-emerald-200"
            cards={cards}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
          {userRole === 'Project Manager' && (
            <BurnBarrel cards={cards} setCards={setCards} teamId={teamId} user={user} userRole={userRole} />
          )}
        </div>
      </div>
      <ChartDropdown
        teamId={teamId}
        setIsGanttOpen={setIsGanttOpen}
        setIsSprintBoardOpen={setIsSprintBoardOpen}
        setIsBurndownChartOpen={setIsBurndownChartOpen}
        toast={toast}
      />
      {isSprintBoardOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
            <button
              onClick={() => setIsSprintBoardOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50"
            >
              Close
            </button>
            <SprintBoardPage
              teamId={teamId}
              user={user}
              onClose={() => setIsSprintBoardOpen(false)}
            />
          </div>
        </div>
      )}
      {isBurndownChartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-lg shadow-lg p-6 w-full max-w-4xl relative">
            <button
              onClick={() => setIsBurndownChartOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-50"
            >
              Close
            </button>
            <BurndownChart />
          </div>
        </div>
      )}
    </div>
  );
};

const Column = ({ title, headingColor, cards, column, setCards, teamId, user, members, userRole, userProfileId }) => {
  const [active, setActive] = useState(false);

  const fetchCards = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/cards/?team_id=${teamId}`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      console.log('Re-fetched cards:', response.data);
      setCards(response.data.map(card => ({
        ...card,
        progress: card.progress ?? 0,
      })));
    } catch (error) {
      console.error('Error re-fetching cards:', error.response?.data || error.message);
      toast.error('Failed to sync cards: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDrop = async (e) => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can move tasks');
      setActive(false);
      return;
    }
    e.preventDefault();
    const cardId = String(e.dataTransfer.getData("cardId"));
    console.log(`Attempting to move card with ID: ${cardId}`);

    if (!cardId) {
      console.error('No cardId found in drag data');
      toast.error('Failed to move card: No card ID');
      setActive(false);
      return;
    }

    let originalCard = cards.find((card) => String(card.id) === cardId);
    if (!originalCard) {
      console.warn(`Card ${cardId} not found in state, attempting to re-fetch cards`);
      await fetchCards();
      originalCard = cards.find((card) => String(card.id) === cardId);
      if (!originalCard) {
        console.error('Card still not found after re-fetch:', cardId);
        toast.error('Failed to move card: Card not found');
        setActive(false);
        return;
      }
    }

    console.log(`Moving card ${cardId} to column ${column}`);
    setCards((prev) => {
      const newCards = [...prev];
      const cardIndex = newCards.findIndex((card) => String(card.id) === cardId);
      if (cardIndex !== -1) {
        newCards[cardIndex] = { ...newCards[cardIndex], column };
      } else {
        console.warn('Card index not found after re-fetch, adding card to state');
        newCards.push({ ...originalCard, column });
      }
      console.log('Updated cards state:', newCards);
      return newCards;
    });

    try {
      await axios.patch(
        `http://localhost:8000/api/cards/${cardId}/`,
        { column },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      toast.success('Task moved successfully');
    } catch (error) {
      console.error('Error updating card column:', error.response?.data || error.message);
      setCards((prev) => {
        const newCards = [...prev];
        const cardIndex = newCards.findIndex((card) => String(card.id) === cardId);
        if (cardIndex !== -1) {
          newCards[cardIndex] = { ...newCards[cardIndex], column: originalCard.column };
        }
        console.log('Reverted cards state:', newCards);
        return newCards;
      });
      toast.error('Failed to move card: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setActive(false);
  };

  const handleDragOver = (e) => {
    if (userRole !== 'Project Manager') return;
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => setActive(false);

  const filteredCards = cards.filter((c) => c.column === column);

  return (
    <div className="w-36 md:w-48 min-h-[200px] md:min-h-[250px] shrink-0 shadow-[0_10px_15px_3px_rgba(147,51,234,0.4)] rounded-lg mx-1">
      <div className="mb-2 flex items-center justify-between p-1">
        <h3 className={`text-xs md:text-sm font-medium ${headingColor}`}>{title}</h3>
        <span className="rounded text-xxs md:text-xs text-neutral-400">{filteredCards.length}</span>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`p-1 rounded transition-colors ${active ? "bg-neutral-800/50" : "bg-neutral-800"}`}
      >
        {filteredCards.map((c) => (
          <Card
            key={c.id}
            card={c}
            setCards={setCards}
            teamId={teamId}
            user={user}
            members={members}
            userRole={userRole}
            userProfileId={userProfileId}
          />
        ))}
        <AddCard
          column={column}
          setCards={setCards}
          teamId={teamId}
          user={user}
          userRole={userRole}
        />
      </div>
    </div>
  );
};

const Card = ({ card, setCards, teamId, user, members, userRole, userProfileId }) => {
  const { id, title, priority, assigned_to, deadline, progress = 0 } = card;
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [newPriority, setNewPriority] = useState(priority);
  const [newDeadline, setNewDeadline] = useState(deadline || '');
  const [newProgress, setNewProgress] = useState(progress);
  const [showMenu, setShowMenu] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { hasWorkdayStarted, setTasks } = useContext(DashboardContext);

  useEffect(() => {
    setTeamMembers(members && Array.isArray(members) ? [...members] : []);
    setIsLoadingMembers(false);
    console.log('Card - assigned_to:', assigned_to, 'userProfileId:', userProfileId, 'members:', members, 'userRole:', userRole);
  }, [members, user, userRole, userProfileId]);

  const priorityColors = {
    Low: "border-green-500 bg-green-500/20",
    Medium: "border-yellow-500 bg-yellow-500/20",
    High: "border-red-500 bg-red-500/20",
  };

  const updateProgress = _.debounce(async (value) => {
    console.log('hasWorkdayStarted:', hasWorkdayStarted);
    if (!hasWorkdayStarted) {
      toast.error('You must start your workday in WorkDay Tracker to update progress');
      return;
    }
    const isAssigned = String(assigned_to) === String(userProfileId);
    if (userRole !== 'Project Manager' && !isAssigned) {
      toast.error('Only Project Managers or assigned users can update progress');
      return;
    }
    const progressValue = parseInt(value);
    console.log('PATCH payload for progress update:', { progress: progressValue });
    try {
      await axios.patch(
        `http://localhost:8000/api/cards/${id}/`,
        { progress: progressValue },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, progress: progressValue } : c))
      );
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, progress: progressValue } : t))
      );
      toast.success('Progress updated successfully');
    } catch (error) {
      console.error('Error updating progress:', error.response?.data || error.message);
      toast.error('Failed to update progress: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  }, 500);

  const saveEdit = async () => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can edit tasks');
      return;
    }
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:8000/api/cards/${id}/`,
        {
          title: newTitle,
          priority: newPriority,
          deadline: newDeadline || null,
          progress: newProgress,
        },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, title: newTitle, priority: newPriority, deadline: newDeadline, progress: newProgress }
            : c
        )
      );
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === id
            ? { ...t, title: newTitle, priority: newPriority, deadline: newDeadline, progress: newProgress }
            : t
        )
      );
      setIsEditing(false);
      toast.success('Card updated successfully');
    } catch (error) {
      console.error('Error updating card:', error.response?.data || error.message);
      toast.error('Failed to update card: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleAssign = async (member) => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can assign tasks');
      return;
    }
    const assignedToValue = member.id;
    console.log('PATCH payload for assignment:', { assigned_to: assignedToValue });
    try {
      await axios.patch(
        `http://localhost:8000/api/cards/${id}/`,
        { assigned_to: assignedToValue },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, assigned_to: member.id } : c))
      );
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, assigned_to: member.id } : t))
      );
      setShowMenu(false);
      toast.success(`Assigned to ${member.name}`);
    } catch (error) {
      console.error('Error assigning card:', error.response?.data || error.message);
      toast.error('Failed to assign card: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleProgressChange = (e) => {
    if (!hasWorkdayStarted) {
      toast.error('You must start your workday in WorkDay Tracker to update progress');
      return;
    }
    const value = parseInt(e.target.value);
    setNewProgress(value);
    const isAssigned = String(assigned_to) === String(userProfileId);
    if (userRole === 'Project Manager' || (userRole === 'Team Member' && isAssigned)) {
      updateProgress(value);
    }
  };

  const toggleComplete = async () => {
    if (!hasWorkdayStarted) {
      toast.error('You must start your workday in WorkDay Tracker to mark tasks complete');
      return;
    }
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can mark tasks complete');
      return;
    }
    try {
      const newProgress = progress === 100 ? 0 : 100;
      await axios.patch(
        `http://localhost:8000/api/cards/${id}/`,
        { progress: newProgress },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, progress: newProgress } : c))
      );
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, progress: newProgress } : t))
      );
      setShowMenu(false);
      toast.success(newProgress === 100 ? 'Marked complete' : 'Marked incomplete');
    } catch (error) {
      console.error('Error toggling completion:', error.response?.data || error.message);
      toast.error('Failed to toggle completion: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const assignedMember = members.find((m) => String(m.id) === String(assigned_to));
  const assignedName = assignedMember ? assignedMember.name : 'Unassigned';

  return (
    <motion.div
      layout
      layoutId={id}
      draggable={userRole === 'Project Manager'}
      onDragStart={userRole === 'Project Manager' ? (e) => e.dataTransfer.setData('cardId', String(id)) : undefined}
      className={`cursor-${userRole === 'Project Manager' ? 'grab' : 'default'} p-2 rounded border text-xs ${priorityColors[priority]} text-neutral-100 mb-1.5 relative`}
    >
      {isEditing && userRole === 'Project Manager' ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            className="w-full p-1 bg-neutral-700 rounded text-neutral-50"
            placeholder="Enter task title"
          />
          <div className="flex items-center gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full p-1 text-xs bg-neutral-700 text-neutral-50 rounded"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div className="relative w-full">
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-1 text-xs bg-neutral-700 text-neutral-50 rounded"
              />
              <FiCalendar className="absolute right-2 top-1.5 text-neutral-400 pointer-events-none" size={14} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Progress:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={newProgress}
              onChange={handleProgressChange}
              className="flex-1 max-w-[60px] sm:max-w-none"
              disabled={!hasWorkdayStarted}
            />
            <span className="text-xs text-neutral-200 w-8 text-right">{newProgress}%</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-neutral-400 hover:text-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="text-xs bg-neutral-50 text-neutral-950 px-2 py-1 rounded"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="pr-4 break-words">{title}</p>
              {assigned_to && (
                <span className="text-xxs text-neutral-400 block mt-1">{assignedName}</span>
              )}
            </div>
            {userRole === 'Project Manager' && (
              <div className="flex items-center gap-1">
                <FiEdit
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer text-neutral-400 hover:text-neutral-100"
                  size={14}
                />
                <FiMoreVertical
                  onClick={() => setShowMenu(!showMenu)}
                  className="cursor-pointer text-neutral-400 hover:text-neutral-100"
                  size={14}
                />
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {deadline && (
              <div className="flex items-center gap-1 text-xxs text-neutral-400">
                <FiCalendar size={10} />
                <span>{formatDeadline(deadline)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-12 bg-neutral-700 rounded-full h-1.5 flex-shrink-0">
                <div
                  className={`h-1.5 rounded-full ${
                    progress < 30 ? 'bg-red-500' : progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xxs text-neutral-400">{progress}%</span>
            </div>
            {(userRole === 'Project Manager' || (userRole === 'Team Member' && String(assigned_to) === String(userProfileId))) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Update Progress:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={handleProgressChange}
                  className="flex-1 max-w-[60px] sm:max-w-none"
                  disabled={!hasWorkdayStarted}
                />
                <span className="text-xs text-neutral-200 w-8 text-right">{newProgress}%</span>
              </div>
            )}
          </div>
        </div>
      )}
      {showMenu && userRole === 'Project Manager' && (
        <div className="absolute right-0 top-6 bg-neutral-800 rounded shadow-lg p-2 z-10 min-w-[140px]">
          <div className="text-xs text-neutral-300 mb-1">Assign to:</div>
          {isLoadingMembers ? (
            <div className="text-xs px-2 py-1 text-neutral-400">Loading members...</div>
          ) : teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleAssign(member)}
                className={`text-xs px-3 py-1 hover:bg-neutral-700 rounded cursor-pointer ${
                  String(assigned_to) === String(member.id) ? 'bg-violet-900/50' : ''
                }`}
              >
                {member.name}
              </div>
            ))
          ) : (
            <div className="text-xs px-2 py-1 text-neutral-400">No team members available</div>
          )}
          <div className="border-t border-neutral-700 mt-1 pt-1">
            <div
              onClick={toggleComplete}
              className={`text-xs px-2 py-1 hover:bg-neutral-700 rounded cursor-pointer flex items-center gap-1 ${!hasWorkdayStarted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FiCheckCircle size={12} />
              {progress === 100 ? 'Unmark Complete' : 'Mark Complete'}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const AddCard = ({ column, setCards, teamId, user, userRole }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [adding, setAdding] = useState(false);
  const { setTasks } = useContext(DashboardContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can add tasks');
      return;
    }
    if (!text.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:8000/api/cards/',
        {
          team: teamId,
          column,
          title: text.trim(),
          priority,
          deadline: deadline || null,
          progress: column === 'done' ? 100 : 0,
        },
        { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }
      );
      setCards((prev) => [...prev, response.data]);
      setTasks((prevTasks) => [...prevTasks, response.data]);
      setAdding(false);
      setText('');
      setDeadline('');
      toast.success('Card created successfully');
    } catch (error) {
      console.error('Error creating card:', error.response?.data || error.message);
      toast.error('Failed to create card: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  if (userRole !== 'Project Manager') return null;

  return adding ? (
    <motion.form layout onSubmit={handleSubmit} className="mt-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        placeholder="Add new task..."
        className="w-full p-1 text-xs text-neutral-50 bg-neutral-700 border border-violet-400 rounded focus:outline-none"
      />
      <div className="mt-1 space-y-1">
        <div className="flex items-center gap-1">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="p-0.5 text-xs bg-neutral-800 text-neutral-50 border rounded flex-1"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <div className="relative flex-1">
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-0.5 text-xs bg-neutral-800 text-neutral-50 border rounded"
            />
            <FiCalendar className="absolute right-2 top-1 text-neutral-400 pointer-events-none" size={12} />
          </div>
        </div>
        <div className="flex gap-0.5 justify-end">
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-neutral-400 hover:text-neutral-50 px-1.5 py-0.5 text-xxs"
          >
            Close
          </button>
          <button type="submit" className="bg-neutral-50 text-neutral-950 px-1.5 py-0.5 text-xxs rounded">
            Add
          </button>
        </div>
      </div>
    </motion.form>
  ) : (
    <button
      onClick={() => setAdding(true)}
      className="w-full p-1 text-xxs text-neutral-400 hover:text-neutral-50 transition-colors"
    >
      + Add card
    </button>
  );
};

const BurnBarrel = ({ cards, setCards, teamId, user, userRole }) => {
  const { setTasks } = useContext(DashboardContext);

  const handleDrop = async (e) => {
    if (userRole !== 'Project Manager') {
      toast.error('Only Project Managers can delete tasks');
      return;
    }
    e.preventDefault();
    const cardId = String(e.dataTransfer.getData('cardId'));
    console.log(`Attempting to delete card with ID: ${cardId}`);

    if (!cardId) {
      console.error('No cardId provided for deletion');
      toast.error('Failed to delete card: No card ID');
      return;
    }

    const cardToDelete = cards.find((c) => String(c.id) === cardId);
    if (!cardToDelete) {
      console.error('Card not found for deletion:', cardId);
      toast.error('Failed to delete card: Card not found');
      return;
    }

    setCards((prev) => {
      const newCards = prev.filter((c) => String(c.id) !== cardId);
      console.log('Updated cards state after deletion:', newCards);
      return newCards;
    });
    setTasks((prevTasks) => prevTasks.filter((t) => String(t.id) !== cardId));

    try {
      await axios.delete(`http://localhost:8000/api/cards/${cardId}/`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      toast.success('Card deleted successfully');
    } catch (error) {
      console.error('Error deleting card:', error.response?.data || error.message);
      setCards((prev) => {
        const newCards = [...prev, cardToDelete];
        console.log('Reverted cards state after deletion failure:', newCards);
        return newCards;
      });
      setTasks((prevTasks) => [...prevTasks, cardToDelete]);
      toast.error('Failed to delete card: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="fixed bottom-4 right-4 md:bottom-5 md:right-5 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-neutral-500 border border-neutral-500 rounded-full bg-neutral-800 hover:bg-red-600 hover:text-white transition-all shadow-lg cursor-pointer"
    >
      <FiTrash className="text-md md:text-xl" />
    </div>
  );
};

export default Dashboard;