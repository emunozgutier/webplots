import React, { useState } from 'react';
import './TutorialGDP.css';
import { useWorkspaceStore, workspaceRegistry } from '../../../store/Workspace/useWorkspaceStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import InkyHelper from '../InkyHelper';
import SpeechBubble from '../animation/components/SpeechBubble';
import { gdpTutorialSteps } from './tutorialScript';
import type { CardinalDirection } from '../../../utils/DataClasses';

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
  const [placement, setPlacement] = useState<CardinalDirection>('nw');

  const requestRef = React.useRef<number>(0);
  const posRef = React.useRef(position);
  const bubblePosRef = React.useRef(bubblePos);
  const targetRef = React.useRef(target);
  const tripStartPosRef = React.useRef(position);
  const rotRef = React.useRef(rotation);
  const dragStartRef = React.useRef({ startX: 0, startY: 0, squidStartX: 0, squidStartY: 0 });
  const prevStepRef = React.useRef(-1);

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

  const handleNext = (e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
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

  // Auto-advance if the current step is waiting for data and data is loaded
  React.useEffect(() => {
    const currentStep = gdpTutorialSteps[currentStepIndex];
    if (currentStep.requireDataLoaded && hasData) {
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
      }
    }
  }, [hasData, currentStepIndex, activeWorkspaceId]);

  // Auto-advance for requirement checks
  React.useEffect(() => {
    const currentStep = gdpTutorialSteps[currentStepIndex];
    if (currentStep.requirementCheck && (currentStep as any).autoAdvance !== false) {
      const interval = setInterval(() => {
        const stores = workspaceRegistry.get(activeWorkspaceId);
        if (stores && currentStep.requirementCheck!(stores)) {
          handleNext(new Event('autoNext'));
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [currentStepIndex, activeWorkspaceId]);

  React.useEffect(() => {
    const currentStep = gdpTutorialSteps[currentStepIndex];
    
    if (!isDragging) {
      const interval = setInterval(() => {
        const selector = currentStep.dynamicTargetSelector ? currentStep.dynamicTargetSelector() : currentStep.targetSelector;
        if (!selector) {
          setTargetElementPos(null);
          return;
        }
        
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          let elementPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          
          const dist = 180;
          const directions = [
            { dir: 'n',  dx: 0, dy: -1 },
            { dir: 'nw', dx: -0.707, dy: -0.707 },
            { dir: 'w',  dx: -1, dy: 0 },
            { dir: 'sw', dx: -0.707, dy: 0.707 },
            { dir: 's',  dx: 0, dy: 1 },
            { dir: 'se', dx: 0.707, dy: 0.707 },
            { dir: 'e',  dx: 1, dy: 0 },
            { dir: 'ne', dx: 0.707, dy: -0.707 }
          ];

          let targetX = elementPos.x + dist;
          let targetY = elementPos.y;
          
          let requestedDir = currentStep.dynamicTargetPosition
            ? currentStep.dynamicTargetPosition()
            : currentStep.targetPosition;
          
          if (requestedDir && directions.some(d => d.dir === requestedDir)) {
            const d = directions.find(d => d.dir === requestedDir)!;
            const appliedDist = d.dir === 'e' ? dist * 1.5 : dist;
            targetX = elementPos.x + d.dx * appliedDist;
            targetY = elementPos.y + d.dy * appliedDist;
            
            // Point towards the center of the element to align with the octagons
          } else {
            // Find best fit on screen
            let maxScore = -Infinity;
            for (const d of directions) {
               const appliedDist = d.dir === 'e' ? dist * 1.5 : dist;
               const tx = elementPos.x + d.dx * appliedDist;
               const ty = elementPos.y + d.dy * appliedDist;
               
               const spaceX = Math.min(tx, window.innerWidth - tx);
               const spaceY = Math.min(ty, window.innerHeight - ty);
               
               if (spaceX > 50 && spaceY > 60) {
                  let score = spaceX + spaceY; 
                  // preference for right side and bottom
                  if (d.dir === 'e' || d.dir === 'se' || d.dir === 's') score += 500;
                  
                  if (score > maxScore) {
                      maxScore = score;
                      targetX = tx;
                      targetY = ty;
                  }
               }
            }
            if (maxScore === -Infinity) {
               const d = directions.find(d => d.dir === 'se')!;
               targetX = elementPos.x + d.dx * dist;
               targetY = elementPos.y + d.dy * dist;
            }
          }
          
          // Clamp so it stays on screen, ensuring the top half isn't cut off
          targetX = Math.max(50, Math.min(targetX, window.innerWidth - 100));
          targetY = Math.max(80, Math.min(targetY, window.innerHeight - 120));
          
          // Only update target if it moved significantly
          const currentT = targetRef.current;
          if (Math.abs(currentT.x - targetX) > 5 || Math.abs(currentT.y - targetY) > 5) {
            setTarget({ x: targetX, y: targetY });
            targetRef.current = { x: targetX, y: targetY };
            setTargetElementPos(elementPos);
            tripStartPosRef.current = posRef.current;
          }
        } else {
          setTargetElementPos(null);
        }
      }, 200); // Check every 200ms

      return () => clearInterval(interval);
    }
  }, [currentStepIndex, isDragging]);

  if (!isDebugMode || !isTutorialActive) return null;

  // Calculate tentacle path based on target element position
  const dxTarget = target.x - position.x;
  const dyTarget = target.y - position.y;
  const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
  const margin = 50;
  // If we arrived at the margin and we aren't dragging it, we point at the target element
  const currentStep = gdpTutorialSteps[currentStepIndex];

  let animatedTargetElementPos = targetElementPos;
  let isGrabbing = false;

  if (currentStep.dragAndDrop) {
      const dragDropCfg = currentStep.dragAndDrop();
      if (dragDropCfg) {
          const srcEl = document.querySelector(dragDropCfg.sourceSelector);
          const dstEl = document.querySelector(dragDropCfg.destSelector);
          if (srcEl && dstEl) {
              const srcRect = srcEl.getBoundingClientRect();
              const dstRect = dstEl.getBoundingClientRect();
              let srcPos = { x: srcRect.left + srcRect.width / 2, y: srcRect.top + srcRect.height / 2 };
              if (dragDropCfg.sourcePosition) {
                  const dir = dragDropCfg.sourcePosition;
                  if (dir === 'n' || dir === 'nw' || dir === 'ne') srcPos.y = srcRect.top;
                  if (dir === 's' || dir === 'sw' || dir === 'se') srcPos.y = srcRect.bottom;
                  if (dir === 'e' || dir === 'ne' || dir === 'se') srcPos.x = srcRect.right;
                  if (dir === 'w' || dir === 'nw' || dir === 'sw') srcPos.x = srcRect.left;
              }

              let dstPos = { x: dstRect.left + dstRect.width / 2, y: dstRect.top + dstRect.height / 2 };
              if (dragDropCfg.destPosition) {
                  const dir = dragDropCfg.destPosition;
                  if (dir === 'n' || dir === 'nw' || dir === 'ne') dstPos.y = dstRect.top;
                  if (dir === 's' || dir === 'sw' || dir === 'se') dstPos.y = dstRect.bottom;
                  if (dir === 'e' || dir === 'ne' || dir === 'se') dstPos.x = dstRect.right;
                  if (dir === 'w' || dir === 'nw' || dir === 'sw') dstPos.x = dstRect.left;
              }
              
              const cycle = tick % 3000;
              let p = 0;
              if (cycle < 500) {
                  p = 0; 
                  isGrabbing = false;
              } else if (cycle < 2000) {
                  const t = (cycle - 500) / 1500;
                  p = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                  isGrabbing = true;
              } else if (cycle < 2500) {
                  p = 1; 
                  isGrabbing = false;
              } else {
                  p = 0;
                  isGrabbing = false;
              }
              
              animatedTargetElementPos = {
                  x: srcPos.x + (dstPos.x - srcPos.x) * p,
                  y: srcPos.y + (dstPos.y - srcPos.y) * p
              };
          }
      }
  }

  const isPointing = distToTarget <= margin + 5 && animatedTargetElementPos !== null && !isDragging && !currentStep.noPointing;

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

  if (isPointing && animatedTargetElementPos) {
    const pointDistX = animatedTargetElementPos.x - position.x;
    const pointDistY = animatedTargetElementPos.y - position.y;
    const baseAngle = Math.atan2(pointDistY, pointDistX);
    // Oscillate the distance (poking motion)
    const wiggleDistance = isGrabbing ? 0 : Math.sin(tick / 150) * 11.31; 
    
    // Stretch to the element
    const distToElement = Math.sqrt(pointDistX * pointDistX + pointDistY * pointDistY);
    const maxTentacleLength = currentStep.dragAndDrop ? 3000 : 200;
    const offset = currentStep.dragAndDrop ? 5 : -24.23; 
    
    const pointLength = Math.min(distToElement + offset + wiggleDistance, maxTentacleLength); // cap length
    
    const gx = position.x + Math.cos(baseAngle) * pointLength;
    const gy = position.y + Math.sin(baseAngle) * pointLength;

    const dxTip = gx - position.x;
    const dyTip = gy - position.y;

    // The SVG has a viewBox of width 120, height 150, but the container is 100x120.
    // The scale factor is 150 / 120 = 1.25 SVG units per pixel.
    const svgScale = 1.25;
    const svgDxTip = dxTip * svgScale;
    const svgDyTip = dyTip * svgScale;

    // Invert the squid's rotation to map global vector to local SVG coordinates
    const rad = -(rotation * Math.PI) / 180;
    const lx = svgDxTip * Math.cos(rad) - svgDyTip * Math.sin(rad) + 50; 
    const ly = svgDxTip * Math.sin(rad) + svgDyTip * Math.cos(rad) + 60; 
    
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

  // Calculate total trip distance to decide if we should say "Follow me"
  const dxTotal = target.x - tripStartPosRef.current.x;
  const dyTotal = target.y - tripStartPosRef.current.y;
  const totalTripDistance = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);

  const isMoving = !isDragging && distToTarget > margin + 5;
  const isLongTrip = totalTripDistance > Math.max(window.innerWidth * 0.15, 200);
  const currentText = (isMoving && isLongTrip) ? "Follow me" : gdpTutorialSteps[currentStepIndex].text;

  let isNewStep = false;
  if (prevStepRef.current !== currentStepIndex) {
    isNewStep = true;
    prevStepRef.current = currentStepIndex;
  }

  // --- Debug Visualization Logic ---
  let debugRect: DOMRect | null = null;
  if (isDebugMode) {
      if (currentStep.dragAndDrop) {
          const cfg = currentStep.dragAndDrop();
          if (cfg) {
              const el = document.querySelector(cfg.sourceSelector);
              if (el) debugRect = el.getBoundingClientRect();
          }
      } else {
          const selector = currentStep.dynamicTargetSelector ? currentStep.dynamicTargetSelector() : currentStep.targetSelector;
          if (selector) {
              const el = document.querySelector(selector);
              if (el) debugRect = el.getBoundingClientRect();
          }
      }
  }

  return (
    <>
      <div style={{ 
        position: 'fixed', 
        zIndex: 1060, 
        left: 0, 
        top: 0, 
        transform: `translate(${bubblePos.x - 50}px, ${bubblePos.y - 60}px)`, 
        pointerEvents: 'none', 
        width: 100, 
        height: 120 
      }}>
        <SpeechBubble 
          placement={placement}
          onPlacementChange={setPlacement}
          squidPos={position}
          targetPos={targetElementPos}
          isDragging={isDragging}
          targetPlacement={
            gdpTutorialSteps[currentStepIndex].dynamicBubblePlacement
              ? gdpTutorialSteps[currentStepIndex].dynamicBubblePlacement!()
              : gdpTutorialSteps[currentStepIndex].bubblePlacement
          }
          onClose={(e) => { e.stopPropagation(); setIsTutorialActive(false); }}
          text={currentText}
          type="persistent"
          instant={isMoving || !isNewStep}
          onSkip={handleSkip}
          onNext={handleNext}
          nextLabel={currentStepIndex === gdpTutorialSteps.length - 1 ? "Finish" : "Next ➔"}
          canGoNext={(() => {
            const currentStep = gdpTutorialSteps[currentStepIndex];
            if (currentStep.requirementCheck && (currentStep as any).autoAdvance !== false) {
              return false; // Hide Next button if it auto-advances
            }
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
          zIndex: 1060,
          left: 0,
          top: 0,
          transform: `translate(${position.x - 50}px, ${position.y - 60}px)`
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >

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
      
      {/* --- Debug Visualization Layer --- */}
      {isDebugMode && debugRect && (
        <div style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none', left: 0, top: 0, width: '100vw', height: '100vh' }}>
          {/* Render the bounding box of the target element */}
          <div style={{
            position: 'absolute',
            left: debugRect.left,
            top: debugRect.top,
            width: debugRect.width,
            height: debugRect.height,
            border: '2px dashed red',
            boxSizing: 'border-box'
          }} />
          
          {/* Big hand location octagon */}
          <svg viewBox="0 0 36 36" style={{
            position: 'absolute',
            left: debugRect.left + debugRect.width / 2, 
            top: debugRect.top + debugRect.height / 2,
            transform: 'translate(-50%, -50%) rotate(22.5deg)',
            width: 66, height: 66,
            overflow: 'visible'
          }}>
            <polygon 
              points="10.8,0 25.2,0 36,10.8 36,25.2 25.2,36 10.8,36 0,25.2 0,10.8"
              fill="rgba(0, 255, 0, 0.2)"
              stroke="white"
              strokeWidth="1"
            />
          </svg>

          {/* Small hand location octagon */}
          <svg viewBox="0 0 36 36" style={{
            position: 'absolute',
            left: debugRect.left + debugRect.width / 2, 
            top: debugRect.top + debugRect.height / 2,
            transform: 'translate(-50%, -50%) rotate(22.5deg)',
            width: 24, height: 24,
            overflow: 'visible'
          }}>
            <polygon 
              points="10.8,0 25.2,0 36,10.8 36,25.2 25.2,36 10.8,36 0,25.2 0,10.8"
              fill="rgba(0, 0, 255, 0.5)"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}
    </>
  );
};

export default TutorialGDP;
