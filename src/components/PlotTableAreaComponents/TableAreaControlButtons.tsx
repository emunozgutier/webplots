import React from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import type { SummaryMode } from './HeaderSummary';

interface TableAreaControlButtonsProps {
    summaryMode: SummaryMode;
    setSummaryMode: (mode: SummaryMode) => void;
    datasetMode: 'all' | 'plot';
    setDatasetMode: (mode: 'all' | 'plot') => void;
}

const TableAreaControlButtons: React.FC<TableAreaControlButtonsProps> = ({
    summaryMode,
    setSummaryMode,
    datasetMode,
    setDatasetMode
}) => {
    return (
        <div className="d-flex gap-3">
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
                    No Summary
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
                    All Data
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
    );
};

export default TableAreaControlButtons;
