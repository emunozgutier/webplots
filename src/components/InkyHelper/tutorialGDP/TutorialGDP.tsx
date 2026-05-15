import React, { useState } from 'react';
import './TutorialGDP.css';
import { useWorkspaceStore, workspaceRegistry } from '../../../store/Workspace/useWorkspaceStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import InkyHelper from '../InkyHelper';
import SpeechBubble from '../animation/components/SpeechBubble';
import { gdpTutorialSteps } from './tutorialScript';

const TutorialGDP: React.FC = () => {
  const { isDebugMode, activeWorkspaceId, isTutorialActive, setIsTutorialActive } = useWorkspaceStore();
  const hasData = useCsvDataStore((state) => state.data.length > 0);

  const [position, setPosition] = useState({ x: window.innerWidth - 240, y: window.innerHeight - 140 });
  const [bubblePos, setBubblePos] = useState({ x: window.innerWidth - 240, y: window.innerHeight - 140 });
  const [target, setTarget] = useState({ x: window.innerWidth - 240, y: window.innerHeight - 140 });
  const [rotation, setRotation] = useState(0);
  const [tick, setTick] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [targetElementPos, setTargetElementPos] = useState<{ x: number, y: number } | null>(null);

  const requestRef = React.useRef<number>(0);
  const posRef = React.useRef(position);
  const bubblePosRef = React.useRef(bubblePos);
  const targetRef = React.useRef(target);
  const rotRef = React.useRef(rotation);
  const dragStartRef = React.useRef({ startX: 0, startY: 0, squidStartX: 0, squidStartY: 0 });

  React.useEffect(() => {
    const updatePosition = () => {
      setTick(Date.now());
      const currentPos = posRef.current;
      const currentTarget = targetRef.current;

      const dx = currentTarget.x - currentPos.x;
      const dy = currentTarget.y - currentPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const margin = 50; // Smaller margin so he gets close enough

      if (!isDragging) {
        if (distance > margin) {
          // Speed
          const speed = 4;
          const vx = (dx / distance) * speed;
          const vy = (dy / distance) * speed;

          const nextX = currentPos.x + vx;
          const nextY = currentPos.y + vy;

          posRef.current = { x: nextX, y: nextY };
          setPosition(posRef.current);

          // Calculate rotation
          const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          rotRef.current = targetAngle;
          setRotation(rotRef.current);
        } else {
          // Find the nearest upright angle (multiple of 360)
          const targetUpright = Math.round(rotRef.current / 360) * 360;
          
          if (Math.abs(rotRef.current - targetUpright) > 0.5) {
            // Slowly interpolate towards the upright position
            rotRef.current = rotRef.current + (targetUpright - rotRef.current) * 0.05;
            setRotation(rotRef.current);
          } else if (rotRef.current !== targetUpright) {
            rotRef.current = targetUpright;
            setRotation(targetUpright);
          }
        }
      }

      // Smooth lerp for the speech bubble so it doesn't move too fast
      bubblePosRef.current = {
        x: bubblePosRef.current.x + (posRef.current.x - bubblePosRef.current.x) * 0.05,
        y: bubblePosRef.current.y + (posRef.current.y - bubblePosRef.current.y) * 0.05
      };
      setBubblePos(bubblePosRef.current);

      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      squidStartX: position.x,
      squidStartY: position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      
      let newX = dragStartRef.current.squidStartX + dx;
      let newY = dragStartRef.current.squidStartY + dy;
      
      // Clamp values so Inky doesn't go off-screen (Inky is 100x120)
      newX = Math.max(0, Math.min(newX, window.innerWidth - 100));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 120));
      
      setPosition({ x: newX, y: newY });
      setTarget({ x: newX, y: newY });
      posRef.current = { x: newX, y: newY };
      targetRef.current = { x: newX, y: newY };
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

  React.useEffect(() => {
    const currentStep = gdpTutorialSteps[currentStepIndex];
    
    if (!isDragging) {
      const interval = setInterval(() => {
        const selector = currentStep.dynamicTargetSelector ? currentStep.dynamicTargetSelector() : currentStep.targetSelector;
        if (!selector) return;
        
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Target slightly offset so the tentacles can point (to the right of the element)
          let targetX = rect.right + 80;
          let targetY = rect.top + 10;
          
          // Clamp so it stays on screen
          targetX = Math.max(0, Math.min(targetX, window.innerWidth - 100));
          targetY = Math.max(0, Math.min(targetY, window.innerHeight - 120));
          
          // Only update target if it moved significantly
          const currentT = targetRef.current;
          if (Math.abs(currentT.x - targetX) > 5 || Math.abs(currentT.y - targetY) > 5) {
            setTarget({ x: targetX, y: targetY });
            targetRef.current = { x: targetX, y: targetY };
            setTargetElementPos({ x: rect.left + rect.width / 2, y: rect.bottom });
          }
        }
      }, 200); // Check every 200ms

      return () => clearInterval(interval);
    }
  }, [currentStepIndex, isDragging]);

  if (!isDebugMode || !isTutorialActive) return null;

  // Calculate placement based on screen coordinates
  const inkyX = position.x;
  const inkyY = position.y;
  
  let placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-left';
  if (inkyY < 250) {
    placement = inkyX < 350 ? 'bottom-right' : 'bottom-left';
  } else {
    placement = inkyX < 350 ? 'top-right' : 'top-left';
  }

  // Calculate tentacle path based on target element position
  const dxTarget = target.x - position.x;
  const dyTarget = target.y - position.y;
  const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
  const margin = 50;
  // If we arrived at the margin and we aren't dragging it, we point at the target element
  const isPointing = !isDragging && distToTarget <= margin + 5 && targetElementPos !== null; 

  let leftTentaclePath = "M 25,65 Q 0,80 15,110";
  let leftTentacleClubRot = 0;
  let leftTentacleClubX = 15;
  let leftTentacleClubY = 115;
  let isReachingLeft = false;

  let rightTentaclePath = "M 75,65 Q 100,80 85,110";
  let rightTentacleClubRot = 0;
  let rightTentacleClubX = 85;
  let rightTentacleClubY = 115;
  let isReachingRight = false;

  if (isPointing && targetElementPos) {
    const pointDistX = targetElementPos.x - position.x;
    const pointDistY = targetElementPos.y - position.y;
    const baseAngle = Math.atan2(pointDistY, pointDistX);
    // Oscillate the distance (poking motion)
    const wiggleDistance = Math.sin(tick / 150) * 15; 
    
    // Stretch to the element
    const distToElement = Math.sqrt(pointDistX * pointDistX + pointDistY * pointDistY);
    const pointLength = Math.min(distToElement - 25 + wiggleDistance, 200); // cap length
    
    const gx = position.x + Math.cos(baseAngle) * pointLength;
    const gy = position.y + Math.sin(baseAngle) * pointLength;

    const dxTip = gx - position.x;
    const dyTip = gy - position.y;

    // Invert the squid's rotation to map global vector to local SVG coordinates
    const rad = -(rotation * Math.PI) / 180;
    const lx = dxTip * Math.cos(rad) - dyTip * Math.sin(rad) + 50; 
    const ly = dxTip * Math.sin(rad) + dyTip * Math.cos(rad) + 60; 
    
    if (lx < 50) {
      isReachingLeft = true;
      const startX = 25;
      const startY = 65;
      const angleRad = Math.atan2(ly - startY, lx - startX);
      
      leftTentacleClubX = lx - Math.cos(angleRad) * 9;
      leftTentacleClubY = ly - Math.sin(angleRad) * 9;
      
      const endX = lx - Math.cos(angleRad) * 18;
      const endY = ly - Math.sin(angleRad) * 18;

      const mx = (startX + endX) / 2 - 50; 
      const my = (startY + endY) / 2;

      leftTentaclePath = `M ${startX},${startY} Q ${mx},${my} ${endX},${endY}`;
      leftTentacleClubRot = angleRad * (180 / Math.PI) - 90;
    } else {
      isReachingRight = true;
      const startX = 75;
      const startY = 65;
      const angleRad = Math.atan2(ly - startY, lx - startX);
      
      rightTentacleClubX = lx - Math.cos(angleRad) * 9;
      rightTentacleClubY = ly - Math.sin(angleRad) * 9;
      
      const endX = lx - Math.cos(angleRad) * 18;
      const endY = ly - Math.sin(angleRad) * 18;

      const mx = (startX + endX) / 2 + 50; 
      const my = (startY + endY) / 2;

      rightTentaclePath = `M ${startX},${startY} Q ${mx},${my} ${endX},${endY}`;
      rightTentacleClubRot = angleRad * (180 / Math.PI) - 90;
    }
  }

  const isMoving = !isDragging && distToTarget > margin + 5;
  const currentText = isMoving ? "Follow me" : gdpTutorialSteps[currentStepIndex].text;

  return (
    <>
      <div style={{ 
        position: 'fixed', 
        zIndex: 1040, 
        left: 0, 
        top: 0, 
        transform: `translate(${bubblePos.x - 50}px, ${bubblePos.y - 60}px)`, 
        pointerEvents: 'none', 
        width: 100, 
        height: 120 
      }}>
        <SpeechBubble 
          placement={placement}
          text={currentText}
          type="persistent"
          instant={isMoving}
          onSkip={handleSkip}
          onNext={handleNext}
          nextLabel={currentStepIndex === gdpTutorialSteps.length - 1 ? "Finish" : "Next ➔"}
          canGoNext={(() => {
            const currentStep = gdpTutorialSteps[currentStepIndex];
            const isDataMissing = currentStep.requireDataLoaded && !hasData;
            let isCustomCheckMissing = false;
            if (currentStep.requirementCheck) {
              const stores = workspaceRegistry.get(activeWorkspaceId);
              if (stores) isCustomCheckMissing = !currentStep.requirementCheck(stores);
            }
            return !isDataMissing && !isCustomCheckMissing;
          })()}
          customFooter={!isMoving && gdpTutorialSteps[currentStepIndex].choices ? (
            <div className="inky-speech-buttons" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {gdpTutorialSteps[currentStepIndex].choices!.map((choice, i) => (
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
          ) : undefined}
        />
      </div>

      <div 
        className={`tutorial-gdp-container ${isDragging ? 'dragging' : ''}`}
        title="Drag to move, click Next for tips"
        style={{ 
          left: 0,
          top: 0,
          transform: `translate(${position.x - 50}px, ${position.y - 60}px)`
        }}
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
            left: placement === 'top-right' ? 0 : 'auto', 
            right: placement === 'top-right' ? 'auto' : 0, 
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
        <div style={{ transform: `rotate(${rotation}deg)` }}>
          <InkyHelper 
            className="tutorial-gdp-wrapper"
            bodyProps={{
          leftTentacle: {
            path: leftTentaclePath,
            clubX: leftTentacleClubX,
            clubY: leftTentacleClubY,
            clubRot: leftTentacleClubRot,
            isReaching: isReachingLeft
          },
          rightTentacle: {
            path: rightTentaclePath,
            clubX: rightTentacleClubX,
            clubY: rightTentacleClubY,
            clubRot: rightTentacleClubRot,
            isReaching: isReachingRight
          },
          tentacleClass: "tutorial-gdp-tentacle",
          eyeClass: "tutorial-gdp-eye",
          svgClassName: "tutorial-gdp-svg",
          svgStyle: { overflow: 'visible', filter: 'drop-shadow(0px 10px 15px rgba(0, 0, 0, 0.2))' }
        }}
      />
        </div>
      </div>
    </>
  );
};

export default TutorialGDP;
