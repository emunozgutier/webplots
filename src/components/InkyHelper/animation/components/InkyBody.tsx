import React from 'react';
import Eyes from './eyes';

export interface TentacleProps {
  path: string;
  clubX: number;
  clubY: number;
  clubRot?: number;
  isReaching?: boolean;
}

export interface InkyBodyProps {
  leftTentacle?: TentacleProps;
  rightTentacle?: TentacleProps;
  tentacleClass?: string;
  eyeClass?: string;
  svgStyle?: React.CSSProperties;
  svgClassName?: string;
}

const defaultLeftTentacle: TentacleProps = {
  path: "M 25,65 Q 0,80 15,110",
  clubX: 15,
  clubY: 115
};

const defaultRightTentacle: TentacleProps = {
  path: "M 75,65 Q 100,80 85,110",
  clubX: 85,
  clubY: 115
};

const InkyBody: React.FC<InkyBodyProps> = ({
  leftTentacle = defaultLeftTentacle,
  rightTentacle = defaultRightTentacle,
  tentacleClass = "inky-tentacle",
  eyeClass,
  svgStyle = { overflow: 'visible', width: '100%', height: '100%' },
  svgClassName = "inky-svg"
}) => {
  return (
    <svg className={svgClassName} viewBox="-10 -10 120 150" xmlns="http://www.w3.org/2000/svg" style={svgStyle}>
      <g transform="translate(0, 10)">
        {/* Squid Fins */}
        <path d="M 50,-15 L 20,5 L 30,25 Z" fill="#8E24AA" />
        <path d="M 50,-15 L 80,5 L 70,25 Z" fill="#8E24AA" />

        {/* Back/Smaller tentacles */}
        <path className={tentacleClass} d="M 35,75 Q 30,95 35,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />
        <path className={tentacleClass} d="M 65,75 Q 70,95 65,105" fill="none" stroke="#7B1FA2" strokeWidth="6" strokeLinecap="round" />

        {/* Squid Mantle & Body */}
        <path d="M 50,-15 Q 35,5 25,40 C 15,60 15,75 25,80 C 35,85 65,85 75,80 C 85,75 85,60 75,40 Q 65,5 50,-15 Z" fill="#9C27B0" />

        {/* Left Feeding Tentacle (Club) */}
        <g className={leftTentacle.isReaching ? "" : tentacleClass}>
          <path d={leftTentacle.path} fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
          <ellipse 
            cx={leftTentacle.clubX} 
            cy={leftTentacle.clubY} 
            rx="5" 
            ry="9" 
            fill="#9C27B0" 
            transform={leftTentacle.clubRot !== undefined ? `rotate(${leftTentacle.clubRot}, ${leftTentacle.clubX}, ${leftTentacle.clubY})` : undefined} 
          />
        </g>
        
        {/* Right Feeding Tentacle (Club) */}
        <g className={rightTentacle.isReaching ? "" : tentacleClass}>
          <path d={rightTentacle.path} fill="none" stroke="#9C27B0" strokeWidth="5" strokeLinecap="round" />
          <ellipse 
            cx={rightTentacle.clubX} 
            cy={rightTentacle.clubY} 
            rx="5" 
            ry="9" 
            fill="#9C27B0" 
            transform={rightTentacle.clubRot !== undefined ? `rotate(${rightTentacle.clubRot}, ${rightTentacle.clubX}, ${rightTentacle.clubY})` : undefined} 
          />
        </g>

        {/* Front tentacles */}
        <path className={tentacleClass} d="M 42,78 Q 42,100 42,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />
        <path className={tentacleClass} d="M 58,78 Q 58,100 58,110" fill="none" stroke="#9C27B0" strokeWidth="7" strokeLinecap="round" />

        {/* Eyes */}
        <Eyes className={eyeClass} />

        {/* Smile */}
        <path d="M 45,60 Q 50,65 55,60" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheeks */}
        <ellipse cx="25" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
        <ellipse cx="75" cy="55" rx="4" ry="2" fill="#BA68C8" opacity="0.6" />
      </g>
    </svg>
  );
};

export default InkyBody;
