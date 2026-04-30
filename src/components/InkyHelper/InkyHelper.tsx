import React, { useState } from 'react';
import './InkyHelper.css';
import { useWorkspaceStore } from '../../store/Workspace/useWorkspaceStore';

const InkyHelper: React.FC = () => {
  const isDebugMode = useWorkspaceStore((state) => state.isDebugMode);
  const [messages] = useState([
    "Need some help?",
    "I'm Inky!",
    "Bloop bloop!",
    "Data is fun!",
    "Let's explore!",
  ]);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const handleClick = () => {
    setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
  };

  if (!isDebugMode) return null;

  return (
    <div className="inky-container" onClick={handleClick} title="Click me!">
      <div className="inky-bubble">{messages[currentMessageIndex]}</div>
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
          <g className="inky-tentacle">
            <path d="M 75,65 Q 100,80 85,110" fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="85" cy="115" rx="5" ry="9" fill="#9C27B0" />
          </g>

          {/* Front tentacles */}
          <path className="inky-tentacle" d="M 42,78 Q 42,100 42,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />
          <path className="inky-tentacle" d="M 58,78 Q 58,100 58,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />

          {/* Eyes */}
          <g className="inky-eye">
            <circle cx="35" cy="50" r="5" fill="#FFFFFF" />
            <circle cx="35" cy="50" r="2" fill="#333333" />
          </g>
          <g className="inky-eye">
            <circle cx="65" cy="50" r="5" fill="#FFFFFF" />
            <circle cx="65" cy="50" r="2" fill="#333333" />
          </g>

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

export default InkyHelper;
