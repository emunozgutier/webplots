import React from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import { useTableStore } from '../../../../store/PlotTable/useTableStore';
import type { SummaryMode } from '../HeaderSummary';

const General: React.FC = () => {
    const { 
        summaryMode, 
        setSummaryMode, 
        colorMode, 
        setColorMode 
    } = useTableStore();

    return (
        <div className="d-flex flex-column gap-4">
            {/* Summary Section */}
            <div>
                <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Summary Display</label>
                <ButtonGroup className="w-100" size="sm">
                    <ToggleButton
                        id="settings-summary-none"
                        type="radio"
                        variant={summaryMode === 'none' ? 'primary' : 'outline-primary'}
                        name="settingsSummaryMode"
                        value="none"
                        checked={summaryMode === 'none'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        None
                    </ToggleButton>
                    <ToggleButton
                        id="settings-summary-slim"
                        type="radio"
                        variant={summaryMode === 'slim' ? 'primary' : 'outline-primary'}
                        name="settingsSummaryMode"
                        value="slim"
                        checked={summaryMode === 'slim'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        Slim
                    </ToggleButton>
                    <ToggleButton
                        id="settings-summary-detailed"
                        type="radio"
                        variant={summaryMode === 'detailed' ? 'primary' : 'outline-primary'}
                        name="settingsSummaryMode"
                        value="detailed"
                        checked={summaryMode === 'detailed'}
                        onChange={(e) => setSummaryMode(e.currentTarget.value as SummaryMode)}
                    >
                        Detailed
                    </ToggleButton>
                </ButtonGroup>
                <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                    {summaryMode === 'none' && "Hide all summary statistics from the header."}
                    {summaryMode === 'slim' && "Show only basic count and type information."}
                    {summaryMode === 'detailed' && "Show full descriptive statistics (Mean, Std Dev, Min/Max)."}
                </div>
            </div>

            {/* Color Coding Section */}
            <div>
                <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Heatmap Effect</label>
                <ButtonGroup className="w-100" size="sm">
                    <ToggleButton
                        id="settings-color-on"
                        type="radio"
                        variant={colorMode === 'color' ? 'success' : 'outline-success'}
                        name="settingsColorMode"
                        value="color"
                        checked={colorMode === 'color'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        Enabled
                    </ToggleButton>
                    <ToggleButton
                        id="settings-color-off"
                        type="radio"
                        variant={colorMode === 'none' ? 'secondary' : 'outline-secondary'}
                        name="settingsColorMode"
                        value="none"
                        checked={colorMode === 'none'}
                        onChange={(e) => setColorMode(e.currentTarget.value as 'none' | 'color')}
                    >
                        Disabled
                    </ToggleButton>
                </ButtonGroup>
                <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                    Color numeric cells based on their value relative to the column's range.
                </div>
            </div>
        </div>
    );
};

export default General;
