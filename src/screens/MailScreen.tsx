// src/screens/MailScreen.tsx
import React, { useEffect } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { Modal } from '../components/Modal';

interface MailScreenProps {
  onNavigate: (screen: string) => void;
}

export default function MailScreen({ onNavigate }: MailScreenProps) {
  const { getNotifications, getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearNotifications } = useGame();
  const notifications = getNotifications();
  const unreadCount = getUnreadNotifications().length;
  const [showConfirmModal, setShowConfirmModal] = React.useState<null | 'clear' | 'markAll'>(null);
  
  useEffect(() => {
    // Mark all notifications as read when opening mail
    markAllNotificationsAsRead();
    // No refreshUI needed
  }, []);
  
  const handleMarkAsRead = (notificationId: number) => {
    markNotificationAsRead(notificationId);
  };
  
  const handleMarkAllAsRead = () => {
    setShowConfirmModal('markAll');
  };
  
  const handleClearAll = () => {
    setShowConfirmModal('clear');
  };

  const confirmAction = () => {
    if (showConfirmModal === 'clear') {
      clearNotifications();
    } else if (showConfirmModal === 'markAll') {
      markAllNotificationsAsRead();
    }
    setShowConfirmModal(null);
  };

  const cancelAction = () => {
    setShowConfirmModal(null);
  };
  
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'bust': return '🚨';
      default: return '📢';
    }
  };
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#66ff66';
      case 'warning': return '#ffcc66';
      case 'error': return '#ff6666';
      case 'bust': return '#ff4444';
      default: return '#66ccff';
    }
  };
  
  return (
    <div className="mail-screen">
      <div style={{
        background: '#222',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffff00' }}>
            📧 Mail & Notifications
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleMarkAllAsRead}
              className="action-btn"
              style={{ fontSize: '11px' }}
            >
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              className="action-btn"
              style={{ fontSize: '11px', background: '#ff6666' }}
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
          {unreadCount} unread • {notifications.length} total
        </div>
      </div>
      
      <div id="notificationsList" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>
              No notifications yet
            </div>
            <div style={{ fontSize: '12px' }}>
              Game events and updates will appear here
            </div>
          </div>
        ) : (
          notifications.map((notification: any) => {
            const isUnread = !notification.read;
            const icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);
            const timeAgo = getTimeAgo(notification.timestamp);
            
            return (
              <div
                key={notification.id}
                className={`notification-item ${isUnread ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
                style={{
                  background: isUnread ? '#333' : '#222',
                  border: `1px solid ${isUnread ? '#666' : '#444'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: isUnread ? '3px solid #66ccff' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ fontSize: '20px' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color, fontWeight: 'bold', marginBottom: '5px' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      Day {notification.day} • {timeAgo}
                      {isUnread && (
                        <span style={{ color: '#66ccff' }}> • NEW</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => onNavigate('home')} className="action-btn">
          ← Back to Home
        </button>
      </div>
      {/* In-game confirmation modal */}
      {showConfirmModal && (
        <Modal
          isOpen={!!showConfirmModal}
          onClose={cancelAction}
          title={showConfirmModal === 'clear' ? 'Clear All Notifications' : 'Mark All Read'}
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>
              {showConfirmModal === 'clear'
                ? 'Are you sure you want to clear all notifications?'
                : 'Mark all notifications as read?'}
            </p>
            <button className="action-btn" onClick={confirmAction}>
              Confirm
            </button>
            <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelAction}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
} 