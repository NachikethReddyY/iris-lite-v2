import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState } from '@/services/authService';

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  markAuthenticated: (sessionExpiry?: number | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    sessionExpiry: null,
  });

  const checkAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionExpiry: null,
      });
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionExpiry: null,
      });
    }
  };

  const markAuthenticated = (sessionExpiry?: number | null) => {
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user', name: 'Authenticated User' },
      sessionExpiry: sessionExpiry ?? null,
    });
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        sessionExpiry: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, sessionExpiry: null, user: null }));
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    logout,
    checkAuth,
    markAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
