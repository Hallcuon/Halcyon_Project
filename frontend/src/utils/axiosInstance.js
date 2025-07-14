import axios from 'axios';

// The base URL is now relative. When running in Docker, the Vite dev server
// will proxy requests starting with /api to the backend service.
// For local development, it will also be proxied correctly.
const baseURL = '/api';

const axiosInstance = axios.create({
    baseURL: baseURL,
});

// Додаємо перехоплювач для включення токена в кожен запит
axiosInstance.interceptors.request.use(
    config => {
        const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;
        if (authTokens?.access) {
            config.headers['Authorization'] = `Bearer ${authTokens.access}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Додаємо перехоплювач для обробки оновлення токена при помилках 401
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Уникаємо циклів оновлення токена: якщо помилка на шляху /token/refresh/, не повторюємо
        if (error.response.status === 401 && originalRequest.url === `${baseURL}/token/refresh/`) {
            return Promise.reject(error);
        }

        // Перевіряємо, чи помилка 401 і це не повторний запит
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const authTokens = localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null;

            if (authTokens?.refresh) {
                try {
                    const response = await axios.post(`${baseURL}/token/refresh/`, { refresh: authTokens.refresh });
                    localStorage.setItem('authTokens', JSON.stringify(response.data));
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    console.error("Оновлення токена не вдалося, вихід із системи.", refreshError);
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;