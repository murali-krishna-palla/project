import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthService from './services/authAPI';
import { AppProvider } from './context/AppContext';
import './App.css';

// Validate MongoDB ObjectId format (24 hex characters)
function isValidMongoId(id) {
  return /^[0-9a-f]{24}$/.test(id?.toLowerCase() || '');
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Validate that stored userId is in correct format (MongoDB ObjectId)
        const storedUserId = AuthService.getUserId();
        if (storedUserId && !isValidMongoId(storedUserId)) {
          console.warn('Invalid userId format detected, clearing stored data');
          AuthService.logout();
        }

        // Validate token with server
        const isValid = await AuthService.validateToken();
        if (isValid) {
          const userId = AuthService.getUserId();
          if (userId && isValidMongoId(userId)) {
            setUserId(userId);
            setIsAuthenticated(true);
          } else {
            AuthService.logout();
            setIsAuthenticated(false);
            setUserId(null);
          }
        } else {
          AuthService.logout();
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthService.logout();
        setIsAuthenticated(false);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    const storedUserId = AuthService.getUserId();
    setUserId(storedUserId);
    setIsAuthenticated(true);
  };

  // Memoize logout handler so it doesn't change on every render
  // This prevents AppProvider from receiving a new function reference
  const handleLogout = useCallback(() => {
    console.log('🚪 App.js: handleLogout called');
    console.log('  Before logout - isAuthenticated:', isAuthenticated, 'userId:', userId);
    AuthService.logout();
    setIsAuthenticated(false);
    setUserId(null);
    console.log('  After logout - state updated');
  }, [isAuthenticated, userId]);

  if (loading) {
    return (
      <div className="App loading">
        <div className="spinner">Loading VocalFlow...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated && userId ? (
        <AppProvider userId={userId} onLogout={handleLogout}>
          <HomePage onLogout={handleLogout} />
        </AppProvider>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
