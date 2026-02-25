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
    const { plotType, xAxis, yAxis, groupAxis } = sideMenuData;
    const { enableLogAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange, histogramBins } = plotLayout;

    // Trace config from the new store
    const { traceCustomizations, currentPaletteColors } = traceConfig;

    const hasData = plotType === 'histogram'
        ? data.length > 0 && yAxis.length > 0
        : data.length > 0 && !!xAxis && yAxis.length > 0;

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

    const stats: Record<string, number> = {};

    // Helper to filter points (mainly for Scatter)
    const filterPoints = (xData: any, yData: any, xType: 'log' | 'linear', yType: 'log' | 'linear', traceRadius?: number) => {
        // Determine effective radius for this trace
        const effectiveRadius = traceRadius || pointRadius;

        const minPixelDist = useCustomRadius
            ? customRadius
            : effectiveRadius * 2 * (1 - inkRatio);

        if (!useCustomRadius && inkRatio >= 1) return { x: xData, y: yData, filteredCount: 0 };
        if (xData.length === 0) return { x: [], y: [], filteredCount: 0 };

        // Robust conversion to numbers
        const toNum = (v: any): number => {
            if (typeof v === 'number') return v;
            const n = parseFloat(v);
            if (!isNaN(n) && isFinite(n)) return n;
            const d = Date.parse(v);
            if (!isNaN(d)) return d;
            return NaN;
        };

        const numsX = xData.map(toNum);
        const numsY = yData.map(toNum);

        // Check if we have valid numbers. If strict categorical, we might need a different approach.
        // If >50% NaN, assume categorical?
        // Let's just filter what we can calculate.

        let validX = numsX;
        let validY = numsY;

        // Determine Min/Max based on VALID numbers
        const validNumsX = numsX.filter((n: number) => !isNaN(n));
        const validNumsY = numsY.filter((n: number) => !isNaN(n));

        // If essentially no valid numbers, we can't filter by distance distance properly potentially.
        // Fallback: If no valid numbers, treat as index-based (0 to 1 range?) to avoid breaking?
        // Or just return original data.
        if (validNumsX.length === 0 || validNumsY.length === 0) {
            console.warn('[InkRatio] Cannot determine numeric range for filtering. Skipping.');
            return { x: xData, y: yData, filteredCount: 0 };
        }

        const xMin = Math.min(...validNumsX);
        const xMax = Math.max(...validNumsX);
        const yMin = Math.min(...validNumsY);
        const yMax = Math.max(...validNumsY);

        // Avoid division by zero
        const safeW = chartWidth || 1;
        const safeH = chartHeight || 1;

        const xRangeVal = (xType === 'log' ? Math.log10(xMax) - Math.log10(xMin) : xMax - xMin) || 1;
        const yRangeVal = (yType === 'log' ? Math.log10(yMax) - Math.log10(yMin) : yMax - yMin) || 1;

        const xToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = xType === 'log'
                ? (Math.log10(val) - Math.log10(xMin)) / xRangeVal
                : (val - xMin) / xRangeVal;
            return normalized * safeW;
        };

        const yToPx = (val: number) => {
            if (isNaN(val)) return -9999;
            const normalized = yType === 'log'
                ? (Math.log10(val) - Math.log10(yMin)) / yRangeVal
                : (val - yMin) / yRangeVal;
            return (1 - normalized) * safeH; // Y is inverted in screen coords
        };

        const filteredX: any[] = [];
        const filteredY: any[] = [];
        const points: { px: number, py: number }[] = [];

        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(validX[i]);
            const py = yToPx(validY[i]);

            // If invalid coordinates, keep safely? Or drop? Keep.
            if (px === -9999 || py === -9999) {
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                continue;
            }

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

    // Prepare traces
    let generatedTraces: {
        yCol: string;
        groupName: string; // The suffix or group identifier
        fullTraceName: string; // The unique key for customization
        xData: any[];
        yData: any[];
    }[] = [];

    if (groupAxis) {
        // 1. Find unique values for the group axis
        const groupValues = Array.from(new Set(data.map(row => row[groupAxis]))).filter(v => v !== null && v !== undefined);
        // Sort for consistency
        groupValues.sort();

        // 2. For each Y-axis, create traces for each group
        // Total limit check later, or break early?
        // Let's generate all and then slice.

        yAxis.forEach(yCol => {
            groupValues.forEach(groupVal => {
                const groupValStr = String(groupVal);
                // Filter data for this group
                const indices = data.map((row, idx) => row[groupAxis] == groupVal ? idx : -1).filter(idx => idx !== -1);

                if (indices.length === 0) return;

                const groupX = indices.map(i => data[i][xAxis]);
                const groupY = indices.map(i => data[i][yCol]);

                generatedTraces.push({
                    yCol: yCol,
                    groupName: `${groupAxis}=${groupValStr}`,
                    fullTraceName: `${yCol} (${groupAxis}=${groupValStr})`,
                    xData: groupX,
                    yData: groupY
                });
            });
        });

    } else {
        // Standard behavior
        yAxis.forEach(yCol => {
            // For histograms, we don't necessarily have x since there's no xAxis selected
            const hasXAxis = plotType !== 'histogram' && xAxis;
            generatedTraces.push({
                yCol: yCol,
                groupName: '',
                fullTraceName: yCol,
                xData: hasXAxis ? x : [],
                yData: data.map(row => row[yCol])
            });
        });
    }

    // Enforce 8 trace limit
    if (generatedTraces.length > 8) {
        console.warn(`[Plot] Too many traces (${generatedTraces.length}). Truncating to 8.`);
        generatedTraces = generatedTraces.slice(0, 8);
    }

    // Create Plotly traces
    const plotData: Data[] = generatedTraces.map((traceInfo, index) => {
        const { fullTraceName, xData, yData } = traceInfo;
        const customization = traceCustomizations?.[fullTraceName] || {};
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

        if (plotType === 'histogram') {
            // Histogram logic
            // Apply over/underflow clamping to yData
            let processedYData = yData;
            if (histogramBins) {
                const { start, end, underflow, overflow } = histogramBins;
                const EPSILON = 1e-6; // Ensure values fall nicely into start/end bins
                processedYData = yData.map(v => {
                    let num = parseFloat(v);
                    if (isNaN(num)) return v;
                    if (underflow && num < start) num = start + EPSILON;
                    if (overflow && num > end) num = end - EPSILON;
                    return num;
                });
            }

            stats[fullTraceName] = 0; // Or calculate clipped points

            const histTrace: any = {
                x: processedYData, // In Plotly histogram, providing `x` creates vertical bars for that distribution
                type: 'histogram',
                name: customization.displayName || fullTraceName,
                marker: {
                    color: customization.color || baseColor,
                }
            };

            if (histogramBins) {
                histTrace.xbins = {
                    start: histogramBins.start,
                    end: histogramBins.end,
                    size: histogramBins.size
                };
                histTrace.autobinx = false;
            }

            return histTrace;
        }

        // Apply filtering for Scatter
        // We pass the trace's specific size (or default 8 if not set)
        const traceSize = customization.size || 8;

        const { x: finalX, y: finalY, filteredCount } = filterPoints(
            xData,
            yData,
            enableLogAxis ? 'log' : 'linear',
            enableLogAxis ? 'log' : 'linear',
            traceSize
        );

        stats[fullTraceName] = filteredCount;

        return {
            x: finalX,
            y: finalY,
            mode: mode,
            type: 'scatter',
            name: customization.displayName || fullTraceName,
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
        title: { text: plotTitle || (plotType === 'histogram' ? `Histogram: ${yAxis.join(', ')}` : `Plot: ${yAxis.join(', ')} vs ${xAxis}`) },
        xaxis: {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : xAxis) },
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
        showlegend: generatedTraces.length > 1
    };

    // Generate Receipt
    let receipt = `// Generated Plotly Code\n\n`;

    // Config variables
    if (plotType !== 'histogram') {
        receipt += `var xAxisName = '${xAxis}';\n`;
    }
    receipt += `var yAxisNames = [${yAxis.map((y: string) => `'${y}'`).join(', ')}];\n`;
    if (groupAxis) {
        receipt += `var groupAxisName = '${groupAxis}';\n`;
    }
    receipt += `\n`;

    // Traces
    const tracesReceipt = generatedTraces.map((traceInfo, index) => {
        const { fullTraceName } = traceInfo;
        const traceVar = `trace${index + 1}`;
        const customization = traceCustomizations?.[fullTraceName] || {};
        const baseColor = getColor(index);
        const finalColor = customization.color || baseColor;
        const finalName = customization.displayName || fullTraceName;
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

        if (plotType === 'histogram') {
            let histCode = `var ${traceVar} = {
  // x: ..., // Histogram data mapped from yAxis
  type: 'histogram',
  name: '${finalName}',
  marker: { color: '${finalColor}' }`;
            if (histogramBins) {
                histCode += `,\n  autobinx: false,
  xbins: { start: ${histogramBins.start}, end: ${histogramBins.end}, size: ${histogramBins.size} }`;
            }
            histCode += `\n};`;
            return histCode;
        }

        return `var ${traceVar} = {
  // x: ..., // Filtered data
  // y: ..., // Filtered data
  mode: '${mode}',
  type: 'scatter',
  name: '${finalName}',
  line: { color: '${finalColor}' }${markerParams}
};`;
    }).join('\n\n');

    receipt += tracesReceipt + '\n\n';

    receipt += `var data = [ ${generatedTraces.map((_, i) => `trace${i + 1}`).join(', ')} ];\n\n`;

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
  showlegend: ${generatedTraces.length > 1}
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
