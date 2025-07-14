import React from 'react';
import toast from 'react-hot-toast';

const SelectedInfoWindow = ({
  selected,
  isMyPlacemark,
  isEditing,
  placemarkTitle,
  stats,
  setIsEditing,
  setPlacemarkTitle,
  handleUpdatePlacemark,
  handleDeletePlacemark,
  onOpenComments,
  onFindAnonymousMessage,
  handleActivateBeacon,
  setSelected, // To close window on success
}) => {

  // --- Render logic for different types of selected items ---

  // 1. My placemark (view mode)
  if (isMyPlacemark && !isEditing) {
    return (
      <div className="info-window-content">
        <h2>{selected.title}</h2>
        <div className="button-group">
          <button className="iw-button edit" title="Edit" onClick={() => { setIsEditing(true); setPlacemarkTitle(selected.title); }}>
            <img src="/EditPlacemark.png" alt="Edit" />
          </button>
          <button className="iw-button delete" title="Delete" onClick={() => handleDeletePlacemark(selected.id)}>
            <img src="/DeletePlacemark.png" alt="Delete" />
          </button>
          <button className="iw-button comments" title="Comments" onClick={() => onOpenComments(selected)}>
            <img src="/Comments.png" alt="Comments" />
          </button>
        </div>
      </div>
    );
  }

  // 2. My placemark (edit mode)
  if (isMyPlacemark && isEditing) {
    return (
      <div className="info-window-content">
        <h3>Edit Your Placemark</h3>
        <input
          type="text"
          className="placemark-input"
          value={placemarkTitle}
          onChange={(e) => setPlacemarkTitle(e.target.value)}
        />
        <div className="button-group">
          <button className="iw-button save" title="Save" onClick={handleUpdatePlacemark}>
            <img src="/SavePlacemark.png" alt="Save" />
          </button>
          <button className="iw-button cancel" title="Cancel" onClick={() => setIsEditing(false)}>
            <img src="/CancelSavePlacemark.png" alt="Cancel" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Anonymous message ("paper plane")
  if (selected.body) {
    return (
      <div className="info-window-content">
        <h2>{selected.title}</h2>
        <p>{selected.body}</p>
        {stats && selected.owner_username !== stats.username ? (
          <div className="button-group">
            <button
              className="iw-button save"
              title="Pick Up"
              onClick={() => {
                onFindAnonymousMessage(selected.id)
                  .then(() => {
                    // Success: close the window
                    setSelected(null);
                  })
                  .catch(error => {
                    // Error: show a message from the server
                    const errorDetail = error.response?.data?.detail || "Could not pick up the message.";
                    toast.error(errorDetail);
                  });
              }}>
              <img src="/PickUp.png" alt="Pick Up" />
            </button>
          </div>
        ) : (
          <p className="placemark-author">This is your message.</p>
        )}
      </div>
    );
  }

  // 4. Other user's placemark
  if (selected.title) {
    return (
      <div className="info-window-content">
        <h2>{selected.title}</h2>
        <p className="placemark-author">Created by: {selected.user}</p>
        <div className="button-group">
          <button className="iw-button comments" title="Comments" onClick={() => onOpenComments(selected)}>
            <img src="/Comments.png" alt="Comments" />
          </button>
        </div>
      </div>
    );
  }

  // 5. Beacon
  return (
    <div className="info-window-content">
      <h2>{selected.name}</h2>
      {selected.content && <p>{selected.content}</p>}
      {selected.is_activated ? (
        <p className="placemark-author" style={{ marginTop: '10px' }}>
          Activated by: {selected.activated_by} on {new Date(selected.activation_date).toLocaleDateString()}
        </p>
      ) : (
        <button className="iw-text-button" onClick={() => handleActivateBeacon(selected.id)}>Activate</button>
      )}
    </div>
  );
};

export default SelectedInfoWindow;