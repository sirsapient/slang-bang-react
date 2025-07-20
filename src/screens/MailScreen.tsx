import React from 'react';

interface MailScreenProps {
  onNavigate: (screen: string) => void;
}

const MailScreen: React.FC<MailScreenProps> = ({ onNavigate }) => {
  return (
    <div className="mail-screen">
      <h2>Mail</h2>
      <p>Your mail and notifications will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default MailScreen; 