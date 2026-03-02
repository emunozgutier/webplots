import React from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import type { SummaryMode } from './HeaderSummary';

interface TableAreaControlButtonsProps {
    summaryMode: SummaryMode;
    setSummaryMode: (mode: SummaryMode) => void;
    datasetMode: 'all' | 'plot';
    setDatasetMode: (mode: 'all' | 'plot') => void;
    colorMode: 'none' | 'color';
    setColorMode: (mode: 'none' | 'color') => void;
}

const TableAreaControlButtons: React.FC<TableAreaControlButtonsProps> = ({
    summaryMode,
    setSummaryMode,
    datasetMode,
    setDatasetMode,
    colorMode,
    setColorMode
}) => {
    return (
        <div className="d-flex gap-4 align-items-center">
            {/* Summary Controls */}
            <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-muted">Summary:</span>
                <ButtonGroup size="sm">
                    <ToggleButton
                        id="summary-none"
                        type="radio"
                        variant={summaryMode === 'none' ? 'secondary' : 'outline-secondary'}
                        name="summaryMode"
                        value="none"
                        checked={summaryMode === 'none'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        None
                    </ToggleButton>
                    <ToggleButton
                        id="summary-slim"
                        type="radio"
                        variant={summaryMode === 'slim' ? 'secondary' : 'outline-secondary'}
                        name="summaryMode"
                        value="slim"
                        checked={summaryMode === 'slim'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        Slim
                    </ToggleButton>
                    <ToggleButton
                        id="summary-detailed"
                        type="radio"
                        variant={summaryMode === 'detailed' ? 'secondary' : 'outline-secondary'}
                        name="summaryMode"
                        value="detailed"
                        checked={summaryMode === 'detailed'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        Detailed
                    </ToggleButton>
                </ButtonGroup>
            </div>

            {/* Data Controls */}
            <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-muted">Data:</span>
                <ButtonGroup size="sm">
                    <ToggleButton
                        id="toggle-all"
                        type="radio"
                        variant={datasetMode === 'all' ? 'primary' : 'outline-primary'}
                        name="datasetMode"
                        value="all"
                        checked={datasetMode === 'all'}
                        onChange={(e) => setDatasetMode(e.currentTarget.value as 'all' | 'plot')}
                    >
                        All
                    </ToggleButton>
                    <ToggleButton
                        id="toggle-plot"
                        type="radio"
                        variant={datasetMode === 'plot' ? 'primary' : 'outline-primary'}
                        name="datasetMode"
                        value="plot"
                        checked={datasetMode === 'plot'}
                        onChange={(e) => setDatasetMode(e.currentTarget.value as 'all' | 'plot')}
                    >
                        Plot Data
                    </ToggleButton>
                </ButtonGroup>
            </div>

            {/* Color Controls */}
            <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-muted">Color:</span>
                <ButtonGroup size="sm">
                    <ToggleButton
                        id="color-none"
                        type="radio"
                        variant={colorMode === 'none' ? 'success' : 'outline-success'}
                        name="colorMode"
                        value="none"
                        checked={colorMode === 'none'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        No Color
                    </ToggleButton>
                    <ToggleButton
                        id="color-columns"
                        type="radio"
                        variant={colorMode === 'color' ? 'success' : 'outline-success'}
                        name="colorMode"
                        value="color"
                        checked={colorMode === 'color'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        Color Columns
                    </ToggleButton>
                </ButtonGroup>
            </div>
        </div>
    );
};

export default TableAreaControlButtons;
