import { useState, useEffect, useCallback } from 'react';
import { User } from '@workspace/api-client-react';
import { useLocation } from 'wouter';

export function useAuth() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('propertylo_token');
      const storedUser = localStorage.getItem('propertylo_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse user from local storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAuth = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('propertylo_token', newToken);
    localStorage.setItem('propertylo_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('propertylo_token');
    localStorage.removeItem('propertylo_user');
    setToken(null);
    setUser(null);
    setLocation('/signin');
  }, [setLocation]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isLoading,
    saveAuth,
    signOut,
  };
}
