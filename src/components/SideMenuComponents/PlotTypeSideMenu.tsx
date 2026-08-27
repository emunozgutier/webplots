import React from 'react';
import { usePlotTypeSideMenuStore, type PlotType } from '../../store/SideMenu/usePlotTypeSideMenuStore';

interface PlotTypeItem {
    id: string;
    title: string;
    icon: string;
    disabled?: boolean;
    badge?: string;
    description: string;
}

// Exactly 16 plot types arranged in a 2-column x 8-row layout
const plotTypeGrid: PlotTypeItem[] = [
    // Row 1
    {
        id: 'scatter',
        title: 'Scatter',
        icon: 'bi-graph-up',
        description: '2D coordinates, markers, lines & multi-group styling'
    },
    {
        id: 'histogram',
        title: 'Histogram',
        icon: 'bi-bar-chart-fill',
        description: '1D value distribution, density & bin frequencies'
    },
    // Row 2
    {
        id: 'bar',
        title: 'Bar Chart',
        icon: 'bi-bar-chart',
        disabled: true,
        badge: 'Soon',
        description: 'Categorical discrete aggregation bars'
    },
    {
        id: 'line',
        title: 'Line Chart',
        icon: 'bi-activity',
        disabled: true,
        badge: 'Soon',
        description: 'Sequential time series & connected paths'
    },
    // Row 3
    {
        id: 'box',
        title: 'Box Plot',
        icon: 'bi-square',
        disabled: true,
        badge: 'Soon',
        description: 'Quartiles, median & outlier distribution'
    },
    {
        id: 'violin',
        title: 'Violin',
        icon: 'bi-soundwave',
        disabled: true,
        badge: 'Soon',
        description: 'Kernel density estimation & probability spread'
    },
    // Row 4
    {
        id: 'heatmap',
        title: 'Heatmap',
        icon: 'bi-grid-3x3',
        disabled: true,
        badge: 'Soon',
        description: '2D matrix intensity & color correlation'
    },
    {
        id: 'pie',
        title: 'Pie / Donut',
        icon: 'bi-pie-chart',
        disabled: true,
        badge: 'Soon',
        description: 'Proportional slice part-to-whole share'
    },
    // Row 5
    {
        id: 'scatter3d',
        title: '3D Scatter',
        icon: 'bi-box',
        disabled: true,
        badge: 'Soon',
        description: '3-axis spatial X, Y, Z coordinates'
    },
    {
        id: 'contour',
        title: 'Contour 2D',
        icon: 'bi-water',
        disabled: true,
        badge: 'Soon',
        description: 'Iso-value contour elevation lines'
    },
    // Row 6
    {
        id: 'candlestick',
        title: 'Candlestick',
        icon: 'bi-reception-4',
        disabled: true,
        badge: 'Soon',
        description: 'Financial Open, High, Low, Close metrics'
    },
    {
        id: 'density2d',
        title: 'Density 2D',
        icon: 'bi-bullseye',
        disabled: true,
        badge: 'Soon',
        description: 'Bivariate kernel contour density map'
    },
    // Row 7
    {
        id: 'polar',
        title: 'Polar Chart',
        icon: 'bi-compass',
        disabled: true,
        badge: 'Soon',
        description: 'Angular degrees and radial coordinates'
    },
    {
        id: 'area',
        title: 'Area Chart',
        icon: 'bi-layers',
        disabled: true,
        badge: 'Soon',
        description: 'Filled cumulative volume curves'
    },
    // Row 8
    {
        id: 'sunburst',
        title: 'Sunburst',
        icon: 'bi-sun',
        disabled: true,
        badge: 'Soon',
        description: 'Multi-level hierarchical ring partitions'
    },
    {
        id: 'parcoords',
        title: 'Parallel Coords',
        icon: 'bi-distribute-vertical',
        disabled: true,
        badge: 'Soon',
        description: 'High-dimensional multi-variable poly-lines'
    }
];

const PlotTypeSideMenu: React.FC = () => {
    const { plotTypeSideMenuData, setPlotType } = usePlotTypeSideMenuStore();
    const { plotType } = plotTypeSideMenuData;

    const currentActiveOption = plotTypeGrid.find(p => p.id === plotType);

    return (
        <div className="d-flex flex-column h-100 p-2 overflow-auto" style={{ userSelect: 'none' }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                <span className="small fw-bold text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                    Visual Style (2 × 8)
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>
                    {plotType}
                </span>
            </div>

            {/* 2 Columns x 8 Rows Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '6px'
                }}
            >
                {plotTypeGrid.map((item) => {
                    const isSelected = !item.disabled && plotType === item.id;
                    const isAvailable = !item.disabled;

                    return (
                        <div
                            key={item.id}
                            id={`plot-type-tile-${item.id}`}
                            className={`rounded p-2 position-relative d-flex flex-column justify-content-between transition-all ${
                                isSelected
                                    ? 'border border-primary bg-primary bg-opacity-10 shadow-sm'
                                    : isAvailable
                                    ? 'border bg-white hover-shadow'
                                    : 'border border-dashed bg-light text-muted opacity-60'
                            }`}
                            style={{
                                minHeight: '64px',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease-in-out',
                                borderStyle: isAvailable ? 'solid' : 'dashed',
                                borderWidth: isSelected ? '1.5px' : '1px'
                            }}
                            onClick={() => {
                                if (isAvailable) {
                                    setPlotType(item.id as PlotType);
                                }
                            }}
                            title={item.disabled ? `${item.title} (Coming Soon)` : `${item.title}: ${item.description}`}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <div
                                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                                        isSelected
                                            ? 'bg-primary text-white'
                                            : isAvailable
                                            ? 'bg-light text-primary border'
                                            : 'bg-secondary bg-opacity-10 text-muted'
                                    }`}
                                    style={{ width: '26px', height: '26px', fontSize: '0.85rem' }}
                                >
                                    <i className={`bi ${item.icon}`}></i>
                                </div>

                                {item.badge ? (
                                    <span
                                        className="badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                                        style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                                    >
                                        {item.badge}
                                    </span>
                                ) : isSelected ? (
                                    <span className="badge bg-primary text-white rounded-pill" style={{ fontSize: '0.55rem' }}>
                                        <i className="bi bi-check-lg"></i>
                                    </span>
                                ) : null}
                            </div>

                            <div>
                                <div
                                    className={`fw-bold text-truncate ${isSelected ? 'text-primary' : isAvailable ? 'text-dark' : 'text-muted'}`}
                                    style={{ fontSize: '0.78rem', lineHeight: '1.1' }}
                                >
                                    {item.title}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selection Details Card */}
            {currentActiveOption && (
                <div className="mt-3 p-2 bg-light border rounded shadow-sm" style={{ fontSize: '0.75rem' }}>
                    <div className="d-flex align-items-center text-primary fw-bold mb-1">
                        <i className={`bi ${currentActiveOption.icon} me-1`}></i>
                        <span>{currentActiveOption.title} Active</span>
                    </div>
                    <div className="text-muted" style={{ lineHeight: '1.25' }}>
                        {currentActiveOption.description}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlotTypeSideMenu;
