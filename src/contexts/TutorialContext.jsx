import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Tutorial Step Data ---
const tutorialSteps = {
  gettingStarted: [
    {
      id: 'welcome',
      message: "Welcome to Slng Bang! Let's get you started.",
    },
    {
      id: 'travel',
      message: "You can travel between cities using the Travel screen. Try visiting a new city!",
    },
    {
      id: 'buy-sell',
      message: "Buy low, sell high! Purchase drugs in one city and sell them in another for profit.",
    },
    {
      id: 'cops',
      message: "Watch out for the cops! High heat increases your risk of getting busted.",
    },
    {
      id: 'assets',
      message: "Assets like jewelry can be sold later if you get busted. They're important for bouncing back!",
    },
    {
      id: 'end',
      message: "That's the basics! Explore and have fun. More tutorials will appear as you progress.",
    },
  ],
  firstBase: [
    {
      id: 'base-intro',
      message: "Congrats on buying your first base! Let's set it up.",
    },
    {
      id: 'assign-gang',
      message: "Assign gang members to your base to start generating income.",
    },
    {
      id: 'assign-guns',
      message: "Assign guns to protect your base from raids.",
    },
    {
      id: 'store-drugs',
      message: "You can store drugs in your base for safekeeping.",
    },
    {
      id: 'collect-income',
      message: "Collect income from your base regularly. Keep it operational!",
    },
    {
      id: 'base-end',
      message: "Your base is set up! Keep expanding your empire.",
    },
  ],
  firstRaid: [
    {
      id: 'raid-intro',
      message: "You're about to attempt your first raid!",
    },
    {
      id: 'raid-gang',
      message: "Choose how many gang members and guns to send. More means higher success, but also higher risk.",
    },
    {
      id: 'raid-risk',
      message: "Check the raid risk meter to see your chances of success.",
    },
    {
      id: 'raid-outcome',
      message: "If you succeed, you'll earn rewards. If you fail, you may lose gang members or assets.",
    },
    {
      id: 'raid-end',
      message: "Good luck! Plan your raids carefully.",
    },
  ],
};

const defaultProgress = {
  gettingStarted: false,
  firstBase: false,
  firstRaid: false,
};

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
  // Track which tutorials are completed
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('tutorialProgress');
    return saved ? JSON.parse(saved) : { ...defaultProgress };
  });
  // Track which tutorial is currently active (null, 'gettingStarted', 'firstBase', 'firstRaid')
  const [activeTutorial, setActiveTutorial] = useState(null);
  // Track current step index within the active tutorial
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('tutorialProgress', JSON.stringify(progress));
  }, [progress]);

  // Start a tutorial by key
  function startTutorial(key) {
    setActiveTutorial(key);
    setStepIndex(0);
  }

  // Advance to next step
  function nextStep() {
    if (!activeTutorial) return;
    const steps = tutorialSteps[activeTutorial];
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Complete tutorial
      setProgress((prev) => ({ ...prev, [activeTutorial]: true }));
      setActiveTutorial(null);
      setStepIndex(0);
    }
  }

  // Skip tutorial
  function skipTutorial() {
    if (activeTutorial) {
      setProgress((prev) => ({ ...prev, [activeTutorial]: true }));
      setActiveTutorial(null);
      setStepIndex(0);
    }
  }

  // Reset all tutorials (for testing)
  function resetTutorials() {
    setProgress({ ...defaultProgress });
    setActiveTutorial(null);
    setStepIndex(0);
  }

  return (
    <TutorialContext.Provider value={{
      progress,
      activeTutorial,
      stepIndex,
      tutorialSteps,
      startTutorial,
      nextStep,
      skipTutorial,
      resetTutorials,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
} 