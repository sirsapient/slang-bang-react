import React, { useEffect, useRef } from 'react';
import { useTutorial } from '../contexts/TutorialContext';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.55)',
  zIndex: 100003, // Higher than drug inventory modal (100001/100002)
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '10vh',
  pointerEvents: 'auto', // Changed back to auto to handle clicks
};

const boxStyle: React.CSSProperties = {
  background: '#222',
  borderRadius: 12,
  padding: '32px 28px',
  maxWidth: 420,
  width: '90vw',
  boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
  color: '#fff',
  textAlign: 'center',
  border: '2px solid #66ff66',
  zIndex: 100004, // Higher than drug inventory modal (100001/100002)
  pointerEvents: 'auto', // Allow clicks on the tutorial box
};

const messageStyle: React.CSSProperties = {
  fontSize: 20,
  marginBottom: 28,
  color: '#fff',
  fontWeight: 500,
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  fontSize: 16,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
};

export default function TutorialOverlay() {
  const { activeTutorial, stepIndex, tutorialSteps, nextStep, skipTutorial } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Always call useEffect, even if there's no active tutorial
  useEffect(() => {
    if (!activeTutorial) return;
    
    const step = tutorialSteps[activeTutorial][stepIndex];
    if (!step) return;

    // Special handling for assets tutorial - monitor jewelry purchases
    if (activeTutorial === 'assetsTutorial' && stepIndex === 4) {
      // Step 4 is "purchase-jewelry" - we need to monitor when jewelry is purchased
      const checkJewelryPurchase = () => {
        // Check if any jewelry is owned
        const jewelryElements = document.querySelectorAll('[data-jewelry-owned]');
        if (jewelryElements.length > 0) {
          console.log('Jewelry purchased, advancing tutorial');
          nextStep();
        }
      };
      
      // Check immediately
      checkJewelryPurchase();
      
      // Set up a mutation observer to watch for changes
      const observer = new MutationObserver(checkJewelryPurchase);
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }

    if (step.highlightElement) {
      // Remove any existing highlights
      const existingHighlights = document.querySelectorAll('.tutorial-highlight');
      existingHighlights.forEach(el => {
        el.classList.remove('tutorial-highlight');
        // Reset all styles
        if (el instanceof HTMLElement) {
          el.style.zIndex = '';
          el.style.position = '';
          el.style.transform = '';
          el.style.boxShadow = '';
          el.style.border = '';
          el.style.filter = '';
          el.style.pointerEvents = '';
          el.style.cursor = '';
        }
      });

      // Add highlight to the target element
      const targetElement = document.getElementById(step.highlightElement);
      
      if (targetElement) {
        targetElement.classList.add('tutorial-highlight');

        // Special handling for Assign Gang tutorial step
        if (step.highlightElement === 'assign-gang-button') {
          // Highlight the button as usual
          targetElement.style.zIndex = '1007';
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';

          // Also enable pointer events for the input field next to the button
          const input = document.getElementById('assign-gang-input');
          if (input) {
            input.style.pointerEvents = 'auto';
            input.style.cursor = 'auto';
            input.style.zIndex = '1007';
          }

          // Make the overlay non-blocking for this step
          if (overlayRef.current) {
            overlayRef.current.style.pointerEvents = 'none';
          }
        } else {
          // For all other steps, restore overlay pointer events
          if (overlayRef.current) {
            overlayRef.current.style.pointerEvents = 'auto';
          }
        }
        
        // Special handling for trading button (step 10 in gettingStarted tutorial)
        if (activeTutorial === 'gettingStarted' && stepIndex === 10 && step.highlightElement === 'trading-button') {
          // Make the trading button prominent and clickable (minimal glow, contained effect)
          targetElement.style.zIndex = '1007';
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';
        } else if (activeTutorial === 'assetsTutorial' && stepIndex === 5 && step.highlightElement === 'wear-jewelry-button') {
          // Make the wear jewelry button prominent and clickable
          targetElement.style.zIndex = '1007';
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';
          
          // Force all children to be clickable
          const children = targetElement.querySelectorAll('*');
          children.forEach(child => {
            if (child instanceof HTMLElement) {
              child.style.pointerEvents = 'auto';
              child.style.cursor = 'pointer';
            }
          });
          
          // Ensure the app grid container is also clickable
          const appGrid = targetElement.closest('.app-grid');
          if (appGrid) {
            appGrid.style.zIndex = '1006';
            appGrid.style.position = 'relative';
            appGrid.style.pointerEvents = 'auto';
          }
          
          // Create a transparent cutout around the trading button
          if (overlayRef.current) {
            const rect = targetElement.getBoundingClientRect();
            const overlay = overlayRef.current;
            
            console.log('Creating cutout for trading button at:', rect);
            
            // Create a much larger transparent area
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 4; // Much larger cutout
            
            // Use a more aggressive gradient that makes the area completely transparent
            overlay.style.background = `
              radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0%, transparent 90%, rgba(0,0,0,0.1) 95%, rgba(0,0,0,0.55) 100%)
            `;
            
            // Make the overlay non-blocking for clicks near the button
            overlay.style.pointerEvents = 'none';
            
            // Add a click handler to the overlay that allows clicks to pass through to the button
            const handleOverlayClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              
              // Check if click is near the trading button
              const buttonRect = targetElement.getBoundingClientRect();
              const clickX = e.clientX;
              const clickY = e.clientY;
              
              const distance = Math.sqrt(
                Math.pow(clickX - (buttonRect.left + buttonRect.width / 2), 2) +
                Math.pow(clickY - (buttonRect.top + buttonRect.height / 2), 2)
              );
              
              if (distance < Math.max(buttonRect.width, buttonRect.height) * 3) {
                // Click is near the button, trigger the tutorial next step
                nextStep();
              }
            };
            
            overlay.addEventListener('click', handleOverlayClick);
            
            // Store the event listener for cleanup
            (overlay as any)._tutorialOverlayClickHandler = handleOverlayClick;
          }
          
          // Add a click event listener to ensure the button is clickable
          const handleClick = (e: Event) => {
            // Don't stop propagation - let the button's original onClick run
            // The button's onClick will handle both navigation and tutorial advancement
          };
          
          targetElement.addEventListener('click', handleClick);
          
          // Store the event listener for cleanup
          (targetElement as any)._tutorialClickHandler = handleClick;
        } else if (activeTutorial === 'assetsJewelryTutorial' && stepIndex === 0 && step.highlightElement === 'jewelry-tab') {
          console.log('Special handling for jewelry tab (step 0)');
          
          // Make the jewelry tab prominent and clickable
          targetElement.style.zIndex = '10001'; // Higher than overlay
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';
          
          // Force all children to be clickable
          const children = targetElement.querySelectorAll('*');
          children.forEach(child => {
            if (child instanceof HTMLElement) {
              child.style.pointerEvents = 'auto';
              child.style.cursor = 'pointer';
            }
          });
          
          // Create a transparent cutout around the jewelry tab
          if (overlayRef.current) {
            const rect = targetElement.getBoundingClientRect();
            const overlay = overlayRef.current;
            
            console.log('Creating cutout for jewelry tab at:', rect);
            
            // Create a transparent area around the tab
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 2;
            
            overlay.style.background = `
              radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0%, transparent 70%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0.55) 100%)
            `;
          }
          
          // Add a click event listener to ensure the tab is clickable
          const handleClick = (e: Event) => {
            console.log('Jewelry tab clicked during tutorial');
            // Don't stop propagation - let the tab's original onClick run
            // The tab's onClick will handle both navigation and tutorial advancement
          };
          
          targetElement.addEventListener('click', handleClick);
          
          // Store the event listener for cleanup
          (targetElement as any)._tutorialClickHandler = handleClick;
          
          // Also add a click handler to the overlay to allow clicks to pass through to the jewelry tab
          if (overlayRef.current) {
            const handleOverlayClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              console.log('Overlay clicked, target:', target);
              
              // Check if click is near the jewelry tab
              const tabRect = targetElement.getBoundingClientRect();
              const clickX = e.clientX;
              const clickY = e.clientY;
              
              const distance = Math.sqrt(
                Math.pow(clickX - (tabRect.left + tabRect.width / 2), 2) +
                Math.pow(clickY - (tabRect.top + tabRect.height / 2), 2)
              );
              
              console.log('Click distance from jewelry tab center:', distance);
              console.log('Jewelry tab bounds:', tabRect);
              console.log('Click position:', { x: clickX, y: clickY });
              
              if (distance < Math.max(tabRect.width, tabRect.height) * 3) {
                // Click is near the jewelry tab, trigger the tutorial next step
                console.log('Overlay click near jewelry tab, advancing tutorial');
                nextStep();
              }
            };
            
            overlayRef.current.addEventListener('click', handleOverlayClick);
            
            // Store the event listener for cleanup
            (overlayRef.current as any)._tutorialOverlayClickHandler = handleOverlayClick;
          }
          
          // Add a fallback: if the jewelry tab is clicked directly, advance the tutorial
          const handleDirectClick = (e: Event) => {
            console.log('Direct jewelry tab click detected');
            if (activeTutorial === 'assetsJewelryTutorial' && stepIndex === 0) {
              console.log('Advancing tutorial from direct jewelry tab click');
              nextStep();
            }
          };
          
          // Listen for clicks on the jewelry tab
          const jewelryTabForClick = document.getElementById('jewelry-tab');
          if (jewelryTabForClick) {
            jewelryTabForClick.addEventListener('click', handleDirectClick);
            (jewelryTabForClick as any)._tutorialDirectClickHandler = handleDirectClick;
          }
          
          // Don't auto-advance - let the user click the jewelry tab
          console.log('Jewelry tab tutorial ready - waiting for user click');
          
          console.log('Jewelry tab setup complete');
        } else if (activeTutorial === 'assetsJewelryTutorial' && stepIndex === 1 && step.highlightElement === 'silver-chain-purchase') {
          console.log('Special handling for silver chain purchase button');
          console.log('Target element found:', targetElement);
          console.log('Target element text:', targetElement.textContent);
          
          // First, ensure the jewelry tab is active
          const jewelryTabElement = document.getElementById('jewelry-tab');
          if (jewelryTabElement && !jewelryTabElement.classList.contains('active')) {
            console.log('Forcing jewelry tab to be active');
            jewelryTabElement.click();
            
            // Wait for the DOM to update, then try to find the button again
            setTimeout(() => {
              console.log('Retrying to find silver chain button after tab activation');
              const retryButton = document.getElementById('silver-chain-purchase');
              if (retryButton) {
                console.log('Found silver chain button on retry!');
                retryButton.classList.add('tutorial-highlight');
                retryButton.style.zIndex = '10001'; // Higher than overlay
                retryButton.style.position = 'relative';
                retryButton.style.transform = 'scale(1.01)';
                retryButton.style.boxShadow = '0 2px 8px rgba(255, 170, 0, 0.2)';
                retryButton.style.border = '2px solid #ffaa00';
                retryButton.style.borderRadius = '8px';
                retryButton.style.filter = 'none';
                retryButton.style.pointerEvents = 'auto';
                retryButton.style.cursor = 'pointer';
                
                // Don't add a click handler here - let the normal purchase flow happen
                // The tutorial will advance when the purchase is confirmed in AssetsScreen
                console.log('Silver chain button highlighted and ready for purchase');
              } else {
                // If still not found, try again after a longer delay
                setTimeout(() => {
                  console.log('Second retry to find silver chain button');
                  const secondRetryButton = document.getElementById('silver-chain-purchase');
                  if (secondRetryButton) {
                    console.log('Found silver chain button on second retry!');
                    secondRetryButton.classList.add('tutorial-highlight');
                    secondRetryButton.style.zIndex = '10001'; // Higher than overlay
                    secondRetryButton.style.position = 'relative';
                    secondRetryButton.style.transform = 'scale(1.01)';
                    secondRetryButton.style.boxShadow = '0 2px 8px rgba(255, 170, 0, 0.2)';
                    secondRetryButton.style.border = '2px solid #ffaa00';
                    secondRetryButton.style.borderRadius = '8px';
                    secondRetryButton.style.filter = 'none';
                    secondRetryButton.style.pointerEvents = 'auto';
                    secondRetryButton.style.cursor = 'pointer';
                    
                    // Don't add a click handler here - let the normal purchase flow happen
                    // The tutorial will advance when the purchase is confirmed in AssetsScreen
                    console.log('Silver chain button highlighted and ready for purchase (second retry)');
                  }
                }, 1000);
              }
            }, 500);
          }
          
          // Debug: Check if the button exists in the DOM
          const silverChainButtonDebug = document.getElementById('silver-chain-purchase');
          console.log('Silver chain button found by ID:', silverChainButtonDebug);
          
          // Debug: Check all purchase buttons and their data attributes
          const allPurchaseButtons = document.querySelectorAll('button[data-item-name]');
          console.log('All purchase buttons with data attributes:', Array.from(allPurchaseButtons).map(btn => ({
            id: btn.id,
            name: (btn as HTMLElement).dataset.itemName,
            itemId: (btn as HTMLElement).dataset.itemId,
            text: btn.textContent?.trim()
          })));
          
          // Debug: Check current active tab
          const activeTab = document.querySelector('.tab-btn.active');
          console.log('Active tab:', activeTab?.textContent?.trim());
          
          // Debug: Check if jewelry tab content is visible
          const jewelryTabContent = document.querySelector('#assetTabContent');
          console.log('Asset tab content:', jewelryTabContent?.innerHTML?.substring(0, 200));
          
          // Debug: Check for any active modals that might be blocking
          const activeModals = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
          console.log('Active modals found:', activeModals.length);
          activeModals.forEach((modal, index) => {
            console.log(`Modal ${index}:`, modal);
            console.log(`Modal z-index:`, (modal as HTMLElement).style.zIndex);
            console.log(`Modal display:`, (modal as HTMLElement).style.display);
          });
          if (silverChainButtonDebug) {
            console.log('Silver chain button text:', silverChainButtonDebug.textContent);
            console.log('Silver chain button classes:', silverChainButtonDebug.className);
          } else {
            console.log('Silver chain button NOT found by ID');
            // Try to find it by text content
            const allButtons = document.querySelectorAll('button');
            console.log('All buttons on page:', Array.from(allButtons).map(btn => ({
              id: btn.id,
              text: btn.textContent?.trim(),
              className: btn.className
            })));
            
            // Try to find the silver chain button by text content or data attributes
            const silverChainByText = Array.from(allButtons).find(btn => 
              btn.textContent?.includes('Purchase') && 
              (btn.closest('.market-item')?.querySelector('.drug-name')?.textContent?.includes('Silver Chain') ||
               (btn as HTMLElement).dataset.itemName === 'Silver Chain' ||
               (btn as HTMLElement).dataset.tutorialTarget === 'silver-chain-purchase')
            );
            
            if (silverChainByText) {
              console.log('Found silver chain button by text:', silverChainByText);
              // Highlight this button instead
              silverChainByText.classList.add('tutorial-highlight');
              silverChainByText.style.zIndex = '1007';
              silverChainByText.style.position = 'relative';
              silverChainByText.style.transform = 'scale(1.01)';
              silverChainByText.style.boxShadow = '0 2px 8px rgba(255, 170, 0, 0.2)';
              silverChainByText.style.border = '2px solid #ffaa00';
              silverChainByText.style.borderRadius = '8px';
              silverChainByText.style.filter = 'none';
              silverChainByText.style.pointerEvents = 'auto';
              silverChainByText.style.cursor = 'pointer';
              
              // Don't add a click handler here - let the normal purchase flow happen
              // The tutorial will advance when the purchase is confirmed in AssetsScreen
              console.log('Silver chain button highlighted and ready for purchase (found by text)');
              return; // Skip the rest of the highlighting logic
            }
          }
          
          // Make the silver chain purchase button prominent and clickable with orange highlighting
          targetElement.style.zIndex = '10001'; // Higher than overlay
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(255, 170, 0, 0.2)';
          targetElement.style.border = '2px solid #ffaa00';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';
          
          // Force all children to be clickable
          const children = targetElement.querySelectorAll('*');
          children.forEach(child => {
            if (child instanceof HTMLElement) {
              child.style.pointerEvents = 'auto';
              child.style.cursor = 'pointer';
            }
          });
          
          // Create a transparent cutout around the button
          if (overlayRef.current) {
            const rect = targetElement.getBoundingClientRect();
            const overlay = overlayRef.current;
            
            console.log('Creating cutout for silver chain purchase button at:', rect);
            
            // Create a much larger transparent area to ensure the button is clickable
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 4; // Much larger cutout
            
            overlay.style.background = `
              radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0%, transparent 90%, rgba(0,0,0,0.1) 95%, rgba(0,0,0,0.55) 100%)
            `;
            
            // Make the overlay non-blocking for clicks near the button
            overlay.style.pointerEvents = 'none';
          }
          
          // Add a simple test click handler to verify the button is clickable
          const testClick = (e: Event) => {
            console.log('TEST: Silver chain button clicked during tutorial');
            console.log('Event target:', e.target);
            console.log('Event currentTarget:', e.currentTarget);
            // Don't prevent default or stop propagation - let the normal flow happen
          };
          
          targetElement.addEventListener('click', testClick);
          (targetElement as any)._tutorialTestClickHandler = testClick;
          
          console.log('Silver chain button highlighted and ready for purchase');
          
          // Don't add fallback click handlers - let the normal purchase flow happen
          // The tutorial will advance when the purchase is confirmed in AssetsScreen
          console.log('Silver chain button ready for normal purchase flow');
          
          // Add a click handler to the overlay that allows clicks to pass through to the button
          if (overlayRef.current) {
            const handleOverlayClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              console.log('Overlay clicked, target:', target);
              
              // Check if click is near the silver chain purchase button
              const buttonRect = targetElement.getBoundingClientRect();
              const clickX = e.clientX;
              const clickY = e.clientY;
              
              const distance = Math.sqrt(
                Math.pow(clickX - (buttonRect.left + buttonRect.width / 2), 2) +
                Math.pow(clickY - (buttonRect.top + buttonRect.height / 2), 2)
              );
              
              console.log('Click distance from silver chain purchase button center:', distance);
              console.log('Silver chain purchase button bounds:', buttonRect);
              console.log('Click position:', { x: clickX, y: clickY });
              
              if (distance < Math.max(buttonRect.width, buttonRect.height) * 3) {
                // Click is near the button, trigger the button click
                console.log('Overlay click near silver chain purchase button, triggering button click');
                targetElement.click();
              }
            };
            
            overlayRef.current.addEventListener('click', handleOverlayClick);
            (overlayRef.current as any)._tutorialOverlayClickHandler = handleOverlayClick;
          }
          
          console.log('Overlay ready with click-through handler');
          
          console.log('Silver chain purchase button setup complete');
          
          // Ensure jewelry tab is active
          const jewelryTabForActive = document.getElementById('jewelry-tab');
          if (jewelryTabForActive && !jewelryTabForActive.classList.contains('active')) {
            console.log('Forcing jewelry tab to be active');
            jewelryTabForActive.click();
            
            // Wait a bit for the DOM to update, then try to find the button again
            setTimeout(() => {
              console.log('Retrying to find silver chain button after tab activation');
              const retryButton = document.getElementById('silver-chain-purchase');
              if (retryButton) {
                console.log('Found silver chain button on retry!');
                retryButton.classList.add('tutorial-highlight');
                retryButton.style.zIndex = '1007';
                retryButton.style.position = 'relative';
                retryButton.style.transform = 'scale(1.01)';
                retryButton.style.boxShadow = '0 2px 8px rgba(255, 170, 0, 0.2)';
                retryButton.style.border = '2px solid #ffaa00';
                retryButton.style.borderRadius = '8px';
                retryButton.style.filter = 'none';
                retryButton.style.pointerEvents = 'auto';
                retryButton.style.cursor = 'pointer';
                
                // Add click handler
                const handleClick = (e: Event) => {
                  console.log('Silver chain purchase button clicked during tutorial (retry)');
                  if (activeTutorial === 'assetsJewelryTutorial' && stepIndex === 1) {
                    console.log('Advancing tutorial from silver chain purchase button click (retry)');
                    nextStep();
                  }
                };
                retryButton.addEventListener('click', handleClick);
                (retryButton as any)._tutorialClickHandler = handleClick;
              }
            }, 500);
          }
          
          // Don't auto-advance - let the user complete the purchase flow
          // The tutorial will advance when the purchase is confirmed in AssetsScreen
          console.log('Silver chain tutorial ready - waiting for purchase confirmation');
        } else if (activeTutorial === 'assetsJewelryTutorial' && stepIndex === 2 && step.highlightElement === 'wear-jewelry-button') {
          console.log('Special handling for wear jewelry button (step 2)');
          
          // Ensure jewelry tab is not highlighted during wear step
          const jewelryTab = document.getElementById('jewelry-tab');
          if (jewelryTab) {
            jewelryTab.classList.remove('tutorial-highlight');
            jewelryTab.style.zIndex = '';
            jewelryTab.style.position = '';
            jewelryTab.style.transform = '';
            jewelryTab.style.boxShadow = '';
            jewelryTab.style.border = '';
            jewelryTab.style.filter = '';
            jewelryTab.style.pointerEvents = '';
            jewelryTab.style.cursor = '';
          }
          
          // Make the wear jewelry button prominent and clickable
          targetElement.style.zIndex = '10001'; // Higher than overlay
          targetElement.style.position = 'relative';
          targetElement.style.transform = 'scale(1.01)';
          targetElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '8px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          targetElement.style.cursor = 'pointer';
          
          // Force all children to be clickable
          const children = targetElement.querySelectorAll('*');
          children.forEach(child => {
            if (child instanceof HTMLElement) {
              child.style.pointerEvents = 'auto';
              child.style.cursor = 'pointer';
            }
          });
          
          // Create a transparent cutout around the button
          if (overlayRef.current) {
            const rect = targetElement.getBoundingClientRect();
            const overlay = overlayRef.current;
            
            console.log('Creating cutout for wear jewelry button at:', rect);
            
            // Create a transparent area around the button
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 2;
            
            overlay.style.background = `
              radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0%, transparent 70%, rgba(0,0,0,0.2) 85%, rgba(0,0,0,0.55) 100%)
            `;
          }
          
          // Add a click handler to the overlay that allows clicks to pass through to the button
          if (overlayRef.current) {
            const handleOverlayClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              console.log('Overlay clicked, target:', target);
              
              // Check if click is near the wear jewelry button
              const buttonRect = targetElement.getBoundingClientRect();
              const clickX = e.clientX;
              const clickY = e.clientY;
              
              const distance = Math.sqrt(
                Math.pow(clickX - (buttonRect.left + buttonRect.width / 2), 2) +
                Math.pow(clickY - (buttonRect.top + buttonRect.height / 2), 2)
              );
              
              console.log('Click distance from wear jewelry button center:', distance);
              console.log('Wear jewelry button bounds:', buttonRect);
              console.log('Click position:', { x: clickX, y: clickY });
              
              if (distance < Math.max(buttonRect.width, buttonRect.height) * 3) {
                // Click is near the button, trigger the button click
                console.log('Overlay click near wear jewelry button, triggering button click');
                targetElement.click();
              }
            };
            
            overlayRef.current.addEventListener('click', handleOverlayClick);
            (overlayRef.current as any)._tutorialOverlayClickHandler = handleOverlayClick;
          }
          
          console.log('Wear jewelry button ready with click-through handler');
        } else {
          console.log('Standard highlighting for element:', step.highlightElement);
          // Standard highlighting for other elements (minimal glow, contained effect)
          targetElement.style.zIndex = '1005';
          targetElement.style.position = 'relative';
          targetElement.style.boxShadow = '0 2px 6px rgba(102, 255, 102, 0.15)';
          targetElement.style.border = '2px solid #66ff66';
          targetElement.style.borderRadius = '6px';
          targetElement.style.filter = 'none';
          targetElement.style.pointerEvents = 'auto';
          
          const children = targetElement.querySelectorAll('*');
          children.forEach(child => {
            if (child instanceof HTMLElement) {
              child.style.pointerEvents = 'auto';
            }
          });
          
          // Create a transparent cutout around the highlighted element
          if (overlayRef.current) {
            const rect = targetElement.getBoundingClientRect();
            const overlay = overlayRef.current;
            
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = Math.max(rect.width, rect.height) * 1.5;
            
            overlay.style.background = `
              radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0%, transparent 60%, rgba(0,0,0,0.2) 80%, rgba(0,0,0,0.55) 100%)
            `;
          }
        }
        
        // Scroll the element into view if needed
        setTimeout(() => {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }, 100);
      } else {
        console.log('Target element not found for ID:', step.highlightElement);
        console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        
        // Debug: Check if the silver chain purchase button exists at all
        const allButtons = document.querySelectorAll('button');
        console.log('All buttons on page:', Array.from(allButtons).map(btn => ({
          id: btn.id,
          text: btn.textContent?.trim(),
          className: btn.className,
          dataName: (btn as HTMLElement).dataset.itemName,
          dataId: (btn as HTMLElement).dataset.itemId
        })));
        
        // Debug: Check if jewelry tab content is rendered
        const jewelryContent = document.querySelector('#assetTabContent');
        console.log('Asset tab content HTML:', jewelryContent?.innerHTML?.substring(0, 500));
        
        // Special debugging for trading button
        if (step.highlightElement === 'trading-button') {
          console.log('=== TRADING BUTTON DEBUG ===');
          console.log('Current URL/path:', window.location.pathname);
          console.log('All buttons on page:', Array.from(document.querySelectorAll('button')).map(btn => ({
            id: btn.id,
            text: btn.textContent?.trim(),
            className: btn.className
          })));
          console.log('All elements with "trading" in ID:', Array.from(document.querySelectorAll('[id*="trading"]')).map(el => el.id));
          console.log('All elements with "Trading" in text:', Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent?.includes('Trading')
          ).map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textContent?.trim()
          })));
          
          // Additional debugging for app grid
          const appGrid = document.querySelector('.app-grid');
          if (appGrid) {
            console.log('App grid found:', appGrid);
            console.log('App grid children:', Array.from(appGrid.children).map(child => ({
              tagName: child.tagName,
              id: child.id,
              className: child.className,
              text: child.textContent?.trim()
            })));
          } else {
            console.log('App grid not found');
          }
          
          // Try to find the trading button with a delay (for timing issues)
          setTimeout(() => {
            const retryElement = document.getElementById('trading-button');
            if (retryElement) {
              console.log('Trading button found on retry!');
              retryElement.classList.add('tutorial-highlight');
              retryElement.style.zIndex = '1007';
              retryElement.style.position = 'relative';
              retryElement.style.transform = 'scale(1.01)';
              retryElement.style.boxShadow = '0 2px 8px rgba(102, 255, 102, 0.2)';
              retryElement.style.border = '2px solid #66ff66';
              retryElement.style.borderRadius = '8px';
              retryElement.style.filter = 'none';
              retryElement.style.pointerEvents = 'auto';
              retryElement.style.cursor = 'pointer';
              
              // Add click handler
              const handleClick = (e: Event) => {
                e.stopPropagation();
                console.log('Trading button clicked during tutorial (retry)');
                nextStep();
              };
              retryElement.addEventListener('click', handleClick);
              (retryElement as any)._tutorialClickHandler = handleClick;
            }
          }, 500);
        }
      }

      // Handle special highlighting for weed entry
      if (step.specialHighlight === 'weed-entry') {
        const weedEntry = document.getElementById('weed-entry');
        if (weedEntry) {
          weedEntry.classList.add('tutorial-highlight');
                  weedEntry.style.zIndex = '1005';
        weedEntry.style.position = 'relative';
        weedEntry.style.boxShadow = '0 2px 6px rgba(102, 255, 102, 0.15)';
        weedEntry.style.border = '2px solid #66ff66';
        weedEntry.style.borderRadius = '6px';
        weedEntry.style.filter = 'none';
        weedEntry.style.pointerEvents = 'auto';
        }
      }
    }

    return () => {
      // Clean up highlights when component unmounts
      const highlights = document.querySelectorAll('.tutorial-highlight');
      highlights.forEach(el => {
        el.classList.remove('tutorial-highlight');
        
        // Remove tutorial click handler if it exists
        if ((el as any)._tutorialClickHandler) {
          el.removeEventListener('click', (el as any)._tutorialClickHandler);
          delete (el as any)._tutorialClickHandler;
        }
        
        // Remove direct click handler if it exists
        if ((el as any)._tutorialDirectClickHandler) {
          el.removeEventListener('click', (el as any)._tutorialDirectClickHandler);
          delete (el as any)._tutorialDirectClickHandler;
        }
        
        // Clear timeout if it exists
        if ((el as any)._tutorialTimeoutId) {
          clearTimeout((el as any)._tutorialTimeoutId);
          delete (el as any)._tutorialTimeoutId;
        }
        
        // Reset z-index for all highlighted elements
        el.style.zIndex = '';
        el.style.position = '';
        el.style.filter = '';
        el.style.pointerEvents = '';
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.border = '';
        el.style.cursor = '';
        
        // Reset pointer events for children
        const children = el.querySelectorAll('*');
        children.forEach(child => {
          if (child instanceof HTMLElement) {
            child.style.pointerEvents = '';
            child.style.cursor = '';
          }
        });
      });
      
      // Clean up overlay click handler
      if (overlayRef.current && (overlayRef.current as any)._tutorialOverlayClickHandler) {
        overlayRef.current.removeEventListener('click', (overlayRef.current as any)._tutorialOverlayClickHandler);
        delete (overlayRef.current as any)._tutorialOverlayClickHandler;
      }
      
      // Reset overlay background and pointer events
      if (overlayRef.current) {
        overlayRef.current.style.background = 'rgba(0,0,0,0.55)';
        overlayRef.current.style.pointerEvents = 'auto';
      }
    };
  }, [activeTutorial, stepIndex, tutorialSteps, nextStep]);

  // Early return after all hooks are called
  if (!activeTutorial) return null;
  const step = tutorialSteps[activeTutorial][stepIndex];
  if (!step) return null;

  // Only show "Skip Entire Tutorial" button for the first step of gettingStarted tutorial
  const isGettingStarted = activeTutorial === 'gettingStarted';
  const isFirstStep = stepIndex === 0;
  const requiresClick = step.requireClick;
  const noButtons = step.noButtons;
  const showSkipEntireTutorial = isGettingStarted && isFirstStep;

  // Support custom skipButton/nextButton/okButton for any tutorial step
  const showCustomSkip = step.skipButton;
  const showCustomNext = step.nextButton;
  const showOkButton = step.okButton;

  const handleNextClick = () => {
    nextStep();
  };

  const handleSkipClick = () => {
    skipTutorial();
  };

  return (
    <div ref={overlayRef} style={overlayStyle} className="tutorial-overlay">
      <div style={boxStyle}>
        <div style={messageStyle}>{step.message}</div>
        {/* Show Next/Skip/OK for custom steps or default for gettingStarted */}
        {((!requiresClick && !noButtons) || showCustomNext || showCustomSkip || showOkButton) && (
          <div style={buttonRowStyle}>
            {showOkButton && (
              <button 
                style={{ ...buttonStyle, background: '#66ff66', color: '#222' }} 
                onClick={handleNextClick}
              >
                OK
              </button>
            )}
            {(showCustomNext || (!requiresClick && !noButtons)) && !showOkButton && (
              <button 
                style={{ ...buttonStyle, background: '#66ff66', color: '#222' }} 
                onClick={handleNextClick}
              >
                Next
              </button>
            )}
            {(showCustomSkip || showSkipEntireTutorial) && (
              <button 
                style={{ ...buttonStyle, background: '#ff6666', color: '#fff' }} 
                onClick={handleSkipClick}
              >
                Skip Tutorial
              </button>
            )}
          </div>
        )}
        {requiresClick && !noButtons && (
          <div style={{ fontSize: '14px', color: '#aaa', fontStyle: 'italic' }}>
            Click the highlighted button to continue
          </div>
        )}
        {noButtons && (
          <div style={{ fontSize: '14px', color: '#aaa', fontStyle: 'italic' }}>
            Click the highlighted button to continue
          </div>
        )}
      </div>
    </div>
  );
} 