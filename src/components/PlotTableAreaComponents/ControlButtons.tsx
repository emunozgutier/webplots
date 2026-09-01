import React, { useState, useMemo } from 'react';
import { ButtonGroup, ToggleButton, Button } from 'react-bootstrap';
import type { SummaryMode } from './TableAreaComponents/HeaderSummary';
import { useAppLocalStore } from '../../store/useAppLocalStore';
import SettingsPopup from './TableAreaComponents/SettingsPopup';
import { PlotTableButton } from './PlotTableButton';

// Plot specific store imports
import { usePlotLayoutStore } from '../../store/PlotTable/usePlotLayoutStore';
import { useTraceConfigStore } from '../../store/PlotTable/useTraceConfigStore';
import { generatePlotConfig } from '../../utils/PlotlyHelpers';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useAxisSideMenuStore } from '../../store/SideMenu/useAxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/SideMenu/useGroupSideMenuStore';
import { useStyleSideMenuStore } from '../../store/SideMenu/useStyleSideMenuStore';
import { useSubplotSideMenuStore } from '../../store/SideMenu/useSubplotSideMenuStore';
import { useInkRatioStore } from '../../store/SideMenu/useInkRatioStore';
import { useFilterSideMenuStore } from '../../store/SideMenu/useFilterSideMenuStore';
import { useWorkspaceStore } from '../../store/Workspace/useWorkspaceStore';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';
import { VideoExportModal } from './VideoExportModal';
import { runDataPipeline } from '../../utils/DataFrameLib';

interface ControlButtonsProps {
    viewMode: 'plot' | 'table';
    setViewMode: (mode: 'plot' | 'table') => void;
    // Table specific
    summaryMode?: SummaryMode;
    setSummaryMode?: (mode: SummaryMode) => void;
    // Plot specific
    onOpenSettings?: () => void;
    onOpenDebug?: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
    viewMode,
    setViewMode,
    summaryMode,
    setSummaryMode,
    onOpenSettings,
    onOpenDebug
}) => {
    // ----------------------------------------------------
    // Shared & Table Logic
    // ----------------------------------------------------
    const { setPopupContent } = useAppLocalStore();

    const handleOpenTableSettings = () => {
        setPopupContent(<SettingsPopup />);
    };

    // ----------------------------------------------------
    // Plot Logic Hooks (Always run unconditionally)
    // ----------------------------------------------------
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig } = useTraceConfigStore();
    const { data } = useCsvDataStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { colorData } = useStyleSideMenuStore();
    const subplotData = useSubplotSideMenuStore();
    const { filters } = useFilterSideMenuStore();
    const { isDebugMode } = useWorkspaceStore();
    const { inkRatio, absorptionMode, absorbedPoint, maxRadiusRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius } = useInkRatioStore();

    const { animationData, setAnimationValue } = useAnimationSideMenuStore();
    const { animationColumn } = animationData;
    const [showExportModal, setShowExportModal] = useState(false);

    const uniqueValues = useMemo(() => {
        if (!animationColumn || data.length === 0) return [];
        const values = new Set<string | number>();
        for (let i = 0; i < data.length; i++) {
            const val = data[i][animationColumn];
            if (val !== undefined && val !== null && val !== '') {
                values.add(val);
            }
        }
        return Array.from(values).sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') return a - b;
            return String(a).localeCompare(String(b));
        });
    }, [animationColumn, data]);

    const handleSaveHTML = () => {
        const { processedTraces } = runDataPipeline(data, filters, sideMenuData, groupSideMenuData, {
            inkRatio,
            absorbedPoint,
            chartWidth,
            chartHeight,
            pointRadius,
            useCustomRadius,
            customRadius,
            enableLogXAxis: plotLayout.enableLogXAxis,
            enableLogYAxis: plotLayout.enableLogYAxis
        }, colorData);

        const { plotData, layout } = generatePlotConfig(
            data,
            processedTraces,
            sideMenuData,
            plotLayout,
            traceConfig,
            colorData,
            subplotData,
            absorptionMode,
            maxRadiusRatio,
            groupSideMenuData.groupAxis
        );

        const layoutObj = layout as Record<string, unknown>;
        const titleObj = layoutObj?.title as Record<string, unknown> | undefined;
        const titleText = titleObj?.text as string | undefined;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${(titleText || 'Plot')}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <div id="myDiv" style="width: 100%; height: 100vh;"></div>
    <script>
        var data = ${JSON.stringify(plotData)};
        var layout = ${JSON.stringify(layout)};
        Plotly.newPlot('myDiv', data, layout);
    </script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plot.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ----------------------------------------------------
    // Layout Render
    // ----------------------------------------------------
    if (viewMode === 'table') {
        return (
            <div className="d-flex gap-4 align-items-center w-100">
                {/* View Switcher Button */}
                <PlotTableButton viewMode={viewMode} setViewMode={setViewMode} />

                {/* Summary Controls */}
                {summaryMode !== undefined && setSummaryMode !== undefined && (
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
                )}

                {/* Settings Button */}
                <div className={summaryMode === undefined ? "ms-auto" : ""}>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleOpenTableSettings}
                        title="Table Settings"
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className="bi bi-gear-fill"></i>
                    </Button>
                </div>
            </div>
        );
    }

    // Otherwise, viewMode === 'plot'
    return (
        <div className="d-flex justify-content-between align-items-center w-100">
            {/* View Switcher Button */}
            <PlotTableButton viewMode={viewMode} setViewMode={setViewMode} />

            <div className="btn-group btn-group-sm">
                {isDebugMode && onOpenDebug && (
                    <>
                        <span className={`btn btn-outline-secondary disabled fw-bold ${!animationColumn && data.length > 2048 ? 'text-warning' : ''}`} title={!animationColumn && data.length > 2048 ? `Dataset too large! Showing only the first 2,048 of ${data.length.toLocaleString()} points.` : "Total Points"}>
                            {!animationColumn && data.length > 2048 && <i className="bi bi-exclamation-triangle-fill me-1"></i>}
                            {!animationColumn && data.length > 2048 ? `2,048 out of ${data.length.toLocaleString()} pts` : `${data.length.toLocaleString()} pts`}
                        </span>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={onOpenDebug}
                            title="Toggle Code Receipt"
                        >
                            <i className="bi bi-code-square me-1"></i>
                            Debug Trace
                        </button>
                    </>
                )}
                <button
                    className="btn btn-outline-secondary"
                    onClick={handleSaveHTML}
                    title="Save as Interactive HTML"
                >
                    <i className="bi bi-filetype-html me-1"></i>
                    Save as HTML
                </button>
                {animationColumn && uniqueValues.length > 0 && (
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowExportModal(true)}
                        title="Save as Video"
                    >
                        <i className="bi bi-camera-reels-fill me-1"></i>
                        Save as Video
                    </button>
                )}
                {onOpenSettings && (
                    <button
                        id="plot-settings-btn"
                        className="btn btn-outline-secondary"
                        onClick={onOpenSettings}
                        title="Open Settings"
                    >
                        <i className="bi bi-gear me-1"></i>
                        Settings
                    </button>
                )}
            </div>
            {showExportModal && (
                <VideoExportModal 
                    show={showExportModal} 
                    onHide={() => setShowExportModal(false)}
                    uniqueValues={uniqueValues}
                    setAnimationValue={setAnimationValue}
                />
            )}
        </div>
    );
};

export default ControlButtons;
