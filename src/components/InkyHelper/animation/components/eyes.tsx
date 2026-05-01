import React, { useState, useEffect } from 'react';

interface EyesProps {
  className?: string;
}

const Eyes: React.FC<EyesProps> = ({ className = "tutorial-gdp-eye" }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Limit pupil movement so it doesn't leave the white eye boundary
  const maxMove = 2.5; 
  const pupilX = mousePos.x * maxMove;
  const pupilY = mousePos.y * maxMove;

  return (
    <>
      <g className={className}>
        <circle cx="35" cy="50" r="5" fill="#FFFFFF" />
        <circle cx={35 + pupilX} cy={50 + pupilY} r="2" fill="#333333" />
      </g>
      <g className={className}>
        <circle cx="65" cy="50" r="5" fill="#FFFFFF" />
        <circle cx={65 + pupilX} cy={50 + pupilY} r="2" fill="#333333" />
      </g>
    </>
  );
};

export default Eyes;
