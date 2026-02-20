import type { Layout, Data } from 'plotly.js';
import type { CsvDataStore } from '../store/CsvDataStore';
import type { AxisSideMenuData } from '../store/AxisSideMenuStore';
import type { PlotLayout } from '../store/PlotLayoutStore';
import type { TraceConfig } from '../store/TraceConfigStore';

export const generatePlotConfig = (
    data: CsvDataStore[],
    sideMenuData: AxisSideMenuData,
    plotLayout: PlotLayout,
    traceConfig: TraceConfig,
    inkRatio: number = 1,
    chartWidth: number = 1280,
    chartHeight: number = 720,
    pointRadius: number = 8,
    useCustomRadius: boolean = false,
    customRadius: number = 20
) => {
    const { xAxis, yAxis } = sideMenuData;
    const { enableLogAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange } = plotLayout;

    // Trace config from the new store
    const { traceCustomizations, currentPaletteColors } = traceConfig;

    const hasData = data.length > 0 && !!xAxis && yAxis.length > 0;

    if (!hasData) {
        return {
            plotData: [] as Data[],
            layout: {},
            hasData: false,
            stats: {},
            receipt: '// No data available to generate plot.'
        };
    }

    const x = data.map(row => row[xAxis]);

    // Helper to get color from current palette array (cycling if needed)
    const getColor = (index: number) => {
        if (!currentPaletteColors || currentPaletteColors.length === 0) return '#000000';
        return currentPaletteColors[index % currentPaletteColors.length];
    };

    const minPixelDist = useCustomRadius
        ? customRadius
        : pointRadius * 2 * (1 - inkRatio);

    const stats: Record<string, number> = {};

    // Helper to filter points
    const filterPoints = (xData: any[], yData: any[], xType: 'log' | 'linear', yType: 'log' | 'linear') => {
        if (!useCustomRadius && inkRatio >= 1) return { x: xData, y: yData, filteredCount: 0 };

        const xMin = Math.min(...xData);
        const xMax = Math.max(...xData);
        const yMin = Math.min(...yData);
        const yMax = Math.max(...yData);

        const xRangeVal = xType === 'log' ? Math.log10(xMax) - Math.log10(xMin) : xMax - xMin;
        const yRangeVal = yType === 'log' ? Math.log10(yMax) - Math.log10(yMin) : yMax - yMin;

        const xToPx = (val: number) => {
            const normalized = xType === 'log'
                ? (Math.log10(val) - Math.log10(xMin)) / xRangeVal
                : (val - xMin) / xRangeVal;
            return normalized * chartWidth;
        };

        const yToPx = (val: number) => {
            const normalized = yType === 'log'
                ? (Math.log10(val) - Math.log10(yMin)) / yRangeVal
                : (val - yMin) / yRangeVal;
            return (1 - normalized) * chartHeight; // Y is inverted in screen coords
        };

        const filteredX: any[] = [];
        const filteredY: any[] = [];
        const points: { px: number, py: number }[] = [];

        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(xData[i]);
            const py = yToPx(yData[i]);
            let keep = true;

            // Simple check against all kept points. For large datasets, a quadtree would be better.
            // Optimization: check against last few points or use a grid?
            // For now, strict check against all kept points.
            for (let j = 0; j < points.length; j++) {
                const dx = px - points[j].px;
                const dy = py - points[j].py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minPixelDist) {
                    keep = false;
                    break;
                }
            }

            if (keep) {
                points.push({ px, py });
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
            }
        }

        return { x: filteredX, y: filteredY, filteredCount: xData.length - filteredX.length };
    };

    // Create a trace for each Y-axis column
    const plotData: Data[] = yAxis.map((yCol: string, index: number) => {
        const customization = traceCustomizations?.[yCol] || {};
        const baseColor = getColor(index);

        // Default mode is 'lines' unless specified
        let mode: 'lines' | 'markers' | 'lines+markers' = customization.mode || 'lines';
        const marker: any = {};

        // If specific symbol is set
        if (customization.symbol) {
            // If user selected a symbol, we ensure markers are visible
            if (mode === 'lines') {
                mode = 'lines+markers';
            }
            marker.symbol = customization.symbol;
            marker.size = customization.size || 8; // Default size for symbols
        }

        // If explicit mode is 'markers', we force markers
        if (customization.mode === 'markers') {
            mode = 'markers';
            if (!customization.symbol) {
                marker.symbol = 'circle'; // Default marker
            }
            marker.size = customization.size || 8;
        }

        const yData = data.map(row => row[yCol]);

        // Apply filtering
        const { x: finalX, y: finalY, filteredCount } = filterPoints(
            x,
            yData,
            enableLogAxis ? 'log' : 'linear',
            enableLogAxis ? 'log' : 'linear'
        );

        stats[yCol] = filteredCount;

        return {
            x: finalX,
            y: finalY,
            mode: mode,
            type: 'scatter',
            name: customization.displayName || yCol,
            line: {
                color: customization.color || baseColor,
                // If dot is selected, maybe we want a dotted line too? 
                // Using dash for dot symbol might look better if user intended line style.
                // But for now, sticking to marker interpretation.
            },
            marker: marker
        };
    });

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
    receipt += `var yAxisNames = [${yAxis.map((y: string) => `'${y}'`).join(', ')}];\n\n`;

    // Traces
    const tracesReceipt = yAxis.map((yCol: string, index: number) => {
        const traceVar = `trace${index + 1}`;
        const customization = traceCustomizations?.[yCol] || {};
        const baseColor = getColor(index);
        const finalColor = customization.color || baseColor;
        const finalName = customization.displayName || yCol;
        const finalSize = customization.size || 8;

        let mode = customization.mode || 'lines';
        let markerParams = '';

        if (customization.symbol) {
            if (mode === 'lines') mode = 'lines+markers';
            markerParams = `, marker: { symbol: '${customization.symbol}', size: ${finalSize} }`;
        }

        if (customization.mode === 'markers') {
            mode = 'markers';
            if (!customization.symbol) {
                markerParams = `, marker: { symbol: 'circle', size: ${finalSize} }`;
            } else {
                markerParams = `, marker: { symbol: '${customization.symbol}', size: ${finalSize} }`;
            }
        }

        return `var ${traceVar} = {
  // x: data.map(r => r['${xAxis}']), // Data not shown
  // y: data.map(r => r['${yCol}']), // Data not shown
  mode: '${mode}',
  type: 'scatter',
  name: '${finalName}',
  line: { color: '${finalColor}' }${markerParams}
};`;
    }).join('\n\n');

    receipt += tracesReceipt + '\n\n';

    receipt += `var data = [ ${yAxis.map((_: string, i: number) => `trace${i + 1}`).join(', ')} ];\n\n`;

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
        stats,
        receipt
    };
};
