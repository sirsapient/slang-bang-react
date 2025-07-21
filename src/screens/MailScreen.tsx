import React, { useState } from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext';

interface MailScreenProps {
  onNavigate: (screen: string) => void;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
  read: boolean;
}

interface EventLog {
  text: string;
  type: 'good' | 'bad' | 'neutral';
  timestamp: number;
  day: number;
}

export default function MailScreen({ onNavigate }: MailScreenProps) {
  const { state, events, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const [activeTab, setActiveTab] = useState<'notifications' | 'events'>('notifications');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const notifications = state.notifications || [];
  const eventLog = events.getRecentEvents(50) || [];
  
  const handleMarkRead = (notificationId: string) => {
    const notification = notifications.find((n: Notification) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      refreshUI();
    }
  };
  
  const handleMarkAllRead = () => {
    notifications.forEach((notification: Notification) => {
      notification.read = true;
    });
    refreshUI();
  };
  
  const handleClearAll = () => {
    state.notifications = [];
    refreshUI();
    setShowClearConfirm(false);
  };
  
  const handleClearEvents = () => {
    events.clear();
    refreshUI();
  };
  
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'good': return '✅';
      case 'bad': return '❌';
      default: return 'ℹ️';
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  return (
    <div className="mail-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>📧 Mail & Events</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Notifications and Activity Log</div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '20px',
        background: '#222',
        borderRadius: '10px',
        padding: '5px'
      }}>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'notifications' ? '#333' : 'transparent',
            color: activeTab === 'notifications' ? '#fff' : '#aaa',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📧 Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'events' ? '#333' : 'transparent',
            color: activeTab === 'events' ? '#fff' : '#aaa',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 Event Log
        </button>
      </div>
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          {/* Header Actions */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <button
              className="action-btn"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: unreadCount === 0 ? '#444' : '#333'
              }}
            >
              Mark All Read
            </button>
            <button
              className="action-btn"
              onClick={() => setShowClearConfirm(true)}
              disabled={notifications.length === 0}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: notifications.length === 0 ? '#444' : '#ff6666',
                color: '#000'
              }}
            >
              Clear All
            </button>
          </div>
          
          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                No notifications
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Notifications will appear here when important events occur
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              {notifications.map((notification: Notification) => (
                <div key={notification.id} style={{
                  background: notification.read ? '#222' : '#1a1a1a',
                  border: notification.read ? '1px solid #444' : '1px solid #666',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '10px',
                  position: 'relative'
                }}>
                  {!notification.read && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '8px',
                      height: '8px',
                      background: '#66ff66',
                      borderRadius: '50%'
                    }} />
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ fontSize: '16px', marginTop: '2px' }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: notification.read ? '#aaa' : '#fff',
                        marginBottom: '5px',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#66ff66',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          {/* Header Actions */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <button
              className="action-btn"
              onClick={handleClearEvents}
              disabled={eventLog.length === 0}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                background: eventLog.length === 0 ? '#444' : '#ff6666',
                color: '#000'
              }}
            >
              Clear Log
            </button>
          </div>
          
          {/* Events List */}
          {eventLog.length === 0 ? (
            <div style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                No events logged
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Game events will be logged here as they occur
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              {eventLog.map((event: any, index: number) => (
                <div key={`${event.timestamp}-${index}`} style={{
                  background: '#222',
                  border: '1px solid #444',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ fontSize: '16px', marginTop: '2px' }}>
                      {getEventIcon(event.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: event.type === 'good' ? '#66ff66' : event.type === 'bad' ? '#ff6666' : '#aaa',
                        marginBottom: '5px',
                        lineHeight: '1.4'
                      }}>
                        {event.text}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#666'
                      }}>
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🗑️ Clear All Notifications</span>
              <button className="modal-close" onClick={() => setShowClearConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '15px' }}>
                  Are you sure you want to clear all notifications?
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
                  This action cannot be undone.
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleClearAll}
                    className="action-btn"
                    style={{ flex: 1, background: '#ff6666', color: '#000' }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="action-btn"
                    style={{ flex: 1, background: '#666' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 