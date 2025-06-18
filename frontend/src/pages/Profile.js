import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUserEdit,
  FaSave,
  FaPowerOff,
  FaCamera,
  FaShareAlt,
  FaEye,
  FaSpinner,
  FaClock
} from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { ProfileService } from '../services/profileService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Constants for roles and positions
const ROLES = {
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member'
};

const POSITIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Database Engineer',
  'QA Tester',
  'Mobile App Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'UI/UX Designer',
  'Business Analyst',
  'Cloud Engineer'
];

const UserProfile = () => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState({
    profile: false,
    saving: false,
    deactivating: false
  });
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    name: "",
    position: "",
    role: ROLES.TEAM_MEMBER,
    profilePic: null
  });
  const [loginDuration, setLoginDuration] = useState(0);

  const [authUser] = useAuthState(auth);

  // Fetch profile data on auth change
  useEffect(() => {
    const fetchProfile = async () => {
      if (authUser) {
        setLoading(prev => ({ ...prev, profile: true }));
        setError(null);
        
        try {
          const idToken = await authUser.getIdToken();
          const profileData = await ProfileService.getProfile(idToken);
          
          setUser({
            name: profileData.name || "",
            position: profileData.position || "",
            role: profileData.role || ROLES.TEAM_MEMBER,
            profilePic: profileData.profile_pic || null
          });

          // Initialize login duration
          const storedLoginStart = localStorage.getItem('loginStartTime');
          if (storedLoginStart) {
            const startTime = parseInt(storedLoginStart, 10);
            const currentDuration = Math.floor((Date.now() - startTime) / 1000);
            setLoginDuration(currentDuration);
          } else {
            localStorage.setItem('loginStartTime', Date.now().toString());
          }
        } catch (err) {
          setError(err.message);
          toast.error(`Failed to load profile: ${err.message}`);
        } finally {
          setLoading(prev => ({ ...prev, profile: false }));
        }
      }
    };

    fetchProfile();

    return () => {
      // Clean up interval when component unmounts
      if (!authUser) {
        localStorage.removeItem('loginStartTime');
      }
    };
  }, [authUser]);

  // Timer effect
  useEffect(() => {
    let interval;
  
    if (authUser) {
      // Ensure loginStartTime exists
      if (!localStorage.getItem('loginStartTime')) {
        localStorage.setItem('loginStartTime', Date.now().toString());
      }
  
      // Start the timer
      const updateTimer = () => {
        const storedLoginStart = localStorage.getItem('loginStartTime');
        if (storedLoginStart) {
          const startTime = parseInt(storedLoginStart, 10);
          const currentDuration = Math.floor((Date.now() - startTime) / 1000);
          setLoginDuration(currentDuration);
        }
      };
  
      updateTimer(); // Immediate call
      interval = setInterval(updateTimer, 1000);
    }
  
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authUser]);
  

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = () => setIsEditing(true);
  const toggleSummary = () => setShowSummary(!showSummary);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setUser(prev => ({
      ...prev,
      role: newRole,
      position: newRole === ROLES.PROJECT_MANAGER ? "" : prev.position
    }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    setError(null);

    try {
      const idToken = await authUser.getIdToken();
      console.log('Current user state:', user);

      const profileData = {
        name: user.name?.trim(),
        position: user.position,
        role: user.role,
        profile_pic_data: user.profilePic?.startsWith('data:image') ? user.profilePic : null
      };

      console.log('Sending profile data:', profileData);

      const updatedProfile = await ProfileService.updateProfile(profileData, idToken);
      console.log('Received updated profile:', updatedProfile);

      // Update local state with the saved data
      setUser({
        name: updatedProfile.name || '',
        position: updatedProfile.position || '',
        role: updatedProfile.role || ROLES.TEAM_MEMBER,
        profilePic: updatedProfile.profile_pic || null
      });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
      toast.error(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm("Are you sure you want to deactivate your account? This cannot be undone.")) {
      setLoading(prev => ({ ...prev, deactivating: true }));
      
      try {
        const idToken = await authUser.getIdToken();
        await ProfileService.deactivateAccount(idToken);
        localStorage.removeItem('loginStartTime');
        toast.success('Account deactivated successfully');
      } catch (err) {
        toast.error(`Failed to deactivate account: ${err.message}`);
      } finally {
        setLoading(prev => ({ ...prev, deactivating: false }));
      }
    }
  };

  const handleShareProfile = () => {
    const profileLink = `${window.location.origin}/profile/${authUser?.uid}`;
    navigator.clipboard.writeText(profileLink)
      .then(() => toast.info('Profile link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy profile link'));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <motion.section
        className="flex justify-center items-center min-h-screen bg-[#121212] p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-3xl p-6 bg-[#1e1e2e] text-white rounded-xl shadow-lg">
          {loading.profile && (
            <div className="text-center py-4">
              <FaSpinner className="animate-spin inline-block mr-2" />
              Loading profile...
            </div>
          )}

          {!loading.profile && (
            <>
              <div className="flex justify-center mb-6 relative">
                <label htmlFor="profilePic" className="relative cursor-pointer group">
                  <div className="w-48 h-48 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{getInitials(user.name)}</span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute bottom-1 right-1 bg-gray-800 p-2 rounded-full group-hover:bg-gray-600 transition-colors">
                      <FaCamera className="text-[#00df9a]" size={16} />
                    </div>
                  )}
                </label>
                {isEditing && (
                  <input
                    type="file"
                    id="profilePic"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full p-2 rounded bg-gray-800 text-white disabled:bg-gray-700 disabled:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Position:</label>
                  <select
                    name="position"
                    value={user.position}
                    onChange={handleInputChange}
                    disabled={!isEditing || user.role === ROLES.PROJECT_MANAGER}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    <option value="">Select position</option>
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Role:</label>
                  <select
                    name="role"
                    value={user.role}
                    onChange={handleRoleChange}
                    disabled={!isEditing}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    {Object.values(ROLES).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Email:</label>
                  <input
                    type="email"
                    value={authUser?.email || ''}
                    disabled
                    className="w-full p-2 rounded bg-gray-700 text-gray-400"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="text-blue-400" />
                  <span>Login duration: {formatTime(loginDuration)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900 text-red-100 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    disabled={loading.saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                      loading.saving ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {loading.saving ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaSave />
                    )}
                    {loading.saving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    <FaUserEdit /> Edit Profile
                  </button>
                )}

                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                >
                  <FaShareAlt /> Share Profile
                </button>

                <button
                  onClick={handleDeactivate}
                  disabled={loading.deactivating}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                    loading.deactivating ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading.deactivating ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaPowerOff />
                  )}
                  {loading.deactivating ? 'Processing...' : 'Deactivate'}
                </button>
              </div>

              <button
                onClick={toggleSummary}
                className="w-full mt-6 p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <FaEye /> {showSummary ? 'Hide Summary' : 'Show Summary'}
                </div>
              </button>

              {showSummary && (
                <motion.div
                  className="mt-4 p-4 bg-gray-800 rounded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-semibold text-lg mb-2">Profile Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium">Name:</p>
                      <p>{user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Position:</p>
                      <p>{user.position || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Role:</p>
                      <p>{user.role}</p>
                    </div>
                    <div>
                      <p className="font-medium">Email:</p>
                      <p>{authUser?.email || 'Not available'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Login Duration:</p>
                      <p>{formatTime(loginDuration)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.section>
    </>
  );
};

export default UserProfile;
