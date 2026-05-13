import React, { useState, useEffect, useRef } from 'react';
import Eyes from '../InkyHelper/animation/components/eyes';
import './SwimTest.css';

const SwimTest: React.FC = () => {
  const [target, setTarget] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [rotation, setRotation] = useState(0);
  
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const requestRef = useRef<number>(0);
  const posRef = useRef(position);
  const targetRef = useRef(target);
  const rotRef = useRef(rotation);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const updatePosition = () => {
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

  // Calculate right tentacle path based on cursor position
  const armLength = 150;
  const distToCursor = Math.sqrt(Math.pow(cursorPos.x - position.x, 2) + Math.pow(cursorPos.y - position.y, 2));
  const isReaching = isMouseDown && distToCursor <= armLength;

  let rightTentaclePath = "M 75,65 Q 100,80 85,110";
  let rightTentacleClubRot = 0;
  let rightTentacleClubX = 85;
  let rightTentacleClubY = 115;

  if (isReaching) {
    const dx = cursorPos.x - position.x;
    const dy = cursorPos.y - position.y;
    // Invert the squid's rotation to map global vector to local SVG coordinates
    const rad = -(rotation * Math.PI) / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad) + 50; // 50 is local center X
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad) + 60; // 60 is local center Y
    
    rightTentacleClubX = lx;
    const pathEndY = ly - 5; // End path slightly before the club center
    rightTentacleClubY = ly;

    // Control point curves outwards to wrap around the body
    const mx = (75 + lx) / 2 + 50; 
    const my = (65 + pathEndY) / 2;

    rightTentaclePath = `M 75,65 Q ${mx},${my} ${lx},${pathEndY}`;
    
    // Rotate the club ellipse to align with the angle of the tentacle tip
    const clubAngle = Math.atan2(pathEndY - my, lx - mx) * (180 / Math.PI) - 90;
    rightTentacleClubRot = clubAngle;
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
      
      {/* Target Marker */}
      <div 
        className="swimtest-target"
        style={{ left: target.x, top: target.y }}
      />

      {/* Inky */}
      <div 
        className="swimtest-inky"
        style={{ 
          transform: `translate(${position.x - 50}px, ${position.y - 60}px) rotate(${rotation}deg)` 
        }}
      >
        <svg className="inky-svg" viewBox="-10 -10 120 150" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          <g transform="translate(0, 10)">
            {/* Squid Fins */}
            <path d="M 50,-15 L 20,5 L 30,25 Z" fill="#8E24AA" />
            <path d="M 50,-15 L 80,5 L 70,25 Z" fill="#8E24AA" />

            {/* Back/Smaller tentacles */}
            <path className="inky-tentacle" d="M 35,75 Q 30,95 35,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />
            <path className="inky-tentacle" d="M 65,75 Q 70,95 65,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />

            {/* Squid Mantle & Body */}
            <path d="M 50,-15 Q 35,5 25,40 C 15,60 15,75 25,80 C 35,85 65,85 75,80 C 85,75 85,60 75,40 Q 65,5 50,-15 Z" fill="#9C27B0" />

            {/* Left Feeding Tentacle (Club) */}
            <g className="inky-tentacle">
              <path d="M 25,65 Q 0,80 15,110" fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
              <ellipse cx="15" cy="115" rx="5" ry="9" fill="#9C27B0" />
            </g>
            
            {/* Right Feeding Tentacle (Club) */}
            <g className={isReaching ? "" : "inky-tentacle"}>
              <path d={rightTentaclePath} fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
              <ellipse 
                cx={rightTentacleClubX} 
                cy={rightTentacleClubY} 
                rx="5" 
                ry="9" 
                fill="#9C27B0" 
                transform={isReaching ? `rotate(${rightTentacleClubRot}, ${rightTentacleClubX}, ${rightTentacleClubY})` : undefined} 
              />
            </g>

            {/* Front tentacles */}
            <path className="inky-tentacle" d="M 42,78 Q 42,100 42,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />
            <path className="inky-tentacle" d="M 58,78 Q 58,100 58,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />

            {/* Eyes */}
            <Eyes className="inky-eye" />

            {/* Smile */}
            <path d="M 45,60 Q 50,65 55,60" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
            
            {/* Cheeks */}
            <ellipse cx="25" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
            <ellipse cx="75" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SwimTest;
