import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './CommunityModal.css';

const CommunityModal = ({ isOpen, onClose, onAuthError }) => {
  const [progressData, setProgressData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      const fetchProgress = axiosInstance.get('/community-progress/');
      const fetchLeaderboard = axiosInstance.get('/leaderboard/');

      Promise.all([fetchProgress, fetchLeaderboard])
        .then(([progressResponse, leaderboardResponse]) => {
          setProgressData(progressResponse.data);
          setLeaderboardData(leaderboardResponse.data);
        })
        .catch(error => {
          console.error("Error fetching community data:", error);
          toast.error("Could not load community data.");
          if (error.response?.status === 401 && onAuthError) {
            onAuthError();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, onAuthError]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content community-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        <h2>🏅 Community Goal 🏅</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="community-progress-section">
              <p className="progress-text">
                Global Progress: {(progressData?.progress || 0).toFixed(2)}%
              </p>
              <div className="progress-bar-wrapper">
                <div className="progress-bar" style={{ width: `${progressData?.progress || 0}%` }}></div>
              </div>
            </div>

            <div className="leaderboard-section">
              <h3>Leaderboard</h3>
              {leaderboardData.length > 0 ? (
                <ul className="leaderboard-list">
                  {leaderboardData.map((user, index) => (
                    <li key={user.username} className="leaderboard-item">
                      <span className="leaderboard-rank">#{index + 1}</span>
                      <img 
                        src={user.avatar_url ? user.avatar_url : '/DefaultProfile.png'} 
                        alt={`${user.username}'s avatar`} 
                        className="leaderboard-avatar" 
                      />
                      <span className="leaderboard-username">{user.username}</span>
                      <span className="leaderboard-score">
                        {user.activated_beacons_count}
                        <img src="/ONbeacon.png" alt="Beacon icon" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="leaderboard-empty">No one has activated any beacons yet. Be the first!</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityModal;