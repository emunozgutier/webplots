import React from 'react';
import { useWorkspaceLocalStore } from '../../store/WorkspaceLocalStore';

interface DebugProps {
    receipt: string;
}

const Debug: React.FC<DebugProps> = ({ receipt }) => {
    const { closePopup } = useWorkspaceLocalStore();

    return (
        <div className="card shadow-lg w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center flex-shrink-0">
                <span>Plotly Code Receipt</span>
                <button className="btn btn-sm btn-close" onClick={closePopup}></button>
            </div>
            <div className="card-body p-0 overflow-auto bg-dark flex-grow-1">
                <pre className="m-0 p-3 text-white small font-monospace">
                    {receipt}
                </pre>
            </div>
            <div className="card-footer bg-light d-flex justify-content-end flex-shrink-0">
                <button className="btn btn-sm btn-secondary" onClick={closePopup}>Close</button>
            </div>
        </div>
    );
};

export default Debug;
