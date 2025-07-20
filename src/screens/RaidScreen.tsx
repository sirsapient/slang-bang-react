import React from 'react';

interface RaidScreenProps {
  onNavigate: (screen: string) => void;
}

const RaidScreen: React.FC<RaidScreenProps> = ({ onNavigate }) => {
  return (
    <div className="raid-screen">
      <h2>Raid</h2>
      <p>Your raid interface will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default RaidScreen; 