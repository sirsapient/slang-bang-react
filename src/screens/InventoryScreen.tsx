import React from 'react';

interface InventoryScreenProps {
  onNavigate: (screen: string) => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ onNavigate }) => {
  return (
    <div className="inventory-screen">
      <h2>Inventory</h2>
      <p>Your inventory will be shown here.</p>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default InventoryScreen; 