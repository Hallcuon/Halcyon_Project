import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import useLenis from '../hooks/useLenis'; // Імпортуємо наш новий хук

const Auth = ({ setAuthTokens }) => {
  useLenis(); // Активуємо плавний скрол для цієї сторінки

  useEffect(() => {
    // Запам'ятовуємо тему, яка була до відкриття сторінки входу
    const originalTheme = document.documentElement.className;
    // Примусово вмикаємо темну тему для сторінки входу
    document.documentElement.className = 'dark';

    // Функція очищення, яка виконається, коли компонент буде розмонтовано (після логіну)
    return () => {
      // Повертаємо оригінальну тему, щоб основний додаток мав правильний вигляд
      document.documentElement.className = originalTheme;
    };
  }, []); // Пустий масив залежностей означає, що ефект виконається один раз при монтуванні

  const [isLogin, setIsLogin] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError("Username and password cannot be empty.");
      return;
    }

    // --- Валідація на фронтенді перед відправкою запиту на реєстрацію ---
    if (!isLogin) {
      // Перевіряємо наявність будь-яких символів, окрім літер, цифр, _ та -
      const forbiddenChars = /[^a-zA-Z0-9_-]/;
      if (forbiddenChars.test(username)) {
        setError('Username can only contain letters, numbers, hyphens (-), and underscores (_).');
        return;
      }
    }

    if (isLogin) {
      try {
        const response = await axiosInstance.post('/token/', { username, password });
        setAuthTokens(response.data);
        localStorage.setItem('authTokens', JSON.stringify(response.data));
      } catch (err) {
        setError('Invalid credentials. Please try again.');
        console.error('Login error:', err);
      }
    } else {
      try {
        await axiosInstance.post('/users/', { username, password });
        // After successful registration, log the user in
        const response = await axiosInstance.post('/token/', { username, password });
        setAuthTokens(response.data);
        localStorage.setItem('authTokens', JSON.stringify(response.data));
      } catch (err) {
        const errorData = err.response?.data;
        if (errorData && errorData.username) {
          setError(`Registration failed: ${errorData.username[0]}`);
        } else {
          setError('Registration failed. Please try another username.');
        }
        console.error('Registration error:', err);
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* --- ФОНОВЕ ВІДЕО (активне за замовчуванням) --- */}
        {/* Щоб використати статичне зображення, закоментуйте цей блок <video>... */}
        <video autoPlay loop muted playsInline className="auth-background-video">
          <source src="/xx.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* --- ФОНОВЕ ЗОБРАЖЕННЯ (закоментоване) --- */}
        {/* ...і розкоментуйте тег <img> нижче. */}
        {/* Я додав необхідні стилі в Auth.css, тому все буде працювати. */}
        {/* <img src="/main.jpg" alt="Background" className="auth-background-image" /> */}
        <img src="/Logo.png" alt="Map Project Logo" className="auth-logo" />
        <div className="auth-form-container">

          <div className="auth-tabs">
            <button onClick={() => { setIsLogin(true); setError(''); }} className={isLogin ? 'active' : ''}>Login</button>
            <button onClick={() => { setIsLogin(false); setError(''); }} className={!isLogin ? 'active' : ''}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            {error && <p className="auth-error">{error}</p>}
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
            {!isLogin && (
              <div className="terms-agreement">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  I have read and agree to the <span className="terms-link" onClick={() => setIsTermsModalOpen(true)}>Terms of Service</span>.
                </label>
              </div>
            )}
            <button type="submit" className="auth-submit-btn" disabled={!isLogin && !agreedToTerms}>
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
      <div className="info-section">
        <h2 className="info-section-title">What is Halcyon's Project❓</h2>
        <div className="info-card">
          <h3>🌍 About the Project 🌍</h3>
          <p>This is an interactive map platform designed for community exploration and engagement. Discover hidden gems, share your findings, and connect with fellow explorers.</p>
        </div>
        <div className="info-card">
          <h3>🔭 What should i do? 🔭</h3>
          <p>To be social. Search. Be the first. Connect with people from all over the world. Adon't forget to check GUIDE first!</p>
        </div>
        <div className="info-card">
          <h3>🎯 The Mission 🎯</h3>
          <p>To create a dynamic and user-driven map that evolves with its community, fostering a spirit of discovery and shared experience in real time.</p>
        </div>
      </div>
      <footer className="auth-footer">
        © 2025 Halcyon
      </footer>

      {isTermsModalOpen && (
        <div className="terms-modal-overlay" onClick={() => setIsTermsModalOpen(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="terms-modal-close" onClick={() => setIsTermsModalOpen(false)}>×</button>
            <h2>Terms of Service</h2>
            <p>By registering for an account, you agree to these terms. Please read them carefully.</p>
            <p><strong>1. User Conduct:</strong> You agree not to use the service for any unlawful purpose or to harass, abuse, or harm another person.</p>
            <p><strong>2. Content:</strong> You are responsible for the content you post. We reserve the right to remove any content that violates our policies.</p>
            <p><strong>3. Disclaimer:</strong> This service is provided "as is" without any warranties. We are not liable for any damages arising from your use of the service.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
