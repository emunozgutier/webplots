import React from 'react';
import { usePlotLayoutStore } from '../../store/PlotLayoutStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';
import { generatePlotConfig } from '../../utils/PlotlyHelpers';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import { useGroupSideMenuStore } from '../../store/GroupSideMenuStore';


interface ControllerButtonsProps {
    onOpenSettings: () => void;
    onOpenDebug: () => void;
}

const ControllerButtons: React.FC<ControllerButtonsProps> = ({ onOpenSettings, onOpenDebug }) => {
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig } = useTraceConfigStore();
    const { data } = useCsvDataStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();

    const handleSaveHTML = () => {
        const { plotData, layout } = generatePlotConfig(data, sideMenuData, groupSideMenuData, plotLayout, traceConfig);

        // Basic HTML template to render the plot
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
        <div className="btn-group">
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={onOpenDebug}
                title="Toggle Code Receipt"
            >
                Debug Trace
            </button>
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleSaveHTML}
                title="Save as Interactive HTML"
            >
                Save as interactive HTML
            </button>
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={onOpenSettings}
                title="Open Settings"
            >
                Settings
            </button>
        </div>
    );
};

export default ControllerButtons;
