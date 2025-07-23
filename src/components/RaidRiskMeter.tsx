import React from 'react';

interface RaidRiskMeterProps {
  count: number; // 1-10
  max?: number; // default 10
}

export const RaidRiskMeter: React.FC<RaidRiskMeterProps> = ({ count, max = 10 }) => {
  // Clamp count between 0 and max
  const value = Math.max(0, Math.min(count, max));
  const percent = (value / max) * 100;

  // Color logic
  let color = '#4caf50'; // green
  if (value >= 8) color = '#d32f2f'; // red
  else if (value >= 6) color = '#ff9800'; // orange
  else if (value >= 4) color = '#ffeb3b'; // yellow

  return (
    <div style={{ width: '100%', maxWidth: 180 }}>
      <div style={{ fontSize: 12, marginBottom: 2 }}>Raid Risk: <b>{value}</b> / {max}</div>
      <div style={{
        background: '#eee',
        borderRadius: 6,
        height: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.07)'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
};

export default RaidRiskMeter; 