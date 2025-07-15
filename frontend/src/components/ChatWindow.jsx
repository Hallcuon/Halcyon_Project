import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import axiosInstance from '../utils/axiosInstance';

const ChatWindow = ({ isOpen, onClose, theme }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      // Завантажуємо історію повідомлень
      axiosInstance.get('/chat/messages/')
        .then(response => {
          setMessages(response.data.results.reverse());
        })
        .catch(error => console.error('Error fetching chat history:', error));

      // Підключаємо WebSocket
      const authTokens = JSON.parse(localStorage.getItem('authTokens'));
      if (!authTokens?.access) {
        console.error("No auth token found for WebSocket connection.");
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Використовуємо `window.location.host`, щоб підключатися до того ж хосту, що й сторінка (адреса ngrok)
      // Порт вказувати не потрібно, оскільки проксі-сервер обробить це.
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat/?token=${authTokens.access}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => console.log('WebSocket connected');
      ws.current.onclose = () => console.log('WebSocket disconnected');
      ws.current.onerror = (error) => console.error('WebSocket error:', error);

      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages(prevMessages => [...prevMessages, data]);
      };

      return () => {
        if (ws.current) ws.current.close();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 'message': inputValue }));
      setInputValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>Global Chat</h3>
        <button onClick={onClose} className="chat-close-btn">×</button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const currentAuthor = msg.author || msg.author_username;

          let authorColor = msg.author_chat_color || '#FFFFFF'; // Отримуємо колір або стандартний білий

          // Перевіряємо, чи колір стандартний (білий)
          const isDefaultColor = authorColor.toLowerCase() === '#ffffff' || authorColor.toLowerCase() === 'white';
          // Робимо нік темним тільки у світлій темі
          if (isDefaultColor && theme === 'light') {
            authorColor = '#333333';
          }

          // Видаляємо домен з URL аватара, щоб проксі Vite міг його обробити.
          // Це робить URL відносним (напр. /media/avatars/image.jpg) і працює для будь-якого домену.
          const avatarUrl = msg.avatar_url ? msg.avatar_url : '/DefaultProfile.png';
          const prevAuthor = prevMsg ? (prevMsg.author || prevMsg.author_username) : null;

          // Групуємо, якщо той самий автор написав повідомлення протягом останніх 5 хвилин
          const timeDiff = prevMsg ? (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) / (1000 * 60) : Infinity;
          const isGrouped = currentAuthor === prevAuthor && timeDiff < 5;

          return (
            <div key={msg.id || index} className={`chat-message ${isGrouped ? 'grouped' : ''}`}>
              {!isGrouped && (
                <img src={avatarUrl} alt={currentAuthor} className="chat-avatar" />
              )}
              <div className="message-content">
                {!isGrouped && (
                  <div className="message-header">
                    <span className="message-author" style={{ color: authorColor }}>{currentAuthor}</span>
                    <span className="message-timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                )}
                <div className="message-text">{msg.message || msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;