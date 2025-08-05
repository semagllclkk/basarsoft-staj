import React, { useEffect } from 'react';

function MessagePopup({ message, onClose }) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                background: message.type === 'error' ? '#e53935' : '#43a047',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                fontWeight: 'bold',
                fontSize: '18px',
                minWidth: '220px',
                textAlign: 'center'
            }}
            onClick={onClose}
        >
            {message.text}
        </div>
    );
}

export default MessagePopup;
