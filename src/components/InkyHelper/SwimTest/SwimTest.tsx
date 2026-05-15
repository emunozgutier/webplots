import React, { useState, useEffect, useRef } from 'react';
import InkyHelper from '../InkyHelper';
import SpeechBubble from '../animation/components/SpeechBubble';
import './SwimTest.css';

const SwimTest: React.FC = () => {
  const [target, setTarget] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [bubblePos, setBubblePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [rotation, setRotation] = useState(0);
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<'swim' | 'point'>('swim');
  const [placement, setPlacement] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isSquidDragging, setIsSquidDragging] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const requestRef = useRef<number>(0);
  const posRef = useRef(position);
  const bubblePosRef = useRef(bubblePos);
  const targetRef = useRef(target);
  const rotRef = useRef(rotation);
  const modeRef = useRef(mode);
  const placementRef = useRef(placement);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const updatePosition = () => {
      setTick(Date.now());
      const currentPos = posRef.current;
      const currentTarget = targetRef.current;

      const dx = currentTarget.x - currentPos.x;
      const dy = currentTarget.y - currentPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const margin = 100;

      if (distance > margin) {
        // Speed
        const speed = 4;
        const vx = (dx / distance) * speed;
        const vy = (dy / distance) * speed;

        const nextX = currentPos.x + vx;
        const nextY = currentPos.y + vy;

        posRef.current = { x: nextX, y: nextY };
        setPosition(posRef.current);

        // Calculate rotation (both modes)
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

      // Smooth lerp for the speech bubble so it doesn't move too fast
      bubblePosRef.current = {
        x: bubblePosRef.current.x + (posRef.current.x - bubblePosRef.current.x) * 0.05,
        y: bubblePosRef.current.y + (posRef.current.y - bubblePosRef.current.y) * 0.05
      };
      setBubblePos(bubblePosRef.current);
      
      // Hysteresis logic for speech bubble placement
      const bubbleX = bubblePosRef.current.x;
      const bubbleY = bubblePosRef.current.y;
      
      const isCurrentlyRight = placementRef.current.includes('right');
      const isCurrentlyBottom = placementRef.current.includes('bottom');
      
      let nextIsRight = isCurrentlyRight;
      let nextIsBottom = isCurrentlyBottom;
      
      // Horizontal hysteresis (Bubble is 320px wide)
      if (isCurrentlyRight) {
        if (bubbleX > 500) nextIsRight = false; // Switch back to left
      } else {
        if (bubbleX < 350) nextIsRight = true; // Switch to right
      }
      
      // Vertical hysteresis
      if (isCurrentlyBottom) {
        if (bubbleY > 400) nextIsBottom = false; // Switch back to top
      } else {
        if (bubbleY < 250) nextIsBottom = true; // Switch to bottom
      }
      
      const nextPlacement = `${nextIsBottom ? 'bottom' : 'top'}-${nextIsRight ? 'right' : 'left'}` as any;
      if (nextPlacement !== placementRef.current) {
        placementRef.current = nextPlacement;
        setPlacement(nextPlacement);
      }

      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsMouseDown(true);
    setCursorPos({ x: e.clientX, y: e.clientY });
    setTarget({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (isMouseDown) {
      setTarget({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsMouseDown(false);
  };

  const handleSquidDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSquidDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSquidDragMove = (e: React.PointerEvent) => {
    if (isSquidDragging) {
      e.stopPropagation();
      setTarget({ x: e.clientX, y: e.clientY });
      targetRef.current = { x: e.clientX, y: e.clientY };
      posRef.current = { x: e.clientX, y: e.clientY };
      setPosition(posRef.current);
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleSquidDragEnd = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSquidDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Calculate tentacle path based on cursor position
  const armLength = 150;
  const distToCursor = Math.sqrt(Math.pow(cursorPos.x - position.x, 2) + Math.pow(cursorPos.y - position.y, 2));
  const isReaching = isMouseDown && distToCursor <= armLength;

  const dxTarget = target.x - position.x;
  const dyTarget = target.y - position.y;
  const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
  const margin = 100;
  // If we arrived at the margin and we aren't dragging it, we point at the target
  const isPointing = !isReaching && distToTarget <= margin + 5; 

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

  const isTentacleActive = mode === 'point' && (isReaching || isPointing);

  if (isTentacleActive) {
    let gx = 0;
    let gy = 0;

    if (isReaching) {
      gx = cursorPos.x;
      gy = cursorPos.y;
    } else if (isPointing) {
      const baseAngle = Math.atan2(dyTarget, dxTarget);
      // Oscillate the distance (poking motion) instead of the angle
      const wiggleDistance = Math.sin(tick / 150) * 15; // +/- 15 pixels
      
      const pointLength = distToTarget - 25 + wiggleDistance; 
      
      gx = position.x + Math.cos(baseAngle) * pointLength;
      gy = position.y + Math.sin(baseAngle) * pointLength;
    }

    const dxTip = gx - position.x;
    const dyTip = gy - position.y;

    // Invert the squid's rotation to map global vector to local SVG coordinates
    const rad = -(rotation * Math.PI) / 180;
    const lx = dxTip * Math.cos(rad) - dyTip * Math.sin(rad) + 50; // 50 is local center X
    const ly = dxTip * Math.sin(rad) + dyTip * Math.cos(rad) + 60; // 60 is local center Y
    
    if (lx < 50) {
      isReachingLeft = true;
      const startX = 25;
      const startY = 65;
      const angleRad = Math.atan2(ly - startY, lx - startX);
      
      // Center of the ellipse is 9 units back from the tip
      leftTentacleClubX = lx - Math.cos(angleRad) * 9;
      leftTentacleClubY = ly - Math.sin(angleRad) * 9;
      
      // The wrist where the path connects is 18 units back from the tip
      const endX = lx - Math.cos(angleRad) * 18;
      const endY = ly - Math.sin(angleRad) * 18;

      // Control point curves outwards to wrap around the body
      const mx = (startX + endX) / 2 - 50; 
      const my = (startY + endY) / 2;

      leftTentaclePath = `M ${startX},${startY} Q ${mx},${my} ${endX},${endY}`;
      leftTentacleClubRot = angleRad * (180 / Math.PI) - 90;
    } else {
      isReachingRight = true;
      const startX = 75;
      const startY = 65;
      const angleRad = Math.atan2(ly - startY, lx - startX);
      
      // Center of the ellipse is 9 units back from the tip
      rightTentacleClubX = lx - Math.cos(angleRad) * 9;
      rightTentacleClubY = ly - Math.sin(angleRad) * 9;
      
      // The wrist where the path connects is 18 units back from the tip
      const endX = lx - Math.cos(angleRad) * 18;
      const endY = ly - Math.sin(angleRad) * 18;

      // Control point curves outwards to wrap around the body
      const mx = (startX + endX) / 2 + 50; 
      const my = (startY + endY) / 2;

      rightTentaclePath = `M ${startX},${startY} Q ${mx},${my} ${endX},${endY}`;
      rightTentacleClubRot = angleRad * (180 / Math.PI) - 90;
    }
  }

  return (
    <div 
      className="swimtest-container" 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="swimtest-instruction">Click anywhere to make Inky swim there!</div>
      
      {/* Toggle Controls */}
      <div 
        style={{ 
          position: 'absolute', top: 20, left: 20, zIndex: 100, 
          backgroundColor: 'rgba(255, 255, 255, 0.6)', padding: 12, 
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.4)',
          fontFamily: 'sans-serif'
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>
          <input 
            type="checkbox" 
            checked={mode === 'point'} 
            onChange={(e) => setMode(e.target.checked ? 'point' : 'swim')} 
            style={{ marginRight: 8, width: 16, height: 16 }}
          />
          Enable Pointing
        </label>
      </div>

      {isClosed ? (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsClosed(false); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '12px 24px',
            fontSize: '18px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontWeight: 'bold'
          }}
        >
          Open Inky
        </button>
      ) : (
        <>
          {/* Target Marker */}
          <div 
            className="swimtest-target"
            style={{ left: target.x, top: target.y }}
          />

          {/* Trailing Horizontal Speech Bubble */}
          <div 
            style={{
              position: 'absolute',
              left: bubblePos.x - 50,
              top: bubblePos.y - 60,
              width: 100,
              height: 120,
              pointerEvents: 'none',
              zIndex: 100
            }}
          >
            <SpeechBubble 
              text={distToTarget > margin && !isSquidDragging ? "Follow Me" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
              type="persistent"
              instant={distToTarget > margin && !isSquidDragging}
              delayMs={1000}
              placement={placement}
            />
          </div>

          {/* Squid Controls (Attached to squid) */}
          <div 
            style={{
              position: 'absolute',
              left: position.x - 50,
              top: position.y - 60,
              width: 100,
              height: 120,
              pointerEvents: 'none',
              zIndex: 101,
            }}
          >
            <div style={{ position: 'absolute', top: -30, right: -40, pointerEvents: 'auto', display: 'flex', gap: 8, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div 
                onPointerDown={handleSquidDragStart}
                onPointerMove={handleSquidDragMove}
                onPointerUp={handleSquidDragEnd}
                onPointerCancel={handleSquidDragEnd}
                style={{ cursor: 'grab', display: 'flex', alignItems: 'center', userSelect: 'none', fontSize: '18px', color: '#666' }}
                title="Drag Inky"
              >
                ☰
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsClosed(true); }} 
                style={{ background: '#ffebee', color: '#f44336', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', padding: 0 }}
                title="Close Inky"
              >
                ×
              </button>
            </div>
          </div>

          {/* Inky */}
          <div 
            className="swimtest-inky"
            style={{ 
              transform: `translate(${position.x - 50}px, ${position.y - 60}px) rotate(${rotation}deg)` 
            }}
          >
            <InkyHelper 
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
                tentacleClass: "inky-tentacle",
                eyeClass: "inky-eye"
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SwimTest;
