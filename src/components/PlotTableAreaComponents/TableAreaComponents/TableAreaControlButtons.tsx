import React from 'react';
import { ButtonGroup, ToggleButton, Button } from 'react-bootstrap';
import type { SummaryMode } from './HeaderSummary';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import TableAreaSettingsPopup from './TableAreaSettingsPopup';

interface TableAreaControlButtonsProps {
    summaryMode: SummaryMode;
    setSummaryMode: (mode: SummaryMode) => void;
    datasetMode: 'all' | 'plot';
    setDatasetMode: (mode: 'all' | 'plot') => void;
    colorMode: 'none' | 'color';
    setColorMode: (mode: 'none' | 'color') => void;
    hasPlotData: boolean;
}

const TableAreaControlButtons: React.FC<TableAreaControlButtonsProps> = ({
    summaryMode,
    setSummaryMode,
    datasetMode,
    setDatasetMode,
    colorMode,
    setColorMode,
    hasPlotData
}) => {
    const { setPopupContent } = useWorkspaceLocalStore();

    const handleOpenSettings = () => {
        setPopupContent(<TableAreaSettingsPopup />);
    };
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
                        disabled={!hasPlotData}
                        onChange={(e) => setDatasetMode(e.currentTarget.value as 'all' | 'plot')}
                        title={!hasPlotData ? "No data currently plotted" : "Show only plotted data"}
                    >
                        <span style={{ textDecoration: !hasPlotData ? 'line-through' : 'none' }}>
                            Plot
                        </span>
                    </ToggleButton>
                </ButtonGroup>
            </div>

            {/* Color Controls */}
            <div className="d-flex align-items-center gap-2">
                <span className="fw-bold small text-muted">Color Columns:</span>
                <ButtonGroup size="sm">
                    <ToggleButton
                        id="color-on"
                        type="radio"
                        variant={colorMode === 'color' ? 'success' : 'outline-success'}
                        name="colorMode"
                        value="color"
                        checked={colorMode === 'color'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        On
                    </ToggleButton>
                    <ToggleButton
                        id="color-off"
                        type="radio"
                        variant={colorMode === 'none' ? 'secondary' : 'outline-secondary'}
                        name="colorMode"
                        value="none"
                        checked={colorMode === 'none'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        Off
                    </ToggleButton>
                </ButtonGroup>
            </div>

            {/* Settings Button */}
            <div className="ms-auto">
                <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={handleOpenSettings}
                    title="Table Settings"
                    className="rounded-circle"
                    style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <i className="bi bi-gear-fill"></i>
                </Button>
            </div>
        </div>
    );
};

export default TableAreaControlButtons;
