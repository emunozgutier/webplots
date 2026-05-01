import React, { useState } from 'react';
import './TutorialGDP.css';
import { useWorkspaceStore, workspaceRegistry } from '../../../store/Workspace/useWorkspaceStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import Eyes from '../animation/components/eyes';

interface TutorialStep {
  text: string;
  action?: (stores: any) => void;
}

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
      
      // Clamp values so it doesn't go off-screen
      // Container width is roughly 250px including the bubble, height is about 150px
      newRight = Math.max(0, Math.min(newRight, window.innerWidth - 250));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - 150));
      
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

  const steps: TutorialStep[] = [
    {
      text: "Welcome to the GDP plotting tutorial! First, please load your dataset using the File or Test menu. (The Next button will enable once data is loaded).",
    },
    {
      text: "First, we set the axes. X-axis is 'gdpPercap' (with Log scale!) and Y-axis is 'lifeExp'.",
      action: (stores) => {
        stores.axisSideMenuStore.getState().setXAxis('gdpPercap');
        stores.axisSideMenuStore.getState().addYAxisColumn('lifeExp');
        stores.plotLayoutStore.getState().setEnableLogXAxis(true);
      }
    },
    {
      text: "Let's color the bubbles by 'continent'. Notice how the Style side menu updates!",
      action: (stores) => {
        stores.styleSideMenuStore.getState().setHue({ source: 'column', value: 'continent', enabled: true });
      }
    },
    {
      text: "We map the size of the bubbles to the 'pop' (Population) column.",
      action: (stores) => {
        stores.styleSideMenuStore.getState().setSize({ source: 'column', value: 'pop', enabled: true, sizeMode: 'area' });
      }
    },
    {
      text: "Now, let's animate over time by setting the animation column to 'year'.",
      action: (stores) => {
        stores.animationSideMenuStore.getState().setAnimationColumn('year');
      }
    },
    {
      text: "The Plot Area above shows the chart. Below is the Data Table & Stats, which dynamically update with the animation!",
    },
    {
      text: "You're all set! Press Play on the Animation menu on the left and enjoy exploring the data!",
    }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStepIndex === 0 && !hasData) return; // Prevent next if no data

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      const nextStep = steps[nextIndex];
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
      <div className="tutorial-gdp-bubble" onPointerDown={(e) => e.stopPropagation()}>
        <button className="tutorial-gdp-close" onClick={handleSkip} title="Close tutorial">×</button>
        <div>{steps[currentStepIndex].text}</div>
        <div className="tutorial-gdp-buttons">
          <button className="tutorial-gdp-btn tutorial-gdp-btn-skip" onClick={handleSkip}>Skip</button>
          <button 
            className="tutorial-gdp-btn" 
            onClick={handleNext}
            disabled={currentStepIndex === 0 && !hasData}
          >
            {currentStepIndex === steps.length - 1 ? "Finish" : "Next ➔"}
          </button>
        </div>
      </div>
      <svg className="tutorial-gdp-svg" viewBox="-10 -10 120 150" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <g transform="translate(0, 10)">
          {/* Squid Fins - Purple */}
          <path d="M 50,-15 L 20,5 L 30,25 Z" fill="#8E24AA" />
          <path d="M 50,-15 L 80,5 L 70,25 Z" fill="#8E24AA" />

          {/* Back/Smaller tentacles */}
          <path className="tutorial-gdp-tentacle" d="M 35,75 Q 30,95 35,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />
          <path className="tutorial-gdp-tentacle" d="M 65,75 Q 70,95 65,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />

          {/* Squid Mantle & Body */}
          <path d="M 50,-15 Q 35,5 25,40 C 15,60 15,75 25,80 C 35,85 65,85 75,80 C 85,75 85,60 75,40 Q 65,5 50,-15 Z" fill="#9C27B0" />

          {/* Left Feeding Tentacle (Club) */}
          <g className="tutorial-gdp-tentacle">
            <path d="M 25,65 Q 0,80 15,110" fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="15" cy="115" rx="5" ry="9" fill="#9C27B0" />
          </g>
          
          {/* Right Feeding Tentacle (Club) */}
          <g className="tutorial-gdp-tentacle">
            <path d="M 75,65 Q 100,80 85,110" fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="85" cy="115" rx="5" ry="9" fill="#9C27B0" />
          </g>

          {/* Front tentacles */}
          <path className="tutorial-gdp-tentacle" d="M 42,78 Q 42,100 42,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />
          <path className="tutorial-gdp-tentacle" d="M 58,78 Q 58,100 58,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />

          {/* Eyes */}
          <Eyes />

          {/* Smile */}
          <path d="M 45,60 Q 50,65 55,60" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          
          {/* Cheeks */}
          <ellipse cx="25" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
          <ellipse cx="75" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

export default TutorialGDP;
