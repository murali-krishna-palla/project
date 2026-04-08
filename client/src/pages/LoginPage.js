import React, { useState } from 'react';
import AuthService from '../services/authAPI';
import '../styles/Login.css';

/**
 * Login/Register Page Component
 */
const LoginPage = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await AuthService.register(email, password, firstName, lastName);
      } else {
        await AuthService.login(email, password);
      }

      // Trigger callback
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>VocalFlow</h1>
          <p className="subtitle">Voice-to-Text Transcription</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isRegistering ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          {isRegistering && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name (Optional)</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name (Optional)</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
              disabled={loading}
            />
            {isRegistering && (
              <small>Password must be at least 6 characters</small>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>

          <div className="auth-switch">
            <p>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                className="switch-button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                disabled={loading}
              >
                {isRegistering ? 'Sign In' : 'Register'}
              </button>
            </p>
          </div>
        </form>

        <div className="login-footer">
          <p className="info">
            🔒 Your API keys are encrypted and stored securely
          </p>
          <p className="info">
            🎤 VocalFlow - Transform your voice into text
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
