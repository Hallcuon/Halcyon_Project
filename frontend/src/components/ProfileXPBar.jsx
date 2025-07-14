import React from 'react';
import './ProfileXPBar.css';

const ProfileXPBar = ({ stats, error }) => {
  if (error) {
    return <div className="xp-bar-container error">{error}</div>;
  }

  if (!stats) {
    return <div className="xp-bar-container loading">Loading...</div>;
  }

  const xpPercentage = (stats.current_xp / stats.xp_for_next_level) * 100;

  return (
    <div className="xp-bar-container" title={`${stats.current_xp} / ${stats.xp_for_next_level} XP`}>
      <div className="xp-bar-wrapper">
        <div className="xp-bar-info">
          <span className="xp-bar-xp-text">{stats.current_xp} / {stats.xp_for_next_level} XP</span>
        </div>
        <div className="xp-bar">
          <div 
            className="xp-bar-fill" 
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileXPBar;