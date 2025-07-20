import React from 'react';

interface AssetsScreenProps {
  onNavigate: (screen: string) => void;
}

const AssetsScreen: React.FC<AssetsScreenProps> = ({ onNavigate }) => {
  return (
    <div className="assets-screen">
      <h2>Assets</h2>
      <p>Your asset management will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default AssetsScreen; 