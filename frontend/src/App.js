import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return showSignup ? (
      <Signup
        onLogin={handleLogin}
        switchToLogin={() => setShowSignup(false)}
      />
    ) : (
      <Login
        onLogin={handleLogin}
        switchToSignup={() => setShowSignup(true)}
      />
    );
  }

  return <Chat user={user} onLogout={handleLogout} />;
}

export default App;