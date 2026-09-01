import React from 'react';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useAppLocalStore } from '../../store/useAppLocalStore';
import { Button } from 'react-bootstrap';
import AnimationSettings from './subcomponents/AnimationSettings';

const AnimationSideMenu: React.FC = () => {
    const { columns } = useCsvDataStore();
    const { animationData, setAnimationColumn } = useAnimationSideMenuStore();
    const { setPopupContent } = useAppLocalStore();
    const { animationColumn } = animationData;

    return (
        <div className="p-3 d-flex flex-column h-100 overflow-auto">
            <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">Animation Settings</h6>

            <div className="card p-2 shadow-sm mb-3">
                <div className="card-header bg-light p-2 border-bottom-0">
                    <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>Timeline Column</span>
                </div>
                <div className="card-body p-2 pt-0">
                    <select
                        id="animation-column-select"
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
        </div>
    );
};

export default AnimationSideMenu;
