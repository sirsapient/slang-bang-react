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
      message: "Great! Now let's head back to the Home screen to access the Trading button. Click the Trading button to continue.",
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
      nextButton: true,
    },
  ],
  baseRaidsTutorial: [
    {
      id: 'welcome',
      message: "Welcome to Base Raids! ⚔️ This is where you attack enemy bases to steal their cash and drugs. You already have the required gang members and guns to get started.",
      requireClick: false,
      nextButton: true,
    },
    {
      id: 'warning',
      message: "⚠️ WARNING: Base raids are dangerous! If you fail, you can lose gang members and guns. Also, raiding increases your heat level, making you more likely to be raided by the police. Proceed with caution!",
      requireClick: false,
      nextButton: true,
    },
    {
      id: 'target-selection',
      message: "Here you can see enemy bases in the current city. Each base has different difficulty levels and potential loot. Select a target to continue.",
      requireClick: false,
      nextButton: true,
    },
    {
      id: 'select-target',
      message: "Here you can see enemy bases in the current city. Each base has different difficulty levels and potential loot. When you're ready to raid, simply select a target and plan your assault.",
      requireClick: false,
      nextButton: true,
    },
    {
      id: 'raid-planning',
      message: "Now you can plan your raid! You can adjust how many gang members to send. More members = better success chance, but more potential losses. When you're ready, click the Execute Raid button to launch your assault.",
      requireClick: false,
      nextButton: true,
    },
    {
      id: 'completion',
      message: "Congratulations! You've mastered Base Raids! 🎉 Keep raiding to build your empire, but be careful - too much heat can bring the police down on you.",
      requireClick: false,
      okButton: true,
    },
  ],
  firstBase: [
    {
      id: 'base-congrats',
      message: "Congratulations on buying your first base! 🏢\n\nBases are your criminal headquarters in each city. They let you store drugs, assign gang members, and generate income.\n\nLet's get your base operational!",
      skipButton: true, // Custom property to indicate Skip Tutorial button should be shown
      nextButton: true, // Custom property to indicate Next button should be shown
    },
    {
      id: 'base-assign-gang',
      message: "To activate your base, assign your 4 available gang members to it.\n\nClick the 'Assign Gang' button and add all 4 members to your new base. This will get your base up and running, ready to generate income and store goods!",
      requireClick: true,
      highlightElement: 'assign-gang-button', // Make sure this matches the actual button's id or class
      noButtons: true, // No Next/Skip, closes only after action
    },
    {
      id: 'base-drugs-guns-modal',
      message: "Now that your base is operational, make sure you have some drugs to store! If you don't have any, head to the Market or Trading screen to get some.\n\nAlso, don't forget to assign guns to your base—guns help protect your base from raids and keep your gang members safe.",
      nextButton: true,
    },
    {
      id: 'base-complete',
      message: "🎉 Excellent! Your base is now fully operational! You can store drugs, assign gang members, and generate income. Your criminal empire is growing! 🏢",
      requireClick: false,
      nextButton: true,
    },
    // You can add more steps here for assigning guns, storing drugs, etc.
  ],
  drugInventoryTutorial: [
    {
      id: 'welcome',
      message: "Welcome to Drug Inventory Management! 🏢\n\nThis is where you can store your drugs safely in your base. Drugs stored in bases are protected from police raids and can generate 3x profits when sold!\n\nLet's learn how to use this system effectively.",
      nextButton: true,
    },
    {
      id: 'adding-drugs',
      message: "To add drugs to your base, enter the quantity in the 'Transfer' column. You can transfer drugs from your personal inventory to your base storage.\n\nTry using the 'Max' button to quickly transfer the maximum amount possible!",
      nextButton: true,
    },
    {
      id: 'max-button',
      message: "The 'Max' button automatically calculates the maximum amount you can transfer based on:\n• Your available inventory\n• Your base's storage capacity\n• Current drugs already in the base\n\nThis saves you time and ensures you're always transferring the optimal amount!",
      requireClick: false,
      nextButton: true,
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
      nextButton: true,
    },
  ],
  gangManagementTutorial: [
    {
      id: 'welcome',
      message: "Welcome to Gang Management! 👥\n\nThis screen allows you to transfer gang members between cities. You can move your crew to different locations to support your operations in those areas.\n\nTransferring gang members costs money based on distance and city heat levels.",
      okButton: true,
    },
  ],
};

const defaultProgress = {
  gettingStarted: false,
  assetsTutorial: false,
  assetsJewelryTutorial: false,
  baseRaidsTutorial: false,
  firstBase: false,
  drugInventoryTutorial: false,
  firstRaid: false,
  gangManagementTutorial: false,
};

interface TutorialContextType {
  progress: typeof defaultProgress;
  activeTutorial: string | null;
  stepIndex: number;
  tutorialSteps: typeof tutorialSteps;
  startTutorial: (key: string) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  resetTutorials: () => void;
  resetTutorial: (tutorialKey: string) => void;
  setStepIndex: (index: number) => void;
  hasSeenFirstAssetsModal: boolean;
  stepReadyElement: string | null;
  notifyStepReady: (elementId: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  // Track which tutorials are completed
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem('tutorialProgress');
    return saved ? JSON.parse(saved) : { ...defaultProgress };
  });
  // Track which tutorial is currently active (null, 'gettingStarted', 'firstBase', 'firstRaid')
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  // Track current step index within the active tutorial
  const [stepIndex, setStepIndex] = useState(0);
  const [stepReadyElement, setStepReadyElement] = useState<string | null>(null);
  // Track if user has seen first assets modal but hasn't completed tutorial
  const [hasSeenFirstAssetsModal, setHasSeenFirstAssetsModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('tutorialProgress', JSON.stringify(progress));
  }, [progress]);

  // Start a tutorial by key
  const startTutorial = useCallback((key: string) => {
    console.log('Starting tutorial:', key);
    setActiveTutorial(key);
    setStepIndex(0);
    setStepReadyElement(null);
  }, []);

  // Advance to next step
  const nextStep = useCallback(() => {
    console.log('[DEBUG] nextStep called', { activeTutorial, stepIndex });
    console.trace();
    if (!activeTutorial) return;
    
    const currentSteps = tutorialSteps[activeTutorial as keyof typeof tutorialSteps];
    if (stepIndex < currentSteps.length - 1) {
      console.log('Tutorial nextStep called:', { activeTutorial, stepIndex });
      console.log('Advancing to step:', stepIndex + 1);
      setStepIndex(stepIndex + 1);
      setStepReadyElement(null); // Reset step ready element when advancing
    } else {
      console.log('Tutorial completed, skipping');
      skipTutorial();
    }
  }, [activeTutorial, stepIndex]);

  // Skip tutorial
  const skipTutorial = useCallback(() => {
    console.log('Skipping tutorial:', activeTutorial);
    if (activeTutorial) {
      // If skipping from the first step of gettingStarted, only mark gettingStarted as completed
      if (activeTutorial === 'gettingStarted' && stepIndex === 0) {
                setProgress((prev: any) => ({
          ...prev, 
          gettingStarted: true
        }));
      } else {
        // Otherwise just mark the current tutorial as completed
        setProgress((prev: any) => ({ ...prev, [activeTutorial]: true }));
      }
      setActiveTutorial(null);
      setStepIndex(0);
      setStepReadyElement(null);
    }
  }, [activeTutorial, stepIndex]);

  // Reset all tutorials (for testing)
  const resetTutorials = useCallback(() => {
    console.log('Resetting all tutorials');
    setActiveTutorial(null);
    setStepIndex(0);
    setStepReadyElement(null);
    setHasSeenFirstAssetsModal(false);
  }, []);

  // Reset specific tutorial (for testing)
  const resetTutorial = useCallback((tutorialKey: string) => {
    console.log('Resetting tutorial:', tutorialKey);
    if (activeTutorial === tutorialKey) {
      setActiveTutorial(null);
      setStepIndex(0);
      setStepReadyElement(null);
    }
  }, [activeTutorial]);

  const setStepIndexManually = useCallback((index: number) => {
    console.log('Setting step index manually:', index);
    setStepIndex(index);
    setStepReadyElement(null);
  }, []);

  const notifyStepReady = useCallback((elementId: string) => {
    console.log('Step ready notification:', elementId);
    setStepReadyElement(elementId);
  }, []);

  const value = {
    progress,
    activeTutorial,
    stepIndex,
    tutorialSteps,
    startTutorial,
    nextStep,
    skipTutorial,
    resetTutorials,
    resetTutorial,
    setStepIndex: setStepIndexManually,
    hasSeenFirstAssetsModal,
    setHasSeenFirstAssetsModal,
    stepReadyElement,
    notifyStepReady,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
} 