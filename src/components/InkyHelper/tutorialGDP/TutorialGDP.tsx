import React, { useState } from 'react';
import './TutorialGDP.css';
import { useWorkspaceStore } from '../../../store/Workspace/useWorkspaceStore';

const TutorialGDP: React.FC = () => {
  const isDebugMode = useWorkspaceStore((state) => state.isDebugMode);
  const [messages] = useState([
    "Welcome to the GDP plotting tutorial!",
    "The X-axis shows GDP per capita.",
    "The Y-axis shows Life Expectancy.",
    "Bubble size represents population.",
    "Click play to see the animation over time!"
  ]);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const handleClick = () => {
    setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
  };

  if (!isDebugMode) return null;

  return (
    <div className="tutorial-gdp-container" onClick={handleClick} title="Click me for GDP plotting tips!">
      <div className="tutorial-gdp-bubble">{messages[currentMessageIndex]}</div>
      <svg className="tutorial-gdp-svg" viewBox="-10 -10 120 150" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <g transform="translate(0, 10)">
          {/* Squid Fins - Greenish */}
          <path d="M 50,-15 L 20,5 L 30,25 Z" fill="#2E7D32" />
          <path d="M 50,-15 L 80,5 L 70,25 Z" fill="#2E7D32" />

          {/* Back/Smaller tentacles */}
          <path className="tutorial-gdp-tentacle" d="M 35,75 Q 30,95 35,105" fill="none" stroke="#1B5E20" strokeWidth="6" strokeLinecap="round" />
          <path className="tutorial-gdp-tentacle" d="M 65,75 Q 70,95 65,105" fill="none" stroke="#1B5E20" strokeWidth="6" strokeLinecap="round" />

          {/* Squid Mantle & Body */}
          <path d="M 50,-15 Q 35,5 25,40 C 15,60 15,75 25,80 C 35,85 65,85 75,80 C 85,75 85,60 75,40 Q 65,5 50,-15 Z" fill="#4CAF50" />

          {/* Left Feeding Tentacle (Club) */}
          <g className="tutorial-gdp-tentacle">
            <path d="M 25,65 Q 0,80 15,110" fill="none" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="15" cy="115" rx="5" ry="9" fill="#4CAF50" />
          </g>
          
          {/* Right Feeding Tentacle (Club) */}
          <g className="tutorial-gdp-tentacle">
            <path d="M 75,65 Q 100,80 85,110" fill="none" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="85" cy="115" rx="5" ry="9" fill="#4CAF50" />
          </g>

          {/* Front tentacles */}
          <path className="tutorial-gdp-tentacle" d="M 42,78 Q 42,100 42,110" fill="none" stroke="#4CAF50" strokeWidth="7" strokeLinecap="round" />
          <path className="tutorial-gdp-tentacle" d="M 58,78 Q 58,100 58,110" fill="none" stroke="#4CAF50" strokeWidth="7" strokeLinecap="round" />

          {/* Eyes */}
          <g className="tutorial-gdp-eye">
            <circle cx="35" cy="50" r="5" fill="#FFFFFF" />
            <circle cx="35" cy="50" r="2" fill="#333333" />
          </g>
          <g className="tutorial-gdp-eye">
            <circle cx="65" cy="50" r="5" fill="#FFFFFF" />
            <circle cx="65" cy="50" r="2" fill="#333333" />
          </g>

          {/* Smile */}
          <path d="M 45,60 Q 50,65 55,60" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          
          {/* Cheeks */}
          <ellipse cx="25" cy="55" rx="4" ry="2" fill="#81C784" opacity="0.6" />
          <ellipse cx="75" cy="55" rx="4" ry="2" fill="#81C784" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

export default TutorialGDP;
