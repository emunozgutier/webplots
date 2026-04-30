import React, { useState } from 'react';
import './InkyHelper.css';

const InkyHelper: React.FC = () => {
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

  return (
    <div className="inky-container" onClick={handleClick} title="Click me!">
      <div className="inky-bubble">{messages[currentMessageIndex]}</div>
      <svg className="inky-svg" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(0, 10)">
          {/* Back tentacles */}
          <path className="inky-tentacle" d="M 30,70 Q 20,90 25,100" fill="none" stroke="#FF8A65" strokeWidth="6" strokeLinecap="round" />
          <path className="inky-tentacle" d="M 70,70 Q 80,90 75,100" fill="none" stroke="#FF8A65" strokeWidth="6" strokeLinecap="round" />

          {/* Body/Head */}
          <path d="M 50,10 C 20,10 15,40 20,70 C 25,80 75,80 80,70 C 85,40 80,10 50,10 Z" fill="#FF7043" />
          
          {/* Front tentacles */}
          <path className="inky-tentacle" d="M 40,75 Q 35,95 40,105" fill="none" stroke="#FF7043" strokeWidth="8" strokeLinecap="round" />
          <path className="inky-tentacle" d="M 50,75 Q 50,100 50,110" fill="none" stroke="#FF7043" strokeWidth="8" strokeLinecap="round" />
          <path className="inky-tentacle" d="M 60,75 Q 65,95 60,105" fill="none" stroke="#FF7043" strokeWidth="8" strokeLinecap="round" />

          {/* Eyes */}
          <g className="inky-eye">
            <circle cx="35" cy="45" r="5" fill="#FFFFFF" />
            <circle cx="35" cy="45" r="2" fill="#333333" />
          </g>
          <g className="inky-eye">
            <circle cx="65" cy="45" r="5" fill="#FFFFFF" />
            <circle cx="65" cy="45" r="2" fill="#333333" />
          </g>

          {/* Smile */}
          <path d="M 45,55 Q 50,60 55,55" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          
          {/* Cheeks */}
          <ellipse cx="25" cy="50" rx="4" ry="2" fill="#FF5722" opacity="0.6" />
          <ellipse cx="75" cy="50" rx="4" ry="2" fill="#FF5722" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

export default InkyHelper;
