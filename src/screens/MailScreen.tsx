import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

interface MailScreenProps {
  onNavigate: (screen: string) => void;
}

export default function MailScreen({ onNavigate }: MailScreenProps) {
  const { state, events, refreshUI } = useGame();
  const notifications = state.notifications || [];
  const eventLog = events.events || [];
  const [showModal, setShowModal] = useState(false);
  const [modalNotification, setModalNotification] = useState<any>(null);

  // Mark notification as read
  const markAsRead = (id: number) => {
    if (state.markNotificationAsRead) {
      state.markNotificationAsRead(id);
      refreshUI();
    }
  };

  // Clear all notifications
  const clearAll = () => {
    if (state.clearNotifications) {
      state.clearNotifications();
      setShowModal(false);
      setModalNotification(null);
      refreshUI();
    }
  };

  // Close modal if notifications are cleared or modalNotification is null
  useEffect(() => {
    if (notifications.length === 0 || !modalNotification) {
      setShowModal(false);
      setModalNotification(null);
    }
  }, [notifications, modalNotification]);

  return (
    <div className="mail-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>📧 Mail & Notifications</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Your messages and event log</div>
      </div>

      {/* Notifications */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Notifications</div>
        {notifications.length === 0 && <div style={{ color: '#666' }}>No notifications yet.</div>}
        {notifications.length > 0 && (
          <button className="action-btn" style={{ marginBottom: '10px' }} onClick={clearAll}>
            Clear All
          </button>
        )}
        {notifications.map((n: any) => (
          <div key={n.id} style={{
            background: n.read ? '#222' : '#333',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: n.read ? 0.7 : 1,
            cursor: 'pointer'
          }}
            onClick={() => { setShowModal(true); setModalNotification(n); }}
          >
            <div>
              <div style={{ fontWeight: 'bold', color: n.type === 'error' ? '#ff6666' : n.type === 'success' ? '#66ff66' : '#ffff00' }}>{n.message}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Day {n.day} • {new Date(n.timestamp).toLocaleString()}</div>
            </div>
            {!n.read && (
              <button className="action-btn" style={{ background: '#00ff00', color: '#000', fontSize: '12px' }} onClick={e => { e.stopPropagation(); markAsRead(n.id); }}>
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Notification Modal */}
      {showModal && modalNotification != null && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Notification</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontWeight: 'bold', color: modalNotification.type === 'error' ? '#ff6666' : modalNotification.type === 'success' ? '#66ff66' : '#ffff00', fontSize: '18px', marginBottom: '10px' }}>{modalNotification.message}</div>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>Day {modalNotification.day} • {new Date(modalNotification.timestamp).toLocaleString()}</div>
              <button className="action-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Log */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Event Log</div>
        {eventLog.length === 0 && <div style={{ color: '#666' }}>No events yet.</div>}
        {eventLog.slice().reverse().map((e: any, idx: number) => (
          <div key={e.timestamp + '-' + idx} style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            color: e.type === 'bad' ? '#ff6666' : e.type === 'good' ? '#66ff66' : '#aaa',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 'bold' }}>{e.text}</div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>Day {e.day} • {new Date(e.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <button className="action-btn" onClick={() => onNavigate('home')} style={{ width: '100%', marginTop: '10px' }}>
        Back to Home
      </button>
    </div>
  );
} 