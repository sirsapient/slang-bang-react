import React from 'react';

type Inventory = {
  [drug: string]: number;
};

type InventoryModalProps = {
  inventory: Inventory;
  isOpen: boolean;
  onClose: () => void;
};

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          minWidth: '300px',
        }}
      >
        <h2>Inventory</h2>
        <ul>
          {Object.entries(inventory).map(([drug, amount]) => (
            <li key={drug}>
              <strong>{drug}:</strong> {amount}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default InventoryModal;