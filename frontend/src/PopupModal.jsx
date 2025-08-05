import React from 'react';

const PopupModal = ({ visible, onClose, onSubmit, errorMessage }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = () => {
    if (name.trim() === '') return;
    onSubmit({ name, description });
    setName('');
    setDescription('');
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '0', left: '0', width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 999
    }}>
      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '8px',
        width: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <h3>Geometri Bilgisi</h3>
        <label>İsim:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <label>Açıklama:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ width: '100%', marginBottom: '10px' }}
        />
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        <div style={{ textAlign: 'right' }}>
          <button onClick={onClose} style={{ marginRight: '10px' }}>İptal</button>
          <button onClick={handleSubmit}>Kaydet</button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;