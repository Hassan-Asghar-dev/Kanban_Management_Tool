import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    };

    getToken();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, authToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);