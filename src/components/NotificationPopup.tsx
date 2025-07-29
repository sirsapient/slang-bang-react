import React, { useEffect, useState } from 'react';

interface NotificationPopupProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  message, 
  type, 
  duration = 3000, // Increased from 2000 to 3000ms
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Increased from 300 to 500ms for longer fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: '#1a3a1a',
          borderColor: '#66ff66',
          icon: '✅'
        };
      case 'error':
        return {
          background: '#3a1a1a',
          borderColor: '#ff6666',
          icon: '❌'
        };
      case 'warning':
        return {
          background: '#3a2a1a',
          borderColor: '#ffcc66',
          icon: '⚠️'
        };
      default:
        return {
          background: '#1a1a3a',
          borderColor: '#66ccff',
          icon: '📢'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed', // Changed from absolute to fixed
        top: '50%', // Center vertically
        left: '50%', // Center horizontally
        transform: 'translate(-50%, -50%)', // Perfect centering
        background: styles.background,
        border: `2px solid ${styles.borderColor}`,
        borderRadius: '8px',
        padding: '20px 25px', // Slightly increased padding
        color: '#fff',
        fontSize: '16px', // Slightly increased font size
        fontWeight: '500',
        zIndex: 100000, // Higher z-index to ensure it's on top
        maxWidth: '400px', // Increased max width
        minWidth: '300px', // Added min width
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', // Enhanced shadow
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)', // Added scale animation
        transition: 'opacity 0.5s ease, transform 0.5s ease', // Increased transition duration
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center' // Center text
      }}
    >
      <span style={{ fontSize: '20px' }}>{styles.icon}</span>
      <div dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
};

export default NotificationPopup;