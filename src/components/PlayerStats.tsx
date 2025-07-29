import React from 'react';

type PlayerStatsProps = {
  playerName: string;
  cash: number;
  currentCity: string;
  day: number;
  heatLevel: number;
};

const PlayerStats: React.FC<PlayerStatsProps> = ({
  playerName,
  cash,
  currentCity,
  day,
  heatLevel,
}) => (
  <div>
    <h2>Player Stats</h2>
    <ul>
      <li><strong>Name:</strong> {playerName}</li>
      <li><strong>Cash:</strong> ${Math.floor(cash).toLocaleString()}</li>
      <li><strong>City:</strong> {currentCity}</li>
      <li><strong>Day:</strong> {day}</li>
      <li><strong>Heat Level:</strong> {heatLevel}%</li>
    </ul>
  </div>
);

export default PlayerStats;