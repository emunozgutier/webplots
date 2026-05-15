import React, { useState } from 'react';
import './TutorialGDP.css';
import { useWorkspaceStore, workspaceRegistry } from '../../../store/Workspace/useWorkspaceStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import InkyHelper from '../InkyHelper';
import { gdpTutorialSteps } from './tutorialScript';

const TutorialGDP: React.FC = () => {
  const { isDebugMode, activeWorkspaceId, isTutorialActive, setIsTutorialActive } = useWorkspaceStore();
  const hasData = useCsvDataStore((state) => state.data.length > 0);

  const [position, setPosition] = useState({ right: 140, bottom: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0, right: 0, bottom: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      right: position.right,
      bottom: position.bottom
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      let newRight = dragStartRef.current.right - dx;
      let newBottom = dragStartRef.current.bottom - dy;
      
      // Clamp values so Inky doesn't go off-screen (Inky is 100x120)
      newRight = Math.max(0, Math.min(newRight, window.innerWidth - 100));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - 120));
      
      setPosition({
        right: newRight,
        bottom: newBottom
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const currentStep = gdpTutorialSteps[currentStepIndex];
    if (currentStep.requireDataLoaded && !hasData) return;
    if (currentStep.requirementCheck) {
      const stores = workspaceRegistry.get(activeWorkspaceId);
      if (stores && !currentStep.requirementCheck(stores)) return;
    }

    if (currentStepIndex < gdpTutorialSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      const nextStep = gdpTutorialSteps[nextIndex];
      if (nextStep.action) {
        const stores = workspaceRegistry.get(activeWorkspaceId);
        if (stores) {
          nextStep.action(stores);
        }
      }
    } else {
      setIsTutorialActive(false);
      setCurrentStepIndex(0); // reset for next time
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTutorialActive(false);
    setCurrentStepIndex(0); // reset for next time
  };

  if (!isDebugMode || !isTutorialActive) return null;

  // Calculate placement based on screen coordinates
  const inkyX = window.innerWidth - position.right - 100;
  const inkyY = window.innerHeight - position.bottom - 120;
  
  let placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left';
  if (inkyY < 250) {
    placement = inkyX < 350 ? 'bottom-right' : 'bottom-left';
  } else {
    placement = inkyX < 350 ? 'top-right' : 'top-left';
  }

  return (
    <div 
      className="tutorial-gdp-container" 
      title="Drag to move, click Next for tips"
      style={{ right: `${position.right}px`, bottom: `${position.bottom}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setIsTutorialActive(false); }} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 'auto', 
          left: placement.includes('right') ? 0 : 'auto', 
          right: placement.includes('right') ? 'auto' : 0, 
          pointerEvents: 'auto', 
          background: 'rgba(255,255,255,0.8)', 
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          color: '#666', 
          border: '1px solid rgba(0,0,0,0.1)', 
          borderRadius: '50%', 
          width: 24, 
          height: 24, 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          fontWeight: 'bold', 
          fontSize: '16px', 
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          padding: 0,
          transition: 'all 0.2s ease',
          zIndex: 102
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ffebee';
          e.currentTarget.style.color = '#f44336';
          e.currentTarget.style.borderColor = '#ffcdd2';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
          e.currentTarget.style.color = '#666';
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Close Inky"
      >
        ×
      </button>
      <InkyHelper 
        className="tutorial-gdp-wrapper"
        speechProps={{
          placement,
          text: gdpTutorialSteps[currentStepIndex].text,
          type: "persistent",
          onSkip: handleSkip,
          onNext: handleNext,
          nextLabel: currentStepIndex === gdpTutorialSteps.length - 1 ? "Finish" : "Next ➔",
          canGoNext: (() => {
            const currentStep = gdpTutorialSteps[currentStepIndex];
            const isDataMissing = currentStep.requireDataLoaded && !hasData;
            let isCustomCheckMissing = false;
            if (currentStep.requirementCheck) {
              const stores = workspaceRegistry.get(activeWorkspaceId);
              if (stores) isCustomCheckMissing = !currentStep.requirementCheck(stores);
            }
            return !isDataMissing && !isCustomCheckMissing;
          })(),
          customFooter: gdpTutorialSteps[currentStepIndex].choices ? (
            <div className="inky-speech-buttons" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {gdpTutorialSteps[currentStepIndex].choices.map((choice, i) => (
                <button 
                  key={i}
                  className={`inky-speech-btn ${choice.primary ? '' : 'inky-speech-btn-skip'}`}
                  onClick={(e) => {
                    if (choice.actionType === 'next') handleNext(e);
                    else if (choice.actionType === 'skip') handleSkip(e);
                  }}
                  style={{
                    flex: 1,
                    background: choice.primary ? '#9C27B0' : 'transparent',
                    color: choice.primary ? 'white' : '#666',
                    border: choice.primary ? 'none' : '1px solid #ccc',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : undefined
        }}
        bodyProps={{
          tentacleClass: "tutorial-gdp-tentacle",
          eyeClass: "tutorial-gdp-eye",
          svgClassName: "tutorial-gdp-svg",
          svgStyle: { overflow: 'visible', filter: 'drop-shadow(0px 10px 15px rgba(0, 0, 0, 0.2))' }
        }}
      />
    </div>
  );
};

export default TutorialGDP;
