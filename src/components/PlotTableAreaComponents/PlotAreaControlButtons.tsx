import React from 'react';
import { usePlotLayoutStore } from '../../store/usePlotLayoutStore';
import { useTraceConfigStore } from '../../store/SideMenu/useTraceConfigStore';
import { generatePlotConfig } from '../../utils/PlotlyHelpers';
import { useCsvDataStore } from '../../store/useCsvDataStore';
import { useAxisSideMenuStore } from '../../store/SideMenu/useAxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/SideMenu/useGroupSideMenuStore';
import { useStyleSideMenuStore } from '../../store/SideMenu/useStyleSideMenuStore';
import { useSubplotSideMenuStore } from '../../store/SideMenu/useSubplotSideMenuStore';
import { useInkRatioStore } from '../../store/SideMenu/useInkRatioStore';
import { useFilterSideMenuStore } from '../../store/SideMenu/useFilterSideMenuStore';
import { runDataPipeline } from '../../utils/DataFrameLib';

interface PlotAreaControlButtonsProps {
    onOpenSettings: () => void;
    onOpenDebug: () => void;
}

const PlotAreaControlButtons: React.FC<PlotAreaControlButtonsProps> = ({ onOpenSettings, onOpenDebug }) => {
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig } = useTraceConfigStore();
    const { data } = useCsvDataStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { colorData } = useStyleSideMenuStore();
    const subplotData = useSubplotSideMenuStore();
    const { filters } = useFilterSideMenuStore();
    const { inkRatio, absorptionMode, maxRadiusRatio, chartWidth, chartHeight, pointRadius, useCustomRadius, customRadius } = useInkRatioStore();

    const handleSaveHTML = () => {
        const { processedTraces } = runDataPipeline(data, filters, sideMenuData, groupSideMenuData, {
            inkRatio,
            chartWidth,
            chartHeight,
            pointRadius,
            useCustomRadius,
            customRadius,
            enableLogAxis: plotLayout.enableLogAxis
        });

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
        <div className="p-2 bg-light border-top d-flex justify-content-end align-items-center mt-auto shadow-sm" style={{ zIndex: 10 }}>
            <div className="btn-group btn-group-sm">
                <button
                    className="btn btn-outline-secondary"
                    onClick={onOpenDebug}
                    title="Toggle Code Receipt"
                >
                    <i className="bi bi-code-square me-1"></i>
                    Debug Trace
                </button>
                <button
                    className="btn btn-outline-secondary"
                    onClick={handleSaveHTML}
                    title="Save as Interactive HTML"
                >
                    <i className="bi bi-filetype-html me-1"></i>
                    Save as HTML
                </button>
                <button
                    className="btn btn-outline-secondary"
                    onClick={onOpenSettings}
                    title="Open Settings"
                >
                    <i className="bi bi-gear me-1"></i>
                    Settings
                </button>
            </div>
        </div>
    );
};

export default PlotAreaControlButtons;
