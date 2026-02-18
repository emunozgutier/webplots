import React from 'react';
import { useAppStateStore } from '../../store/AppStateStore';

interface DebugProps {
    receipt: string;
}

const Debug: React.FC<DebugProps> = ({ receipt }) => {
    const { closePopup } = useAppStateStore();

    return (
        <div className="card shadow-lg" style={{ width: '90%', maxWidth: '1200px', maxHeight: '80%' }}>
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>Plotly Code Receipt</span>
                <button className="btn btn-sm btn-close" onClick={closePopup}></button>
            </div>
            <div className="card-body p-0 overflow-auto bg-dark">
                <pre className="m-0 p-3 text-white small font-monospace">
                    {receipt}
                </pre>
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary" onClick={closePopup}>Close</button>
            </div>
        </div>
    );
};

export default Debug;
