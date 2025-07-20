import React from 'react';

interface GangScreenProps {
  onNavigate: (screen: string) => void;
}

const GangScreen: React.FC<GangScreenProps> = ({ onNavigate }) => {
  return (
    <div className="gang-screen">
      <h2>Gang</h2>
      <p>Your gang management will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default GangScreen; 