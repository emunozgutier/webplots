import React from 'react';
import { useAnimationSideMenuStore } from '../../../store/SideMenu/useAnimationSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';

const AnimationSettings: React.FC = () => {
    const { animationData, setDisplayMode } = useAnimationSideMenuStore();
    const { closePopup } = useWorkspaceLocalStore();

    return (
        <div className="card shadow-lg mx-auto" style={{ minWidth: '350px', maxWidth: '500px' }}>
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>Animation Options</span>
                <button className="btn btn-sm btn-close" onClick={closePopup}></button>
            </div>
            
            <div className="card-body p-4">
                <div className="mb-3">
                    <label className="form-label text-muted small fw-bold mb-3">Display Mode</label>
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="displayMode"
                            id="displayModeSubtitle"
                            checked={animationData.displayMode === 'subtitle'}
                            onChange={() => setDisplayMode('subtitle')}
                        />
                        <label className="form-check-label" htmlFor="displayModeSubtitle">
                            Subtitle (Plot Header)
                        </label>
                    </div>
                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="displayMode"
                            id="displayModeBackground"
                            checked={animationData.displayMode === 'background'}
                            onChange={() => setDisplayMode('background')}
                        />
                        <label className="form-check-label" htmlFor="displayModeBackground">
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
                        <label className="form-check-label" htmlFor="displayModeNone">
                            None (Hidden)
                        </label>
                    </div>
                </div>
                
                <div className="alert alert-info mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Select how the current timeline value should be displayed inside the main plot area.
                </div>
            </div>
        </div>
    );
};

export default AnimationSettings;
