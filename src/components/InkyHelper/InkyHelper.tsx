import React from 'react';
import InkyBody, { type InkyBodyProps } from './animation/components/InkyBody';
import SpeechBubble, { type SpeechBubbleProps } from './animation/components/SpeechBubble';

interface InkyHelperProps {
  // Container props
  className?: string;
  style?: React.CSSProperties;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp?: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: React.PointerEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  title?: string;
  
  // Speech Bubble props
  speechProps?: SpeechBubbleProps;
  
  // Body props
  bodyProps?: InkyBodyProps;
}

const InkyHelper: React.FC<InkyHelperProps> = ({
  className = "",
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  title,
  speechProps,
  bodyProps
}) => {
  return (
    <div 
      className={`inky-wrapper ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      title={title}
    >
      <InkyBody {...bodyProps} />
      {speechProps && <SpeechBubble {...speechProps} />}
    </div>
  );
};

export default InkyHelper;
