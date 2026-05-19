import React, { useMemo, useEffect } from 'react';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';

interface AnimationControlsProps {
    data: any[];
}

const AnimationControls: React.FC<AnimationControlsProps> = ({ data }) => {
    const { animationData, setAnimationValue, setIsPlaying, setSpeedMultiplier } = useAnimationSideMenuStore();

    const { animationColumn, animationValue, isPlaying, speedMultiplier = 1 } = animationData;

    // Extract unique values for the selected column, sorted
    const uniqueValues = useMemo(() => {
        if (!animationColumn || data.length === 0) return [];
        const values = new Set<string | number>();
        for (let i = 0; i < data.length; i++) {
            const val = data[i][animationColumn];
            if (val !== undefined && val !== null && val !== '') {
                values.add(val);
            }
        }
        
        const sorted = Array.from(values).sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
        });
        return sorted;
    }, [animationColumn, data]);

    const currentIndex = useMemo(() => {
        if (uniqueValues.length === 0) return 0;
        const index = uniqueValues.findIndex(v => v === animationValue);
        return index !== -1 ? index : 0;
    }, [uniqueValues, animationValue]);


    // Update animationValue if column changes and current value is not in uniqueValues
    useEffect(() => {
        if (uniqueValues.length > 0 && (animationValue === null || !uniqueValues.includes(animationValue))) {
            setAnimationValue(uniqueValues[0]);
        }
    }, [uniqueValues, animationValue, setAnimationValue]);

    // Handle slider change
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const index = parseInt(e.target.value, 10);
        if (uniqueValues[index] !== undefined) {
            setAnimationValue(uniqueValues[index]);
        }
    };

    // Play/pause logic for the slider movement
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && uniqueValues.length > 0) {
            // Calculate interval to make the full animation take ~10 seconds adjusted by speed multiplier
            const intervalMs = Math.max(20, Math.floor((10000 / uniqueValues.length) / speedMultiplier));
            interval = setInterval(() => {
                const nextIndex = currentIndex + 1;
                if (nextIndex >= uniqueValues.length) {
                    setIsPlaying(false);
                } else {
                    setAnimationValue(uniqueValues[nextIndex]);
                }
            }, intervalMs);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, currentIndex, uniqueValues, setAnimationValue, speedMultiplier, setIsPlaying]);

    if (!animationColumn || uniqueValues.length === 0) {
        return null;
    }

    return (
        <div className="animation-controls w-100 bg-light border-top p-2 d-flex flex-column" style={{ zIndex: 10 }}>
            <div className="d-flex align-items-center mb-1">
                <span className="fw-bold text-primary me-auto" style={{ fontSize: '0.85rem' }}>Timeline: {animationColumn}</span>
                <div className="badge bg-secondary">{String(uniqueValues[currentIndex])}</div>
            </div>
            <div className="d-flex align-items-center">
                <button 
                    id="animation-play-button"
                    className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'} me-2`} 
                    onClick={() => {
                        if (!isPlaying && currentIndex >= uniqueValues.length - 1) {
                            setAnimationValue(uniqueValues[0]);
                        }
                        setIsPlaying(!isPlaying);
                    }}
                    style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, flexShrink: 0 }}
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-5`}></i>
                </button>

                <button 
                    className="btn btn-sm btn-outline-secondary me-3" 
                    onClick={() => {
                        const nextIndex = currentIndex + 1;
                        if (nextIndex < uniqueValues.length) {
                            setAnimationValue(uniqueValues[nextIndex]);
                        } else {
                            // Loop back to start if at the end
                            setAnimationValue(uniqueValues[0]);
                        }
                    }}
                    style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, flexShrink: 0 }}
                    title="Next Frame"
                >
                    <i className="bi bi-skip-forward-fill fs-6"></i>
                </button>
                <div className="flex-grow-1">
                    <input
                        type="range"
                        className="form-range"
                        min="0"
                        max={uniqueValues.length - 1}
                        step="1"
                        value={currentIndex}
                        onChange={handleSliderChange}
                    />
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>
                        <span>{String(uniqueValues[0])}</span>
                        <span>{String(uniqueValues[uniqueValues.length - 1])}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimationControls;
