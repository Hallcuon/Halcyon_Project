import { useCallback } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * Кастомний хук, що інкапсулює логіку для роботи з анонімними повідомленнями ("літачками").
 * @param {Function} setAnonymousMessages - Функція для оновлення стану списку повідомлень.
 * @returns {{sendMessage: Function, findMessage: Function}} - Об'єкт з функціями для відправки та знахідки повідомлень.
 */
const useAnonymousMessageActions = (setAnonymousMessages) => {
  /**
   * Відправляє нове анонімне повідомлення на сервер.
   * @param {object} messageData - Дані повідомлення ({ title, body }).
   * @param {Function} [onSuccess] - Колбек, що викликається при успішній відправці.
   * @param {Function} [onError] - Колбек, що викликається при помилці.
   */
  const sendMessage = useCallback((messageData, onSuccess, onError) => {
    axiosInstance.post(API_ENDPOINTS.ANONYMOUS_MESSAGES, messageData)
      .then(response => {
        if (onSuccess) onSuccess(response.data);
      })
      .catch(error => {
        console.error("Error sending message:", error.response?.data || error.message);
        if (onError) onError(error);
        else toast.error("Could not send the message.");
      });
  }, []); // Залежностей немає, оскільки функція не використовує зовнішні стани

  /**
   * Повідомляє сервер про знахідку анонімного повідомлення.
   * @param {number} messageId - ID знайденого повідомлення.
   * @returns {Promise} - Повертає promise, щоб компонент, що викликає, міг обробити результат.
   */
  const findMessage = useCallback((messageId) => {
    return axiosInstance.post(`${API_ENDPOINTS.ANONYMOUS_MESSAGES}${messageId}/found/`)
      .then((response) => {
        setAnonymousMessages(currentMessages => currentMessages.filter(m => m.id !== messageId));
        return response.data;
      });
  }, [setAnonymousMessages]);

  return { sendMessage, findMessage };
};

export default useAnonymousMessageActions;