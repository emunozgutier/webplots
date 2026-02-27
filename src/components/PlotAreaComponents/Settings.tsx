import React, { useState } from 'react';
import { useAppStateStore } from '../../store/AppStateStore';
import PlotLayout from './SettingsComponents/PlotLayout';
import TraceConfig from './SettingsComponents/TraceConfig';

const Settings: React.FC = () => {
    const { closePopup } = useAppStateStore();
    const [activeTab, setActiveTab] = useState<'layout' | 'trace'>('layout');

    return (
        <div className="card shadow-lg w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>Plot Settings</span>
                <button className="btn btn-sm btn-close" onClick={closePopup}></button>
            </div>

            <div className="card-body p-0 d-flex flex-column overflow-hidden">
                <ul className="nav nav-tabs nav-justified bg-light">
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-0 ${activeTab === 'layout' ? 'active bg-white fw-bold' : ''}`}
                            onClick={() => setActiveTab('layout')}
                        >
                            Layout
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link rounded-0 ${activeTab === 'trace' ? 'active bg-white fw-bold' : ''}`}
                            onClick={() => setActiveTab('trace')}
                        >
                            Trace Config
                        </button>
                    </li>
                </ul>

                <div className="p-0 flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
                    {activeTab === 'layout' ? <PlotLayout /> : <TraceConfig />}
                </div>
            </div>
        </div>
    );
};

export default Settings;
