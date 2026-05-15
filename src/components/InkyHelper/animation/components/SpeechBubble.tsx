import React, { useState, useEffect } from 'react';
import './SpeechBubble.css';

export interface SpeechBubbleProps {
  text: string | React.ReactNode;
  type?: 'hover' | 'persistent';
  onNext?: (e: React.MouseEvent) => void;
  onSkip?: (e: React.MouseEvent) => void;
  nextLabel?: string;
  canGoNext?: boolean;
  skipDelay?: boolean;
  instant?: boolean;
  delayMs?: number;
  placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

type TypewriterState = 'IDLE' | 'WAITING' | 'TYPING';

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  type = 'hover',
  onNext,
  onSkip,
  nextLabel = "Next ➔",
  canGoNext = true,
  skipDelay = false,
  instant = false,
  delayMs = 1000,
  placement = 'top-left',
}) => {
  const isHover = type === 'hover';
  
  const [displayedText, setDisplayedText] = useState<string | React.ReactNode>("");
  const [targetText, setTargetText] = useState<string | React.ReactNode>("");
  const [state, setState] = useState<TypewriterState>('IDLE');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (text !== targetText) {
      setTargetText(text);
      if (typeof text === 'string' && !instant) {
        if (displayedText !== "" && displayedText !== null && displayedText !== undefined && !skipDelay) {
          setState('WAITING');
        } else {
          setState('TYPING');
          setCharIndex(0);
          setDisplayedText("");
        }
      } else {
        setDisplayedText(text);
        setState('IDLE');
      }
    }
  }, [text, targetText, displayedText, skipDelay, instant]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (state === 'WAITING') {
      timeout = setTimeout(() => {
        setState('TYPING');
        setCharIndex(0);
        setDisplayedText("");
      }, delayMs);
    } else if (state === 'TYPING') {
      if (typeof targetText === 'string') {
        if (charIndex < targetText.length) {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => (typeof prev === 'string' ? prev + targetText.charAt(charIndex) : targetText.charAt(charIndex)));
            setCharIndex((prev) => prev + 1);
          }, 30);
        } else {
          setState('IDLE');
        }
      } else {
        setState('IDLE');
      }
    }
    
    return () => clearTimeout(timeout);
  }, [state, charIndex, targetText, delayMs]);

  return (
    <div 
      className={`inky-speech-bubble ${isHover ? 'inky-speech-bubble-hover' : `inky-speech-bubble-persistent placement-${placement}`}`}
      onPointerDown={(e) => !isHover && e.stopPropagation()}
    >
      {!isHover && onSkip && (
        <button className="inky-speech-close" onClick={onSkip} title="Close">×</button>
      )}
      
      <div className="inky-speech-text" style={{ position: 'relative' }}>
        {/* Invisible full text establishes the final dimensions so the bubble doesn't resize while typing */}
        <div style={{ visibility: 'hidden', pointerEvents: 'none' }}>
          {targetText}
        </div>
        {/* Absolutely positioned typing text */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {displayedText}
        </div>
      </div>
      
      {!isHover && (onNext || onSkip) && state === 'IDLE' && (
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
