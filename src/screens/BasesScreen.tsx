import React from 'react';

interface BasesScreenProps {
  onNavigate: (screen: string) => void;
}

const BasesScreen: React.FC<BasesScreenProps> = ({ onNavigate }) => {
  return (
    <div className="bases-screen">
      <h2>Bases</h2>
      <p>Your base management will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default BasesScreen; 