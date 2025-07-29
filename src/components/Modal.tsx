import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  maxWidth = '500px' 
}: ModalProps) {
  // Remove or comment out the debug log for isOpen
  // console.log('Modal rendering with isOpen:', isOpen);
  if (!isOpen) return null;

  // Use dedicated modal root if available
  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.8)', // Slightly darker background
        zIndex: 1000000, // Very high z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px', // Add padding to prevent edge touching
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: '#222',
          color: '#fff',
          borderRadius: '12px', // Slightly more rounded
          padding: '28px', // Increased padding
          minWidth: '320px', // Increased min width
          maxWidth: maxWidth,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', // Enhanced shadow
          position: 'relative',
          border: '1px solid #444', // Added subtle border
          animation: 'modalFadeIn 0.3s ease-out', // Added animation
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            {title && <span style={{ fontWeight: 'bold', fontSize: '1.3em' }}>{title}</span>}
            {showCloseButton && (
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '1.8em', 
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease'
                }} 
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#444'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                onClick={onClose}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div>
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div 
              style={{ 
                fontSize: '16px', // Increased font size
                color: '#ccc', // Slightly lighter color
                marginBottom: '24px', // Increased margin
                lineHeight: '1.6' // Better line height
              }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onConfirm}
                className="action-btn"
                style={{ 
                  flex: 1, 
                  background: '#66ff66', 
                  color: '#000',
                  padding: '12px 20px', // Increased padding
                  fontSize: '16px', // Increased font size
                  fontWeight: '600'
                }}
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="action-btn"
                style={{ 
                  flex: 1, 
                  background: '#666',
                  padding: '12px 20px', // Increased padding
                  fontSize: '16px', // Increased font size
                  fontWeight: '600'
                }}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 