import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import ImageWithFallback from './ImageWithFallback'; // Імпортуємо наш новий компонент
import './OnlineIndicator.css';

const OnlineIndicator = ({ onAuthError, theme }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]); // New state for users

  useEffect(() => {
    const fetchOnlineCount = () => {
      axiosInstance.get('/online-users/')
        .then(response => {
          setOnlineCount(response.data.online_count);
          setOnlineUsers(response.data.users); // Set the users list
        })
        .catch(error => {
          console.error("Error fetching online users count:", error);
          if (error.response && error.response.status === 401) {
            onAuthError();
          }
        });
    };

    fetchOnlineCount(); // Завантажуємо одразу
    const intervalId = setInterval(fetchOnlineCount, 30000); // Оновлюємо кожні 30 секунд

    return () => clearInterval(intervalId); // Прибираємо інтервал при розмонтуванні
  }, [onAuthError]);

  return (
    <div className="online-indicator-container">
      <div className="online-indicator">
        <span className="online-dot"></span>
        Online: {onlineCount}
      </div>
      <div className="online-tooltip">
        <div className="tooltip-header">Online Users</div>
        {onlineUsers.length > 0 ? (
          <ul>
            {onlineUsers.map(user => {
              // Використовуємо ту саму логіку, що і в чаті/коментарях
              let userColor = user.chat_color || '#FFFFFF';
              const isDefaultColor = userColor.toLowerCase() === '#ffffff' || userColor.toLowerCase() === 'white';
              if (isDefaultColor && theme === 'light') {
                userColor = '#333333';
              }

              // Створюємо повний, правильний URL до аватара
              let avatarUrl;
              if (user.avatar_url) {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                if (user.avatar_url.startsWith('http')) {
                  // Замінюємо внутрішній хост на публічний, якщо він є
                  avatarUrl = user.avatar_url.replace('http://backend:8000', API_BASE_URL);
                } else {
                  // Додаємо базу до відносного шляху
                  avatarUrl = `${API_BASE_URL}${user.avatar_url}`;
                }
              } else {
                avatarUrl = '/DefaultProfile.png';
              }

              return (
                <li key={user.username}>
                  <ImageWithFallback 
                    src={avatarUrl} 
                    fallbackSrc="/DefaultProfile.png"
                    alt={user.username} 
                    className="tooltip-avatar" 
                  />
                  <span style={{ color: userColor }}>{user.username}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="tooltip-empty">No users online.</p>
        )}
      </div>
    </div>
  );
};

export default OnlineIndicator;