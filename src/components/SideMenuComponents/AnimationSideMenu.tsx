import React, { useMemo, useEffect } from 'react';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useWorkspaceLocalStore } from '../../store/Workspace/useWorkspaceLocalStore';
import { Button } from 'react-bootstrap';
import AnimationSettings from './subcomponents/AnimationSettings';

const AnimationSideMenu: React.FC = () => {
    const { columns, data } = useCsvDataStore();
    const { animationData, setAnimationColumn, setAnimationValue, setIsPlaying } = useAnimationSideMenuStore();
    const { setPopupContent } = useWorkspaceLocalStore();

    const { animationColumn, animationValue, isPlaying } = animationData;

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

    // Very basic play/pause logic just for the slider movement
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && uniqueValues.length > 0) {
            interval = setInterval(() => {
                const nextIndex = (currentIndex + 1) % uniqueValues.length;
                setAnimationValue(uniqueValues[nextIndex]);
            }, 1000); // 1 second per frame for now
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, currentIndex, uniqueValues, setAnimationValue]);

    return (
        <div className="p-3 d-flex flex-column h-100 overflow-auto">
            <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">Animation Settings</h6>

            <div className="card shadow-sm mb-3">
                <div className="card-header bg-light p-2 border-bottom-0">
                    <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>Timeline Column</span>
                </div>
                <div className="card-body p-2 pt-0">
                    <select
                        className="form-select form-select-sm"
                        value={animationColumn}
                        onChange={(e) => setAnimationColumn(e.target.value)}
                    >
                        <option value="">-- Select Timeline Column --</option>
                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>

                    {animationColumn && (
                        <div className="mt-2 text-end">
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="w-100" 
                                style={{ fontSize: '0.75rem' }} 
                                onClick={() => setPopupContent(<AnimationSettings />)}
                            >
                                <i className="bi bi-gear me-1"></i>
                                Display Options
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {animationColumn && uniqueValues.length > 0 && (
                <div className="card shadow-sm mb-3">
                    <div className="card-header bg-light p-2 border-bottom-0 d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>Timeline</span>
                        <div className="badge bg-secondary">{String(uniqueValues[currentIndex])}</div>
                    </div>
                    <div className="card-body p-3 pt-0 text-center">
                        <div className="d-flex align-items-center justify-content-center mb-3 mt-2">
                            <button 
                                className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`} 
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}
                                title={isPlaying ? 'Pause' : 'Play'}
                            >
                                <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-5`}></i>
                            </button>
                        </div>
                        
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max={uniqueValues.length - 1}
                            step="1"
                            value={currentIndex}
                            onChange={handleSliderChange}
                        />
                        <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.65rem' }}>
                            <span>{String(uniqueValues[0])}</span>
                            <span>{String(uniqueValues[uniqueValues.length - 1])}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimationSideMenu;
