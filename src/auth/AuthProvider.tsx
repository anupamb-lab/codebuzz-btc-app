import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSession, saveSession, clearSession, getUser, logoutApi } from './auth';

type AuthContextType = {
  authenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (token: string, user: object) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const token = await getSession();
      const userData = await getUser();
      setAuthenticated(!!token);
      setUser(userData);
      setLoading(false);
    };
    checkSession();
  }, []);

  const login = async (token: string, user: object) => {
    await saveSession(token, user);
    setAuthenticated(true);
    setUser(user);
  };

    const logout = async () => {
    try {
        await logoutApi();
    } catch (error) {
        console.warn('Server logout failed, clearing session anyway.');
    } finally {
        await clearSession();
        setAuthenticated(false);
        setUser(null);
    }
    };

  return (
    <AuthContext.Provider value={{ authenticated, loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
