import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

console.log('Modal component loaded');

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
  console.log('Modal rendering with isOpen:', isOpen);
  if (!isOpen) return null;

  // Use React Portal to render modal at the document body
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <span className="modal-title">{title}</span>}
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>×</button>
            )}
          </div>
        )}
        <div className="modal-body">
          {/* Fallback message for debugging */}
          <div style={{ background: 'orange', color: 'black', padding: 10, fontWeight: 'bold', marginBottom: 10 }}>
            MODAL OPEN (isOpen: true) - If you see this, the modal is rendering.
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
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
  console.log('ConfirmModal rendering with isOpen:', isOpen);
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
                fontSize: '14px', 
                color: '#aaa', 
                marginBottom: '20px',
                lineHeight: '1.5'
              }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onConfirm}
                className="action-btn"
                style={{ flex: 1, background: '#66ff66', color: '#000' }}
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="action-btn"
                style={{ flex: 1, background: '#666' }}
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