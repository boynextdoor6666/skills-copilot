import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    return (storedToken === 'null' || storedToken === 'undefined') ? null : storedToken;
  });

  // Axios interceptor для добавления токена ко всем запросам
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Проверка токена при загрузке
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        usernameOrEmail: username,
        password
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      const serverData = error.response?.data;
      let msg = 'Ошибка входа';
      if (serverData) {
        if (typeof serverData === 'string') msg = serverData;
        else if (serverData.message) msg = Array.isArray(serverData.message) ? serverData.message.join(', ') : serverData.message;
        else if (serverData.error) msg = serverData.error;
        else msg = JSON.stringify(serverData);
      }
      return {
        success: false,
        message: msg,
      };
    }
  };

  const register = async (username, email, password, role = 'USER') => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        role
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      return { success: true };
    } catch (error) {
      const serverData = error.response?.data;
      let msg = 'Ошибка регистрации';
      if (serverData) {
        if (typeof serverData === 'string') msg = serverData;
        else if (serverData.message) msg = Array.isArray(serverData.message) ? serverData.message.join(', ') : serverData.message;
        else if (serverData.error) msg = serverData.error;
        else msg = JSON.stringify(serverData);
      }
      return {
        success: false,
        message: msg,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
