import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ProfileModal.css';

// Допоміжна функція для отримання обрізаного зображення у вигляді Blob
async function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (blob) {
        blob.name = fileName;
        resolve(blob);
      }
    }, 'image/jpeg');
  });
}

const ProfileModal = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Стани для редактора аватара
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const [nicknameColor, setNicknameColor] = useState('#FFFFFF'); // State for the nickname color picker
  const [originalFileName, setOriginalFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      axiosInstance.get('/user-stats/')
        .then(response => {
          setStats(response.data);
          setNicknameColor(response.data.chat_color || '#FFFFFF'); // Initialize color from server data
        })
        .catch(err => {
          console.error("Error fetching user stats:", err);
          setError("Could not load statistics.");
        })
        .finally(() => {
          setLoading(false);
        });
      // Reset the cropper state each time the modal is opened
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [isOpen]);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset previous crop area
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
      setOriginalFileName(e.target.files[0].name);
    }
  };

  function onImageLoad(e) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(crop);
  }

  const handleAvatarUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    const croppedImageBlob = await getCroppedImg(
      imgRef.current,
      completedCrop,
      originalFileName
    );

    const formData = new FormData();
    // Important: add the filename as the third argument.
    formData.append('avatar', croppedImageBlob, originalFileName);

    // Use PATCH for partial updates (only the avatar).
    // Axios will automatically set the correct Content-Type for FormData.
    axiosInstance.patch(`/profile/${stats.username}/`, formData)
      .then(response => {
        // Update the avatar URL, adding a timestamp to bypass the browser cache
        setStats(prevStats => ({ ...prevStats, avatar_url: response.data.avatar + `?t=${new Date().getTime()}` }));
        setImgSrc(''); // Close the cropper view
      })
      .catch(err => console.error("Error uploading avatar:", err));
  };

  const handleAvatarDelete = () => {
    if (window.confirm("Are you sure you want to delete your avatar? This will restore the default one.")) {
      axiosInstance.post(`/profile/${stats.username}/delete_avatar/`)
        .then(response => {
          // Update the URL to immediately show the default avatar
          setStats(prevStats => ({ ...prevStats, avatar_url: response.data.avatar + `?t=${new Date().getTime()}` }));
        })
        .catch(err => {
          console.error("Error deleting avatar:", err);
          toast.error("Could not delete the avatar.");
        });
    }
  };

  const handleSaveColor = () => {
    if (!stats) return;
    axiosInstance.patch(`/profile/${stats.username}/`, { chat_color: nicknameColor })
      .then(response => {
        // Update state to reflect the color change immediately
        setStats(prevStats => ({ ...prevStats, chat_color: response.data.chat_color }));
        toast.success('Color updated successfully!');
      })
      .catch(err => {
        console.error("Error updating color:", err);
        toast.error("Could not save the color.");
      });
  };

  const isDefaultAvatar = stats && stats.avatar_url.includes('DefaultProfile.png');

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content profile-modal ${imgSrc ? 'cropper-active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        <h2>Personal Cabinet</h2>
        {loading && <p>Loading stats...</p>}
        {error && <p className="error-message">{error}</p>}

        {imgSrc ? (
          <div className="cropper-container">
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={1}
            >
              <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop me" />
            </ReactCrop>
            <div className="cropper-buttons">
              <button onClick={handleAvatarUpload} className="upload-button">Crop & Upload</button>
              <button onClick={() => setImgSrc('')} className="cancel-button">Cancel</button>
            </div>
          </div>
        ) : stats && (
          <>
            <div className="profile-header">
              <img 
                src={stats.avatar_url ? stats.avatar_url.replace('http://127.0.0.1:8000', '') : '/DefaultProfile.png'} 
                alt="User Avatar" 
                className="profile-avatar" 
              />
              <div className="avatar-upload-section">
                <label htmlFor="avatar-upload" className="avatar-upload-label" title="Change Avatar">
                  <img src="/ChangeProfile.png" alt="Change Avatar" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} />
                {!isDefaultAvatar && (
                  <button onClick={handleAvatarDelete} className="delete-avatar-button" title="Delete Avatar">
                    <img src="/DeleteProfile.png" alt="Delete Avatar" />
                  </button>
                )}
              </div>
            </div>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">Username:</span>
              <span className="stat-value">{stats.username}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">My Placemarks:</span>
              <span className="stat-value">{stats.placemarks_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activated Beacons:</span>
              <span className="stat-value">{stats.activated_beacons_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sent Messages:</span>
              <span className="stat-value">{stats.sent_messages_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Found Messages:</span>
              <span className="stat-value">{stats.found_messages_count}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Nickname Color:</span>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={nicknameColor}
                  onChange={(e) => setNicknameColor(e.target.value)}
                  className="color-picker-input"
                />
                <button onClick={handleSaveColor} className="save-color-button">Save</button>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;