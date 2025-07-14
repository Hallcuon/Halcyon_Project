import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const useMapData = (isLoaded, authTokens, onAuthError) => {
  const [placemarks, setPlacemarks] = useState([]);
  const [beacons, setBeacons] = useState([]);
  const [otherPlacemarks, setOtherPlacemarks] = useState([]);
  const [anonymousMessages, setAnonymousMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && authTokens) {
      setLoading(true);
      setError(null);

      const fetchPlacemarks = axiosInstance.get('/placemarks/');
      const fetchBeacons = axiosInstance.get('/beacons/');
      const fetchPublicPlacemarks = axiosInstance.get('/public-placemarks/');
      const fetchAnonymousMessages = axiosInstance.get('/anonymous-messages/');

      Promise.all([fetchPlacemarks, fetchBeacons, fetchPublicPlacemarks, fetchAnonymousMessages])
        .then(([placemarksResponse, beaconsResponse, publicPlacemarksResponse, anonymousMessagesResponse]) => {
          setPlacemarks(placemarksResponse.data);
          setBeacons(beaconsResponse.data);
          setOtherPlacemarks(publicPlacemarksResponse.data);
          setAnonymousMessages(anonymousMessagesResponse.data);
        })
        .catch(err => {
          console.error('Error fetching data:', err.response?.data || err.message);
          setError(err);
          if (err.response?.status === 401 && onAuthError) {
            onAuthError();
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isLoaded, authTokens, onAuthError]);

  return { placemarks, setPlacemarks, beacons, setBeacons, otherPlacemarks, setOtherPlacemarks, anonymousMessages, setAnonymousMessages, loading, error };
};

export default useMapData;