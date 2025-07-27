import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- Tutorial Step Data ---
const tutorialSteps = {
  gettingStarted: [
    {
      id: 'welcome',
      message: "Welcome to Slang and Bang! Let's get you started.",
    },
    {
      id: 'market-highlight',
      message: "Let's get started! Head to the Market screen to find the best prices.",
      highlightElement: 'market-button',
      requireClick: true,
    },
    {
      id: 'market-description',
      message: "This is the Market screen. Here you can view drug prices in different cities and plan your trading routes.",
    },
    {
      id: 'san-antonio-highlight',
      message: "The cheapest weed is always in San Antonio. Select that city to look at prices.",
      highlightElement: 'san-antonio-button',
      requireClick: true,
    },
    {
      id: 'fast-travel-highlight',
      message: "Now hit the Fast Travel button so you can purchase some weed in San Antonio.",
      highlightElement: 'fast-travel-button',
      requireClick: true,
    },
    {
      id: 'trading-description',
      message: "This is the Trading screen. Here you can buy and sell drugs to make profits.",
    },
    {
      id: 'weed-purchase-highlight',
      message: "Buy 2 units of weed to get started. Enter 2 in the quantity field and click Purchase.",
      highlightElement: 'weed-purchase-section',
      requireClick: true,
      specialHighlight: 'weed-entry',
    },
    {
      id: 'travel-highlight',
      message: "Time to catch a flight! Head to the Travel page to book a ticket to Chicago.",
      highlightElement: 'travel-nav-button',
      requireClick: true,
    },
    {
      id: 'chicago-highlight',
      message: "Click Chicago and catch the flight to continue your journey.",
      highlightElement: 'chicago-button',
      requireClick: true,
    },
    {
      id: 'return-home',
      message: "Great! Now let's head back to the Home screen to access the Trading button.",
    },
    {
      id: 'trading-button-highlight',
      message: "Now let's sell your weed in Chicago! Click the Trading button to access the trading screen.",
      highlightElement: 'trading-button',
      requireClick: true,
    },
    {
      id: 'sell-weed-instruction',
      message: "Great! Now you're on the Trading screen in Chicago. You have 2 units of weed to sell. Try the 'Sell All' function - it allows you to sell all your inventory at once!",
      highlightElement: 'sell-all-button',
      requireClick: true,
    },
    {
      id: 'congratulations',
      message: "Congratulations! You've successfully completed your first drug deal! Keep buying and selling to make money and build your empire. The tutorial is complete - you're ready to start your criminal career!",
      requireClick: false,
    },
  ],
  assetsTutorial: [
    {
      id: 'cash-warning',
      message: "You're making some serious cash now! 💰 Would be a shame if the cops took it all... Purchase some jewelry from the Assets page so you always have some cash for a rainy day.",
      requireClick: false,
    },
  ],
  assetsJewelryTutorial: [
    {
      id: 'click-jewelry-tab',
      message: "Click the Jewelry tab to browse available jewelry items.",
      highlightElement: 'jewelry-tab',
      requireClick: true,
    },
    {
      id: 'buy-jewelry',
      message: "Purchase this Silver Chain to protect your cash from police raids!",
      highlightElement: 'silver-chain-purchase',
      requireClick: true,
    },
    {
      id: 'wear-jewelry',
      message: "Now click the Wear button so you can sell this jewelry in any city!",
      highlightElement: 'wear-jewelry-button',
      requireClick: true,
      noButtons: true, // No Next button - user must click the Wear button
    },
    {
      id: 'congratulations',
      message: "🎉 Congratulations! You now have some backup cash if things go sideways. Don't forget you can wear an additional piece of jewelry for extra protection! 💎",
      requireClick: false,
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
      id: 'raid-requirement',
      message: "Remember: You can only raid in cities where you have established a base. This ensures you have a local presence and resources to conduct operations.",
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
  assetsTutorial: false,
  assetsJewelryTutorial: false,
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
  // Track if user has seen first assets modal but hasn't completed tutorial
  const [hasSeenFirstAssetsModal, setHasSeenFirstAssetsModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('tutorialProgress', JSON.stringify(progress));
  }, [progress]);

  // Start a tutorial by key
  const startTutorial = useCallback((key) => {
    setActiveTutorial(key);
    setStepIndex(0);
  }, []);

  // Advance to next step
  const nextStep = useCallback(() => {
    if (!activeTutorial) return;
    const steps = tutorialSteps[activeTutorial];
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Complete tutorial
      setProgress((prev) => ({ ...prev, [activeTutorial]: true }));
      setActiveTutorial(null);
      setStepIndex(0);
      // Clear the flag when tutorial is completed
      if (activeTutorial === 'assetsTutorial') {
        setHasSeenFirstAssetsModal(false);
      }
    }
  }, [activeTutorial, stepIndex]);

  // Skip tutorial
  const skipTutorial = useCallback(() => {
    if (activeTutorial) {
      // If skipping from the first step of gettingStarted, mark ALL tutorials as completed
      if (activeTutorial === 'gettingStarted' && stepIndex === 0) {
        setProgress((prev) => ({ 
          ...prev, 
          gettingStarted: true,
          assetsTutorial: true,
          firstBase: true,
          firstRaid: true
        }));
      } else {
        // Otherwise just mark the current tutorial as completed
        setProgress((prev) => ({ ...prev, [activeTutorial]: true }));
      }
      setActiveTutorial(null);
      setStepIndex(0);
    }
  }, [activeTutorial, stepIndex]);

  // Reset all tutorials (for testing)
  const resetTutorials = useCallback(() => {
    setProgress({ ...defaultProgress });
    setActiveTutorial(null);
    setStepIndex(0);
  }, []);

  // Reset specific tutorial (for testing)
  const resetTutorial = useCallback((tutorialKey) => {
    console.log('Resetting tutorial:', tutorialKey);
    setProgress((prev) => {
      const newProgress = { ...prev, [tutorialKey]: false };
      console.log('New progress:', newProgress);
      // Also update localStorage immediately
      localStorage.setItem('tutorialProgress', JSON.stringify(newProgress));
      return newProgress;
    });
    if (activeTutorial === tutorialKey) {
      setActiveTutorial(null);
      setStepIndex(0);
    }
  }, [activeTutorial]);

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
      resetTutorial,
      setStepIndex,
      hasSeenFirstAssetsModal,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
} 