const API_BASE_URL = 'http://localhost:8000/api';

async function getAuthHeaders(token) {
  if (!token) {
    throw new Error('No authentication token available');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const ProfileService = {
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/me/`, {
        method: 'GET',
        headers: await getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch profile: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData, token) => {
    try {
      console.log('Updating profile with data:', profileData);

      // Prepare the data to send
      const dataToSend = {
        name: profileData.name?.trim() || '',
        role: profileData.role || 'Team Member',
        position: profileData.role === 'Project Manager' ? '' : (profileData.position || '')
      };

      // Add profile picture if it exists
      if (profileData.profile_pic_data) {
        dataToSend.profile_pic_data = profileData.profile_pic_data;
      }

      console.log('Sending profile data:', dataToSend);

      const response = await fetch(`${API_BASE_URL}/profile/me/`, {
        method: 'PUT',
        headers: await getAuthHeaders(token),
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();
      console.log('Profile update response:', responseData);
      
      if (!response.ok) {
        console.error('Profile update failed:', responseData);
        throw new Error(responseData.detail || `Failed to update profile: ${response.status}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  deactivateAccount: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/deactivate/`, {
        method: 'POST',
        headers: await getAuthHeaders(token),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to deactivate account: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Account deactivation error:', error);
      throw error;
    }
  },
};
