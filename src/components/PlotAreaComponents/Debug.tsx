import React from 'react';
import { usePlotAreaStore } from '../../store/PlotAreaStore';

interface DebugProps {
    receipt: string;
}

const Debug: React.FC<DebugProps> = ({ receipt }) => {
    const { plotArea, toggleReceipt } = usePlotAreaStore();

    if (!plotArea.showReceipt) return null;

    return (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="card shadow-lg" style={{ width: '80%', maxWidth: '800px', maxHeight: '80%' }}>
                <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                    <span>Plotly Code Receipt</span>
                    <button className="btn btn-sm btn-close" onClick={toggleReceipt}></button>
                </div>
                <div className="card-body p-0 overflow-auto bg-dark">
                    <pre className="m-0 p-3 text-white small font-monospace">
                        {receipt}
                    </pre>
                </div>
                <div className="card-footer bg-light d-flex justify-content-end">
                    <button className="btn btn-sm btn-secondary" onClick={toggleReceipt}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default Debug;
