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
  placement?: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  squidPos?: { x: number, y: number };
  targetPos?: { x: number, y: number } | null;
  targetPlacement?: 'n' | 'nw' | 'w' | 'sw' | 's' | 'se' | 'e' | 'ne';
  isDragging?: boolean;
  onPlacementChange?: (placement: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw') => void;
  onClose?: (e: React.MouseEvent) => void;
  customFooter?: React.ReactNode;
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
  placement = 'ne',
  squidPos,
  targetPos,
  targetPlacement,
  isDragging = false,
  onPlacementChange,
  onClose,
  customFooter,
}) => {
  const isHover = type === 'hover';
  
  const [displayedText, setDisplayedText] = useState<string | React.ReactNode>("");
  const [targetText, setTargetText] = useState<string | React.ReactNode>("");
  const [state, setState] = useState<TypewriterState>('IDLE');
  const [charIndex, setCharIndex] = useState(0);
  const [computedPlacement, setComputedPlacement] = useState(placement);

  const [idealPlacement, setIdealPlacement] = useState(placement);

  // 1. Determine the ideal final placement
  useEffect(() => {
    if (targetPlacement) {
      setIdealPlacement(targetPlacement);
      return;
    }

    if (!squidPos) {
      setIdealPlacement(placement);
      return;
    }
    
    let nextPlacement: 'n' | 'nw' | 'w' | 'sw' | 's' | 'se' | 'e' | 'ne' = 'se';
    const inkyX = squidPos.x;
    const inkyY = squidPos.y;

    if (targetPos && !isDragging) {
      const dx = inkyX - targetPos.x;
      const dy = inkyY - targetPos.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      if (angle >= -22.5 && angle < 22.5) nextPlacement = 'e';
      else if (angle >= 22.5 && angle < 67.5) nextPlacement = 'se';
      else if (angle >= 67.5 && angle < 112.5) nextPlacement = 's';
      else if (angle >= 112.5 && angle < 157.5) nextPlacement = 'sw';
      else if (angle >= 157.5 || angle < -157.5) nextPlacement = 'w';
      else if (angle >= -157.5 && angle < -112.5) nextPlacement = 'nw';
      else if (angle >= -112.5 && angle < -67.5) nextPlacement = 'n';
      else if (angle >= -67.5 && angle < -22.5) nextPlacement = 'ne';
    } else {
      if (inkyX < window.innerWidth / 2) {
        nextPlacement = inkyY < window.innerHeight / 2 ? 'se' : 'ne';
      } else {
        nextPlacement = inkyY < window.innerHeight / 2 ? 'sw' : 'nw';
      }
    }

    // Safety overrides to prevent bubble from going off-screen
    if (inkyX > window.innerWidth - 350) {
      if (nextPlacement === 'e' || nextPlacement === 'ne' || nextPlacement === 'se' || nextPlacement === 'n' || nextPlacement === 's') {
        nextPlacement = inkyY < 200 ? 'sw' : (inkyY > window.innerHeight - 250 ? 'nw' : 'w');
      }
    } else if (inkyX < 350) {
      if (nextPlacement === 'w' || nextPlacement === 'nw' || nextPlacement === 'sw' || nextPlacement === 'n' || nextPlacement === 's') {
        nextPlacement = inkyY < 200 ? 'se' : (inkyY > window.innerHeight - 250 ? 'ne' : 'e');
      }
    }

    if (inkyY > window.innerHeight - 250) {
      if (nextPlacement === 's' || nextPlacement === 'se' || nextPlacement === 'sw') {
        nextPlacement = inkyX < 350 ? 'ne' : (inkyX > window.innerWidth - 350 ? 'nw' : 'n');
      }
    } else if (inkyY < 250) {
      if (nextPlacement === 'n' || nextPlacement === 'ne' || nextPlacement === 'nw') {
        nextPlacement = inkyX < 350 ? 'se' : (inkyX > window.innerWidth - 350 ? 'sw' : 's');
      }
    }

    setIdealPlacement(nextPlacement);
  }, [squidPos, targetPos, isDragging, placement, targetPlacement]);

  // 2. Animate towards idealPlacement
  useEffect(() => {
    if (computedPlacement === idealPlacement) return;

    const dirs = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
    const curIdx = dirs.indexOf(computedPlacement as any);
    const targetIdx = dirs.indexOf(idealPlacement as any);
    
    if (curIdx === -1 || targetIdx === -1) {
      setComputedPlacement(idealPlacement);
      onPlacementChange?.(idealPlacement);
      return;
    }

    const timeout = setTimeout(() => {
      // Find shortest path
      let diff = targetIdx - curIdx;
      if (diff > 4) diff -= 8;
      if (diff < -4) diff += 8;
      
      const step = diff > 0 ? 1 : -1;
      let nextIdx = curIdx + step;
      if (nextIdx < 0) nextIdx = 7;
      if (nextIdx > 7) nextIdx = 0;
      
      const nextDir = dirs[nextIdx];
      setComputedPlacement(nextDir);
      onPlacementChange?.(nextDir);
    }, 150);

    return () => clearTimeout(timeout);
  }, [computedPlacement, idealPlacement, onPlacementChange]);

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
      className={`inky-speech-bubble ${isHover ? 'inky-speech-bubble-hover' : `inky-speech-bubble-persistent placement-${computedPlacement}`}`}
      onPointerDown={(e) => !isHover && e.stopPropagation()}
    >
      {onClose && !isHover && (
        <button 
          className="inky-speech-close" 
          onClick={onClose}
          title="Close Inky"
        >
          ×
        </button>
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
      
      {!isHover && state === 'IDLE' && (
        customFooter ? customFooter : (
          (onNext || onSkip) && (
            <div className="inky-speech-buttons">
              {onSkip && <button className="inky-speech-btn inky-speech-btn-skip" onClick={onSkip}>Skip</button>}
              {onNext && canGoNext && (
                <button className="inky-speech-btn" onClick={onNext}>
                  {nextLabel}
                </button>
              )}
            </div>
          )
        )
      )}
    </div>
  );
};

export default SpeechBubble;
