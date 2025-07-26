import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameProvider } from './contexts/GameContext.jsx';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/TutorialOverlay';
import './assets/main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TutorialProvider>
      <GameProvider>
        <App />
        <TutorialOverlay />
      </GameProvider>
    </TutorialProvider>
  </React.StrictMode>
);
