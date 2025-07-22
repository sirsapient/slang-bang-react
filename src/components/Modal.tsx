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
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          background: '#222',
          color: '#fff',
          borderRadius: '10px',
          padding: '24px',
          minWidth: '300px',
          maxWidth: maxWidth,
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {title && <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{title}</span>}
            {showCloseButton && (
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5em', cursor: 'pointer' }} onClick={onClose}>×</button>
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