import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import './PlacemarkSidebar.css';

const PlacemarkSidebar = ({ placemark, onClose, authTokens, onAuthError, theme, isGlassMode }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const currentUserId = useMemo(() => {
    if (!authTokens?.access) {
      return null;
    }
    try {
      const decoded = jwtDecode(authTokens.access);
      return decoded.user_id;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }, [authTokens]);

  useEffect(() => {
    if (placemark) {
      setLoading(true);
      axiosInstance.get(`/placemarks/${placemark.id}/comments/`)
        .then(response => {
          setComments(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching comments:", error);
          if (error.response?.status === 401 && onAuthError) {
            onAuthError();
          }
          setLoading(false);
        });
    }
  }, [placemark, onAuthError]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    axiosInstance.post(`/placemarks/${placemark.id}/comments/`, { text: newCommentText })
      .then(response => {
        setComments([...comments, response.data]);
        setNewCommentText('');
      })
      .catch(error => {
        console.error("Error posting comment:", error);
        if (error.response?.status === 401 && onAuthError) {
          onAuthError();
        }
        toast.error("Failed to post comment.");
      });
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      axiosInstance.delete(`/placemarks/${placemark.id}/comments/${commentId}/`)
        .then(() => {
          setComments(currentComments => currentComments.filter(c => c.id !== commentId));
        })
        .catch(error => {
          console.error("Error deleting comment:", error);
          if (error.response?.status === 401 && onAuthError) {
            onAuthError();
          }
          toast.error("Failed to delete comment.");
        });
    }
  };

  if (!placemark) return null;

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar-container" onClick={(e) => e.stopPropagation()}>
        <button className="sidebar-close-button" onClick={onClose}>×</button>
        <h2>{placemark.title}</h2>
        <p className="sidebar-description">{placemark.description}</p>
        
        <div className="comments-section">
          <h3>Comments</h3>
          <div className="comments-list">
            {loading ? (
              <p>Loading comments...</p>
            ) : comments.length > 0 ? (
              comments.map(comment => {
                const avatarUrl = comment.author_avatar_url ? comment.author_avatar_url.replace('http://127.0.0.1:8000', '') : '/DefaultProfile.png';
                
                let authorColor = comment.author_chat_color || '#FFFFFF';
                const isDefaultColor = authorColor.toLowerCase() === '#ffffff' || authorColor.toLowerCase() === 'white';
                if (isDefaultColor && theme === 'light' && !isGlassMode) {
                  authorColor = '#333333';
                }

                return (
                  <div key={comment.id} className="comment-item">
                    <img src={avatarUrl} alt={`${comment.author_username}'s avatar`} className="comment-avatar" />
                    <div className="comment-content">
                      <p className="comment-author" style={{ color: authorColor }}>{comment.author_username}</p>
                      <p className="comment-date">{new Date(comment.created_at).toLocaleDateString()}</p>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                    {currentUserId === comment.author && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="comment-delete-button" title="Delete comment">
                        ×
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No comments yet. Be the first to comment!</p>
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              required
            />
            <button type="submit">Post Comment</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlacemarkSidebar;