// MessageModal.jsx
import React from 'react';

const MessageModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: '#fff',
                padding: '20px 30px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                textAlign: 'center',
                minWidth: '300px'
            }}>
                <p style={{ color: message.type === 'success' ? 'green' : 'red' }}>{message.text}</p>
                <button onClick={onClose} style={{ marginTop: '10px' }}>Tamam</button>
            </div>
        </div>
    );
};

export default MessageModal;
