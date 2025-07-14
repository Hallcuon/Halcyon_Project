import { useState, useEffect, useCallback } from 'react';

/**
 * Кастомний хук для керування станом користувацького інтерфейсу (UI).
 * Інкапсулює логіку тем, модальних вікон, типу карти та іншого.
 */
const useUIState = () => {
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  const [showLabels, setShowLabels] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // 'light', 'dark'
  const [selectedPlacemark, setSelectedPlacemark] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  // Ефект для застосування теми
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme => {
      if (currentTheme === 'light') return 'dark';
      if (currentTheme === 'dark') return 'light';
    });
  }, []);

  const toggleLabels = useCallback(() => {
    const newShowLabels = !showLabels;
    setShowLabels(newShowLabels);

    if (mapTypeId === 'satellite' || mapTypeId === 'hybrid') {
      setMapTypeId(newShowLabels ? 'hybrid' : 'satellite');
    }
  }, [showLabels, mapTypeId]);

  const toggleMapType = useCallback(() => {
    setMapTypeId(current => {
      return current === 'roadmap' ? (showLabels ? 'hybrid' : 'satellite') : 'roadmap';
    });
  }, [showLabels]);

  const handleOpenComments = useCallback((placemark) => {
    setSelectedPlacemark(placemark);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedPlacemark(null);
  }, []);

  return {
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
  };
};

export default useUIState;