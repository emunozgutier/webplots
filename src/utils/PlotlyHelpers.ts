import type { Layout, Data } from 'plotly.js';
import type { PlotData } from '../store/PlotDataStore';
import type { SideMenuData } from '../store/SideMenuStore';
import type { PlotLayout } from '../store/PlotLayoutStore';

export const generatePlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotLayout: PlotLayout) => {
    const { xAxis, yAxis } = sideMenuData;
    const { enableLogAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange } = plotLayout;
    const hasData = data.length > 0 && !!xAxis && yAxis.length > 0;

    if (!hasData) {
        return {
            plotData: [] as Data[],
            layout: {},
            hasData: false,
            receipt: '// No data available to generate plot.'
        };
    }

    const x = data.map(row => row[xAxis]);

    // Create a trace for each Y-axis column
    const plotData: Data[] = yAxis.map(yCol => ({
        x: x,
        y: data.map(row => row[yCol]),
        mode: 'lines',
        type: 'scatter',
        name: yCol
    }));

    const layout: Partial<Layout> = {
        width: undefined,
        height: undefined,
        title: { text: plotTitle || `Plot: ${yAxis.join(', ')} vs ${xAxis}` },
        xaxis: {
            title: { text: xAxisTitle || xAxis },
            type: enableLogAxis ? 'log' : 'linear',
            range: xRange || undefined,
            autorange: !xRange
        },
        yaxis: {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogAxis ? 'log' : 'linear',
            range: yRange || undefined,
            autorange: !yRange
        },
        autosize: true,
        margin: { l: 50, r: 50, b: 50, t: 50 },
        showlegend: yAxis.length > 1
    };

    // Generate Receipt
    let receipt = `// Generated Plotly Code\n\n`;

    // Config variables
    receipt += `var xAxisName = '${xAxis}';\n`;
    receipt += `var yAxisNames = [${yAxis.map(y => `'${y}'`).join(', ')}];\n\n`;

    // Traces
    const tracesReceipt = yAxis.map((yCol, index) => {
        const traceVar = `trace${index + 1}`;
        return `var ${traceVar} = {
  // x: data.map(r => r['${xAxis}']), // Data not shown
  // y: data.map(r => r['${yCol}']), // Data not shown
  mode: 'lines',
  type: 'scatter',
  name: '${yCol}'
};`;
    }).join('\n\n');

    receipt += tracesReceipt + '\n\n';

    receipt += `var data = [ ${yAxis.map((_, i) => `trace${i + 1}`).join(', ')} ];\n\n`;

    // Layout
    receipt += `var layout = {
  title: { text: '${layout.title?.text}' },
  xaxis: {
    title: { text: '${layout.xaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : 'linear'}',
    ${xRange ? `range: [${xRange[0]}, ${xRange[1]}]` : '// autorange: true'}
  },
  yaxis: {
    title: { text: '${layout.yaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : 'linear'}',
    ${yRange ? `range: [${yRange[0]}, ${yRange[1]}]` : '// autorange: true'}
  },
  showlegend: ${yAxis.length > 1}
};\n\n`;

    receipt += `Plotly.newPlot('myDiv', data, layout);`;

    return {
        plotData,
        layout,
        hasData: true,
        receipt
    };
};
