import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const useUserStats = (authTokens, handleLogout) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authTokens) {
      // Clear stats when logging out
      setStats(null);
      setError(null);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/user-stats/');
        setStats(response.data);
        setError(null); // Clear previous errors on success
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
        setError("Could not load profile data.");
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchStats(); // Initial fetch
    const interval = setInterval(fetchStats, 30000); // Fetch every 30 seconds

    // Cleanup function to clear the interval when the component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [authTokens, handleLogout]);

  return { stats, error };
};

export default useUserStats;