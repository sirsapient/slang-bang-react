import React from 'react';
import { useTutorial } from '../contexts/TutorialContext';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.55)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const boxStyle: React.CSSProperties = {
  background: '#222',
  borderRadius: 12,
  padding: '32px 28px',
  maxWidth: 420,
  width: '90vw',
  boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
  color: '#fff',
  textAlign: 'center',
  border: '2px solid #66ff66',
};

const messageStyle: React.CSSProperties = {
  fontSize: 20,
  marginBottom: 28,
  color: '#fff',
  fontWeight: 500,
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  fontSize: 16,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
};

export default function TutorialOverlay() {
  const { activeTutorial, stepIndex, tutorialSteps, nextStep, skipTutorial } = useTutorial();

  if (!activeTutorial) return null;
  const step = tutorialSteps[activeTutorial][stepIndex];
  if (!step) return null;

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={messageStyle}>{step.message}</div>
        <div style={buttonRowStyle}>
          <button style={{ ...buttonStyle, background: '#66ff66', color: '#222' }} onClick={nextStep}>
            Next
          </button>
          <button style={{ ...buttonStyle, background: '#444', color: '#fff' }} onClick={skipTutorial}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
} 