import React, { useState, useMemo } from 'react';
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
import { runDataPipeline } from '../../utils/DataFrameLib';
import { useWorkspaceStore } from '../../store/Workspace/useWorkspaceStore';
import { useAnimationSideMenuStore } from '../../store/SideMenu/useAnimationSideMenuStore';
import { VideoExportModal } from './VideoExportModal';
import { PlotTableButton } from './PlotTableButton';

interface PlotAreaControlButtonsProps {
    onOpenSettings: () => void;
    onOpenDebug: () => void;
    viewMode: 'plot' | 'table';
    setViewMode: (mode: 'plot' | 'table') => void;
}

const PlotAreaControlButtons: React.FC<PlotAreaControlButtonsProps> = ({
    onOpenSettings,
    onOpenDebug,
    viewMode,
    setViewMode
}) => {
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

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${((layout as any).title?.text || 'Plot')}</title>
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

    return (
        <div className="p-2 bg-light border-top d-flex justify-content-between align-items-center mt-auto shadow-sm" style={{ zIndex: 10 }}>
            {/* View Switcher Button */}
            <PlotTableButton viewMode={viewMode} setViewMode={setViewMode} />
            <div className="btn-group btn-group-sm">
                {isDebugMode && (
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
                <button
                    id="plot-settings-btn"
                    className="btn btn-outline-secondary"
                    onClick={onOpenSettings}
                    title="Open Settings"
                >
                    <i className="bi bi-gear me-1"></i>
                    Settings
                </button>
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

export default PlotAreaControlButtons;
