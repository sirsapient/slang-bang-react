import React from 'react';

interface TradingScreenProps {
  onNavigate: (screen: string) => void;
}

const TradingScreen: React.FC<TradingScreenProps> = ({ onNavigate }) => {
  return (
    <div className="trading-screen">
      <h2>Trading</h2>
      <p>Your trading interface will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default TradingScreen; 