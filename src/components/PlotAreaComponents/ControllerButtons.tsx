import React from 'react';
import { usePlotAreaStore, createPlotConfig } from '../../store/PlotAreaStore';
import { usePlotDataStore } from '../../store/PlotDataStore';
import { useSideMenuStore } from '../../store/SideMenuStore';


const ControllerButtons: React.FC = () => {
    const { plotArea, toggleReceipt, toggleSettings } = usePlotAreaStore();
    const { data } = usePlotDataStore();
    const { sideMenuData } = useSideMenuStore();

    const handleSaveHTML = () => {
        const { plotData, layout } = createPlotConfig(data, sideMenuData, plotArea);

        // Basic HTML template to render the plot
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${layout.title?.text || 'Plot'}</title>
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
                className={`btn btn-sm ${plotArea.showReceipt ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={toggleReceipt}
                title="Toggle Code Receipt"
            >
                bug
            </button>
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleSaveHTML}
                title="Save as Interactive HTML"
            >
                html
            </button>
            <button
                className={`btn btn-sm ${plotArea.isSettingsOpen ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={toggleSettings}
                title="Open Settings"
            >
                settings
            </button>
        </div>
    );
};

export default ControllerButtons;
