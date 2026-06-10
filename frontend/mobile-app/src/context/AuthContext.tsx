import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Storage from '../utils/storage';
import api from '../services/api';

type User = {
  id?: string;
  userId?: string;
  email: string;
  role: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (res.data && res.data.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        console.log('Not authenticated');
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (userData: User, token?: string) => {
    if (token) {
      await Storage.setItemAsync('accessToken', token);
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.log('Error logging out on backend', e);
    }
    await Storage.deleteItemAsync('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
