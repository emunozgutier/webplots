import React from 'react';
import { useAnimationSideMenuStore } from '../../../store/SideMenu/useAnimationSideMenuStore';

const AnimationSettings: React.FC = () => {
    const { animationData, setDisplayMode } = useAnimationSideMenuStore();

    return (
        <div className="p-3" style={{ minWidth: '250px' }}>
            <h6 className="fw-bold mb-3 border-bottom pb-2">Animation Settings</h6>

            <div className="mb-3">
                <label className="form-label text-muted small fw-bold mb-2">Display Mode</label>
                <div className="form-check mb-2">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="displayMode"
                        id="displayModeSubtitle"
                        checked={animationData.displayMode === 'subtitle'}
                        onChange={() => setDisplayMode('subtitle')}
                    />
                    <label className="form-check-label small" htmlFor="displayModeSubtitle">
                        Subtitle (Plot Header)
                    </label>
                </div>
                <div className="form-check mb-2">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="displayMode"
                        id="displayModeBackground"
                        checked={animationData.displayMode === 'background'}
                        onChange={() => setDisplayMode('background')}
                    />
                    <label className="form-check-label small" htmlFor="displayModeBackground">
                        Background Watermark
                    </label>
                </div>
                <div className="form-check">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="displayMode"
                        id="displayModeNone"
                        checked={animationData.displayMode === 'none'}
                        onChange={() => setDisplayMode('none')}
                    />
                    <label className="form-check-label small" htmlFor="displayModeNone">
                        None (Hidden)
                    </label>
                </div>
            </div>
            <div className="text-muted mt-3" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-info-circle me-1"></i>
                Select how the current animation value should be displayed on the plot.
            </div>
        </div>
    );
};

export default AnimationSettings;
