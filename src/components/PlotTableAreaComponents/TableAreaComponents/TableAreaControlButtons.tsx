import React from 'react';
import { ButtonGroup, ToggleButton, Button } from 'react-bootstrap';
import type { SummaryMode } from './HeaderSummary';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import SettingsPopup from './SettingsPopup';
import { PlotTableButton } from '../PlotTableButton';

interface TableAreaControlButtonsProps {
    summaryMode: SummaryMode;
    setSummaryMode: (mode: SummaryMode) => void;
    viewMode: 'plot' | 'table';
    setViewMode: (mode: 'plot' | 'table') => void;
}

const TableAreaControlButtons: React.FC<TableAreaControlButtonsProps> = ({
    summaryMode,
    setSummaryMode,
    viewMode,
    setViewMode
}) => {
    const { setPopupContent } = useWorkspaceLocalStore();

    const handleOpenSettings = () => {
        setPopupContent(<SettingsPopup />);
    };
    return (
        <div className="d-flex gap-4 align-items-center w-100">
            {/* View Switcher Button */}
            <PlotTableButton viewMode={viewMode} setViewMode={setViewMode} />

            {/* Summary Controls */}
            <div className="d-flex align-items-center gap-2 ms-auto">
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

            {/* Settings Button */}
            <div>
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
