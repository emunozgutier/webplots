import React from 'react';
import { usePlotTypeSideMenuStore, type PlotType } from '../../store/SideMenu/usePlotTypeSideMenuStore';

interface PlotTypeOption {
    id: PlotType;
    title: string;
    icon: string;
    description: string;
    badges: string[];
}

const plotOptions: PlotTypeOption[] = [
    {
        id: 'scatter',
        title: 'Scatter Plot',
        icon: 'bi-graph-up',
        description: 'Plot 2D relationships between numerical or categorical variables with customizable markers, lines, subplots, and group styles.',
        badges: ['2D Coordinates', 'Multi-Series', 'Line & Markers']
    },
    {
        id: 'histogram',
        title: 'Histogram',
        icon: 'bi-bar-chart-fill',
        description: 'Visualize data distribution, bin frequencies, and density spreads for single or grouped numeric and category columns.',
        badges: ['1D Distribution', 'Frequency Bins', 'Overlay/Stack']
    }
];

const PlotTypeSideMenu: React.FC = () => {
    const { plotTypeSideMenuData, setPlotType } = usePlotTypeSideMenuStore();
    const { plotType } = plotTypeSideMenuData;

    return (
        <div className="d-flex flex-column h-100 p-3 overflow-auto">
            <h6 className="text-secondary border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between">
                <span>Plot Type</span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-uppercase" style={{ fontSize: '0.7rem' }}>
                    {plotType}
                </span>
            </h6>

            <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                Select the chart visualization style for your dataset.
            </p>

            <div className="d-flex flex-column gap-3">
                {plotOptions.map((opt) => {
                    const isSelected = plotType === opt.id;
                    return (
                        <div
                            key={opt.id}
                            id={`plot-type-${opt.id}-card`}
                            className={`card shadow-sm cursor-pointer transition-all border ${
                                isSelected
                                    ? 'border-primary bg-primary bg-opacity-10 shadow'
                                    : 'border-light-subtle bg-white hover-shadow'
                            }`}
                            style={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out'
                            }}
                            onClick={() => setPlotType(opt.id)}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                                                isSelected ? 'bg-primary text-white' : 'bg-light text-secondary'
                                            }`}
                                            style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}
                                        >
                                            <i className={`bi ${opt.icon}`}></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0 fw-bold">{opt.title}</h6>
                                        </div>
                                    </div>
                                    <div className="form-check m-0">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="plotTypeSelection"
                                            id={`radio-${opt.id}`}
                                            checked={isSelected}
                                            onChange={() => setPlotType(opt.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <p className="text-muted small mb-2" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>
                                    {opt.description}
                                </p>

                                <div className="d-flex flex-wrap gap-1">
                                    {opt.badges.map((b) => (
                                        <span
                                            key={b}
                                            className={`badge rounded-pill ${
                                                isSelected ? 'bg-primary text-white' : 'bg-light text-dark border'
                                            }`}
                                            style={{ fontSize: '0.65rem' }}
                                        >
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 p-2 bg-light border rounded text-muted small" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-info-circle me-1 text-primary"></i>
                {plotType === 'scatter' ? (
                    <span><strong>Scatter Plot</strong> uses both X and Y columns. Configure your axes in the <strong>Axis</strong> side menu.</span>
                ) : (
                    <span><strong>Histogram</strong> aggregates values from the Y columns into distribution bins.</span>
                )}
            </div>
        </div>
    );
};

export default PlotTypeSideMenu;
