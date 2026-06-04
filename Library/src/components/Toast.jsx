import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for transition
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    container: {
      position: 'fixed',
      top: '20px',
      left: '50%',
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '50px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 10000,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-20px)',
    },
    icon: {
      fontSize: '1.2rem',
    }
  };

  return ReactDOM.createPortal(
    <div style={styles.container}>
      <span style={styles.icon}>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>,
    document.body
  );
};

export default Toast;
