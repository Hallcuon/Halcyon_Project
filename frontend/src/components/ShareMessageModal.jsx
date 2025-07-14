import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ShareMessageModal = ({ isOpen, onClose, onSend }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body cannot be empty.');
      return;
    }
    onSend({ title, body });
    setTitle('');
    setBody('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Share a Message</h2>
        <p>Your message will be dropped anonymously at a random location on the map for someone to find.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modal-input"
            maxLength="100"
            required
          />
          <textarea
            placeholder="Your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="modal-textarea"
            maxLength="1000"
            required
          ></textarea>
          <div className="modal-buttons">
            <button type="submit" className="modal-button-send">Send</button>
            <button onClick={onClose} className="modal-button-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareMessageModal;