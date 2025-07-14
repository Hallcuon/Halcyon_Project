import React, { useEffect, useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './components/Auth.css'; // Імпортуємо стилі для сторінки входу тут
import axiosInstance from './utils/axiosInstance';
import Auth from './components/Auth'; // Імпортуємо новий компонент
import MapComponent from './components/MapComponent'; // Імпортуємо новий компонент
import ShareMessageModal from './components/ShareMessageModal';
import ProfileXPBar from './components/ProfileXPBar'; // Імпортуємо новий компонент
import PlacemarkSidebar from './components/PlacemarkSidebar'; // Імпортуємо бічну панель
import ProfileModal from './components/ProfileModal'; // Імпортуємо модалку профілю
import OnlineIndicator from './components/OnlineIndicator'; // Імпортуємо показник онлайну
import ChatWindow from './components/ChatWindow'; // Імпортуємо чат
import CommunityModal from './components/CommunityModal'; // Імпортуємо модалку спільноти
import { API_ENDPOINTS } from './api/endpoints';
import useUserStats from './hooks/useUserStats'; // Імпортуємо хук для статистики
import useAnonymousMessageActions from './hooks/useAnonymousMessageActions'; // Імпортуємо хук для "літачків"
import useUIState from './hooks/useUIState'; // Імпортуємо хук для стану UI

// Ключ завантажується зі змінних оточення (.env.local)
import useMapData from './hooks/useMapData'; // Імпортуємо новий хук
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const {
    theme,
    mapTypeId,
    showLabels,
    selectedPlacemark,
    isProfileModalOpen,
    isShareModalOpen,
    isChatOpen,
    isCommunityModalOpen,
    toggleTheme,
    toggleLabels,
    toggleMapType,
    handleOpenComments,
    handleCloseSidebar,
    setIsProfileModalOpen,
    setIsShareModalOpen,
    setIsChatOpen,
    setIsCommunityModalOpen,
  } = useUIState();

  // --- Стани для аутентифікації ---
  const [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const handleLogout = useCallback(() => {
    setAuthTokens(null);
    localStorage.removeItem('authTokens');
    // Немає потреби скидати дані тут. Коли authTokens стане null,
    // основний компонент розмонтується, і його стан зникне.
  }, []);

  const { 
    placemarks, setPlacemarks, 
    beacons, setBeacons, 
    otherPlacemarks, setOtherPlacemarks,
    anonymousMessages, setAnonymousMessages,
    loading: dataLoading, 
    error: dataError 
  } = useMapData(isLoaded, authTokens, handleLogout);

  // Використовуємо кастомний хук для отримання статистики
  const { stats, error: statsError } = useUserStats(authTokens, handleLogout);

  // Використовуємо кастомний хук для дій з анонімними повідомленнями
  const { sendMessage, findMessage } = useAnonymousMessageActions(setAnonymousMessages);

  const handleSendAnonymousMessage = (messageData) => {
    // Використовуємо функцію з хука, передаючи колбек для закриття модального вікна
    sendMessage(messageData, () => setIsShareModalOpen(false));
  };

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  // Якщо користувач не залогінений, показуємо форму входу/реєстрації
  if (!authTokens) {
    return <Auth setAuthTokens={setAuthTokens} />;
  }

  return (
    isLoaded ? (
      <>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            // Стилі за замовчуванням для всіх сповіщень
            style: {
              borderRadius: '8px',
              background: 'var(--info-window-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            },
            // Налаштування для сповіщень про успіх
            success: {
              iconTheme: { primary: '#10B981', secondary: 'white' },
            },
          }}
        />
        <div className="top-controls-container">
          <div className="map-controls-left">
            <div className="profile-button-area">
              <button className="control-button icon-button profile-icon-button" onClick={() => setIsProfileModalOpen(true)} title="Open Profile">
                <img src="/Profile.png" alt="Profile" />
              </button>
              {stats && <div className="profile-level-display">LVL {stats.level}</div>}
            </div>
            <ProfileXPBar stats={stats} error={statsError} />
          </div>
          <div className="map-controls-right"> 
            <OnlineIndicator onAuthError={handleLogout} theme={theme} />
            <button onClick={() => setIsChatOpen(true)} className="control-button icon-button" title="Global Chat">
              <img src="/Chat.png" alt="Chat icon" />
            </button>
            <button onClick={toggleTheme} className="control-button icon-button" title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <img 
                src={
                  theme === 'light' ? '/DarkMode.png' : '/LightMode.png'
                } 
                alt="Toggle theme" 
              />
            </button>
            <button onClick={handleLogout} className="control-button icon-button" title="Logout">
              <img src="/Logout.png" alt="Logout icon" />
            </button>
          </div>
          <div className="map-controls-center"> 
            <button onClick={toggleMapType} className="control-button icon-button" title={mapTypeId === 'roadmap' ? 'Satellite View' : 'Map View'}>
              <img 
                src={mapTypeId === 'roadmap' ? '/MapS.png' : '/Map.png'} 
                alt={mapTypeId === 'roadmap' ? 'Satellite view icon' : 'Map view icon'} />
            </button>
            <button onClick={toggleLabels} className="control-button icon-button" title={showLabels ? 'Hide Labels' : 'Show Labels'}>
              <img src={showLabels ? '/OFFlabels.png' : '/ONlabels.png'} alt={showLabels ? 'Hide labels icon' : 'Show labels icon'} />
            </button>
            <button onClick={() => setIsShareModalOpen(true)} className="control-button icon-button" title="Share a message">
              <img src="/ShareIT.png" alt="Share icon" />
            </button>
            <button onClick={() => setIsCommunityModalOpen(true)} className="control-button icon-button" title="Community Goal">
              <img src="/OurGoal.png" alt="Our Goal icon" />
            </button>
          </div>
        </div>
        <MapComponent
          placemarks={placemarks}
          setPlacemarks={setPlacemarks}
          otherPlacemarks={otherPlacemarks}
          anonymousMessages={anonymousMessages}
          setBeacons={setBeacons}
          beacons={beacons}
          theme={theme}
          mapTypeId={mapTypeId}
          showLabels={showLabels}
          onOpenComments={handleOpenComments}
          stats={stats}
          onFindAnonymousMessage={findMessage} // Передаємо функцію з хука напряму
        />
        <ShareMessageModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onSend={handleSendAnonymousMessage}
        />
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
        <CommunityModal
          isOpen={isCommunityModalOpen}
          onClose={() => setIsCommunityModalOpen(false)}
          onAuthError={handleLogout}
        />
        <ChatWindow
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          theme={theme}
        />
        <PlacemarkSidebar 
          placemark={selectedPlacemark} 
          onClose={handleCloseSidebar} 
          authTokens={authTokens} 
          onAuthError={handleLogout}
          theme={theme} />
      </>
    ) : (
      <div className="loading-container">
        <p>Loading Maps...</p>
      </div>
    )
  );
}

export default App;
