import React from 'react';
import './SpeechBubble.css';

export interface SpeechBubbleProps {
  text: string | React.ReactNode;
  type?: 'hover' | 'persistent';
  onNext?: (e: React.MouseEvent) => void;
  onSkip?: (e: React.MouseEvent) => void;
  nextLabel?: string;
  canGoNext?: boolean;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  type = 'hover',
  onNext,
  onSkip,
  nextLabel = "Next ➔",
  canGoNext = true,
}) => {
  const isHover = type === 'hover';

  return (
    <div 
      className={`inky-speech-bubble ${isHover ? 'inky-speech-bubble-hover' : 'inky-speech-bubble-persistent'}`}
      onPointerDown={(e) => !isHover && e.stopPropagation()}
    >
      {!isHover && onSkip && (
        <button className="inky-speech-close" onClick={onSkip} title="Close">×</button>
      )}
      
      <div className="inky-speech-text">{text}</div>
      
      {!isHover && (onNext || onSkip) && (
        <div className="inky-speech-buttons">
          {onSkip && <button className="inky-speech-btn inky-speech-btn-skip" onClick={onSkip}>Skip</button>}
          {onNext && canGoNext && (
            <button className="inky-speech-btn" onClick={onNext}>
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeechBubble;
