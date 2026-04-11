import type { Layout, Data } from 'plotly.js';
import type { CsvDataStore } from '../store/CsvDataStore';
import type { AxisSideMenuData } from '../store/AxisSideMenuStore';
import type { PlotLayout } from '../store/PlotLayoutStore';
import type { TraceConfig } from '../store/TraceConfigStore';
import type { StyleSideMenuData } from '../store/StyleSideMenuStore';
import type { SubplotSideMenuState } from '../store/SubplotSideMenuStore';
import type { TraceStats } from '../store/InkRatioStore';

import type { TraceData } from './DataFrameLib';

const ensurePlotlyCompatibleData = (data: any[]): { processedData: any[], isDate: boolean } => {
    if (!data || data.length === 0) return { processedData: data, isDate: false };

    let detectedDate = false;
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    const timePattern = /^\d{1,2}:\d{2}(:\d{2})?$/;

    const processedData = data.map(v => {
        if (typeof v !== 'string') return v;

        const str = v.trim();
        if (str === '') return v;

        if (datePattern.test(str)) {
            const d = Date.parse(str);
            if (!isNaN(d)) {
                detectedDate = true;
                return d;
            }
        }

        if (timePattern.test(str)) {
            // Normalize time string (HH:MM or H:MM) into a full datetime string for parsing
            const timePart = str.split(':').length === 2 ? `${str}:00` : str;
            const fullStr = `1970-01-01T${timePart.padStart(8, '0')}`;
            const d = Date.parse(fullStr);
            if (!isNaN(d)) {
                detectedDate = true;
                return d;
            }
        }

        return v;
    });

    return { processedData, isDate: detectedDate };
};

export const generatePlotConfig = (
    data: CsvDataStore[],
    processedTraces: TraceData[],
    sideMenuData: AxisSideMenuData,
    plotLayout: PlotLayout,
    traceConfig: TraceConfig,
    colorSideMenuData: StyleSideMenuData,
    subplotSideMenuData: SubplotSideMenuState,
    absorptionMode: 'none' | 'size' | 'glow',
    maxRadiusRatio: number = 3,
    groupAxis: string | null = null
) => {
    const { plotType, xAxis, yAxis } = sideMenuData;
    const { enableLogAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange, histogramBarmode, legendOrientation, pointTip } = plotLayout;

    const { traceCustomizations, currentPaletteColors } = traceConfig;
    const { rows, cols, traceToSubplots } = subplotSideMenuData;

    const hasData = data.length > 0 && yAxis.length > 0;

    if (!hasData) {
        return {
            plotData: [] as Data[],
            layout: {},
            hasData: false,
            stats: {},
            receipt: '// No data available to generate plot.'
        };
    }

    let isXAxisDate = false;
    let isYAxisDate = false;

    const stats: Record<string, TraceStats> = {};

    // Create Plotly traces
    const plotData: Data[] = processedTraces.flatMap((traceInfo, index) => {
        const { fullTraceName, yCol, groupName, xData, yData, rowIndices } = traceInfo;

        const isSinglePlot = (rows * cols) <= 1;
        let assignedSubplots = traceToSubplots[fullTraceName];
        if (isSinglePlot || assignedSubplots === undefined) {
            assignedSubplots = [1];
        }

        // We will map over the assigned subplots to duplicate the trace if necessary
        return assignedSubplots.flatMap(subplotIndex => {
            // Inherit configurations: exact name overrides > parent column overrides > defaults
            const colCustomization = traceCustomizations?.[yCol] || {};
            const exactCustomization = traceCustomizations?.[fullTraceName] || {};

            // Generate axis strings
            const xAxisBase = subplotIndex === 1 ? 'x' : `x${subplotIndex}`;
            const yAxisBase = subplotIndex === 1 ? 'y' : `y${subplotIndex}`;

            // Merge settings
            const customization = { ...colCustomization, ...exactCustomization };

            const { hue, saturation, lightness, shape, size } = colorSideMenuData;

            // Auto-scaled helpers for "column" mappings
            const getColumnMapRule = (colName: string, outMin: number, outMax: number) => {
                const vals = data.map(r => r[colName]);
                const nums = vals.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(n => !isNaN(n));
                const min = nums.length > 0 ? Math.min(...nums) : 0;
                const max = nums.length > 0 ? Math.max(...nums) : 1;
                const range = (max - min) || 1;

                return (val: any) => {
                    const num = typeof val === 'number' ? val : parseFloat(String(val));
                    if (isNaN(num)) return outMin;
                    const pct = (num - min) / range;
                    let result = outMin + pct * (outMax - outMin);
                    // Clamp result to prevent CSS HSL parsing errors
                    if (outMax > outMin) {
                        result = Math.max(outMin, Math.min(outMax, result));
                    } else {
                        result = Math.max(outMax, Math.min(outMin, result));
                    }
                    return result;
                };
            };

            const getColumnCategoryRule = (colName: string, categories: string[]) => {
                const uniqueVals = Array.from(new Set(data.map(r => String(r[colName])))).sort();
                return (val: any) => {
                    const idx = uniqueVals.indexOf(String(val));
                    return categories[Math.max(0, idx) % categories.length];
                };
            };

            // Pre-compute lookup functions for column mappings
            const hueColMap = hue.source === 'column' ? getColumnMapRule(String(hue.value), hue.range ? hue.range[0] : 0, hue.range ? hue.range[1] : 360) : null;
            const satColMap = saturation.source === 'column' ? getColumnMapRule(String(saturation.value), saturation.range ? saturation.range[0] : 0, saturation.range ? saturation.range[1] : 100) : null;
            const litColMap = lightness.source === 'column' ? getColumnMapRule(String(lightness.value), lightness.range ? lightness.range[0] : 0, lightness.range ? lightness.range[1] : 100) : null;
            const sizeColMap = size.source === 'column' ? getColumnMapRule(String(size.value), size.range ? size.range[0] : 2, size.range ? size.range[1] : 20) : null;

            const SHAPE_OPTS = ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'pentagon', 'hexagram', 'star'];
            const shapeColMap = shape.source === 'column' ? getColumnCategoryRule(String(shape.value), SHAPE_OPTS) : null;

            // Compute aesthetics arrays
            const computedColors: string[] = [];
            const computedShapes: string[] = [];
            const computedSizes: number[] = [];

            rowIndices.forEach(dataIndex => {
                const row = data[dataIndex];

                // HUE
                let h = 200; // Default when disabled
                if (hue.enabled !== false) {
                    if (hue.source === 'manual') h = Number(hue.value);
                    else if (hue.source === 'group') h = (index * 137.5) % 360; // Golden angle spread
                    else if (hue.source === 'column' && hueColMap) h = hueColMap(row[String(hue.value)]);
                }

                // SATURATION
                let s = 80; // Default when disabled
                if (saturation.enabled !== false) {
                    if (saturation.source === 'manual') s = Number(saturation.value);
                    else if (saturation.source === 'group') s = 50 + ((index * 30) % 50);
                    else if (saturation.source === 'column' && satColMap) s = satColMap(row[String(saturation.value)]);
                }

                // LIGHTNESS
                let l = 50; // Default when disabled
                if (lightness.enabled !== false) {
                    if (lightness.source === 'manual') l = Number(lightness.value);
                    else if (lightness.source === 'group') l = 40 + ((index * 20) % 40);
                    else if (lightness.source === 'column' && litColMap) l = litColMap(row[String(lightness.value)]);
                }

                computedColors.push(`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`);

                // SHAPE
                let sh = 'circle'; // Default when disabled
                if (shape.enabled !== false) {
                    if (shape.source === 'manual') sh = String(shape.value);
                    else if (shape.source === 'group') sh = SHAPE_OPTS[index % SHAPE_OPTS.length];
                    else if (shape.source === 'column' && shapeColMap) sh = shapeColMap(row[String(shape.value)]);
                }

                computedShapes.push(sh);

                // SIZE
                let si = 8; // Default when disabled
                if (size.enabled !== false) {
                    if (size.source === 'manual') si = Number(size.value);
                    else if (size.source === 'group') si = 8 + ((index * 2) % 10); // cycle sizes 8 to 16
                    else if (size.source === 'column' && sizeColMap) si = sizeColMap(row[String(size.value)]);
                }

                computedSizes.push(si);
            });

            // Resolve final display name
            let finalName = exactCustomization.displayName || fullTraceName;
            if (!exactCustomization.displayName && colCustomization.displayName && groupName) {
                finalName = `${colCustomization.displayName} (${groupName})`;
            }

            // Trace level overrides (if a user explicitly forces a color/symbol from TraceConfig Menu, it kills dynamic behavior)
            const traceColorOverlay = customization.color;
            const traceSymbolOverlay = customization.symbol;

            // Default mode is 'markers' unless specified
            let mode: 'lines' | 'markers' | 'lines+markers' = customization.mode || 'markers';
            const marker: any = {};

            // Apply arrays or overlay
            marker.color = traceColorOverlay || computedColors;
            marker.symbol = traceSymbolOverlay || computedShapes;
            marker.size = customization.size || computedSizes;

            if (plotType === 'histogram') {
                const { processedData: compatibleYData, isDate: yIsDate } = ensurePlotlyCompatibleData(yData);
                if (yIsDate) isXAxisDate = true; // For histograms, yData is on the X axis

                let processedYData = compatibleYData;
                const traceBins = customization.histogramBins;
                if (traceBins) {
                    const { start, end, underflow, overflow } = traceBins;
                    const EPSILON = 1e-6; // Ensure values fall nicely into start/end bins
                    processedYData = compatibleYData.map(v => {
                        let num = typeof v === 'number' ? v : parseFloat(String(v));
                        if (isNaN(num)) return v;
                        if (underflow && num < start) num = start + EPSILON;
                        if (overflow && num > end) num = end - EPSILON;
                        return num;
                    });
                }

                stats[fullTraceName] = { filtered: 0, min: 0, max: 0, avg: 0 }; // Histograms don't ink filter yet

                const histTrace: any = {
                    x: processedYData,
                    type: 'histogram',
                    name: finalName,
                    opacity: processedTraces.length > 1 ? 0.7 : 1,
                    marker: {
                        color: marker.color,
                    }
                };

                if (traceBins) {
                    histTrace.xbins = {
                        start: traceBins.start,
                        end: traceBins.end,
                        size: traceBins.size
                    };
                    histTrace.autobinx = false;
                }

                // Assign axes
                histTrace.xaxis = xAxisBase;
                histTrace.yaxis = yAxisBase;

                return [histTrace];
            }

            const { processedData: finalX, isDate: xIsDate } = ensurePlotlyCompatibleData(xData);
            const { processedData: finalY, isDate: yIsDate } = ensurePlotlyCompatibleData(yData);
            if (xIsDate) isXAxisDate = true;
            if (yIsDate) isYAxisDate = true;
            
            const filteredCount = traceInfo.filteredCount || 0;
            const absorbedCounts = traceInfo.absorbedCounts || [];
            const survivingIndices = traceInfo.survivingIndices;


            // Calculate max absorbed in this trace
            let maxAbsorbed = 0;
            let minAbsorbed = 0;
            let totalAbsorbed = 0;

            if (absorbedCounts.length > 0) {
                maxAbsorbed = Math.max(...absorbedCounts);
                minAbsorbed = Math.min(...absorbedCounts);
                totalAbsorbed = absorbedCounts.reduce((acc, val) => acc + val, 0);
            }

            const avgAbsorbed = absorbedCounts.length > 0 ? (totalAbsorbed / absorbedCounts.length) : 0;

            stats[fullTraceName] = {
                filtered: filteredCount,
                min: minAbsorbed,
                max: maxAbsorbed,
                avg: avgAbsorbed
            };

            let finalMarkerColor = marker.color;
            let finalMarkerSymbol = marker.symbol;
            let finalMarkerSize = marker.size;
            let finalMarkerLine = marker.line;

            if (filteredCount > 0 && Array.isArray(marker.color) && survivingIndices) {
                // Retain only surviving indices to keep gradient intact
                finalMarkerColor = survivingIndices.map((idx: number) => computedColors[idx]);
            }
            if (filteredCount > 0 && Array.isArray(marker.symbol) && survivingIndices) {
                finalMarkerSymbol = survivingIndices.map((idx: number) => computedShapes[idx]);
            }
            if (filteredCount > 0 && Array.isArray(marker.size) && survivingIndices) {
                finalMarkerSize = survivingIndices.map((idx: number) => computedSizes[idx]);
            }

            // Apply visual tweaks based on absorptionMode!
            /*
              - If glow mode is selected, set max radius (or glow multiplier) to 3 based on absorbed ratio
              - If grow mode is selected, set max radius (size multiplier) to 2
            */

            let glowTrace: any = null;

            if (absorptionMode !== 'none' && absorbedCounts.length > 0 && maxAbsorbed > 0) {
                const baseSize = finalMarkerSize || 8;
                const baseColor = Array.isArray(finalMarkerColor) ? finalMarkerColor[0] : finalMarkerColor;

                if (absorptionMode === 'size') {
                    // Scale from baseSize to baseSize * maxRadiusRatio linearly based on (absorbed / maxAbsorbed)
                    finalMarkerSize = absorbedCounts.map((count, i) => {
                        const ratio = count / maxAbsorbed;
                        const thisBaseSize = Array.isArray(baseSize) ? baseSize[i] : baseSize;
                        return thisBaseSize + (thisBaseSize * (maxRadiusRatio - 1) * ratio);
                    });
                } else if (absorptionMode === 'glow') {
                    // Add a separate semi-transparent background trace for glow
                    const glowMarkerSize = absorbedCounts.map((count, i) => {
                        const ratio = count / maxAbsorbed;
                        const thisBaseSize = Array.isArray(baseSize) ? baseSize[i] : baseSize;
                        return thisBaseSize + (thisBaseSize * (maxRadiusRatio - 1) * ratio);
                    });

                    glowTrace = {
                        x: finalX,
                        y: finalY,
                        xaxis: xAxisBase,
                        yaxis: yAxisBase,
                        mode: mode,
                        type: 'scatter',
                        name: finalName + ' (Glow)',
                        hoverinfo: 'skip',
                        showlegend: false,
                        legendgroup: finalName,
                        opacity: 0.3,
                        line: {
                            color: baseColor,
                            width: 0,
                        },
                        marker: {
                            color: finalMarkerColor,
                            symbol: finalMarkerSymbol,
                            size: glowMarkerSize,
                            line: { width: 0 }
                        }
                    };
                }
            }

            // Determine Hover Template
            let hoverTemplateToUse = '';
            let effectiveHoverMode = pointTip || 'default';

            if (effectiveHoverMode === 'default' && legendOrientation === 'hidden') {
                effectiveHoverMode = 'xy_trace';
            }

            switch (effectiveHoverMode) {
                case 'xy':
                    hoverTemplateToUse = '%{x}, %{y}<extra></extra>';
                    break;
                case 'xy_absorbed':
                    hoverTemplateToUse = '%{x}, %{y}<br>Absorbed: %{customdata}<extra></extra>';
                    break;
                case 'xy_trace':
                    // Using Plotly's built-in extra trace name flag
                    hoverTemplateToUse = '%{x}, %{y}';
                    break;
                case 'default':
                default:
                    if (absorptionMode !== 'none') {
                        hoverTemplateToUse = '%{x}, %{y}<br>Absorbed: %{customdata}<extra></extra>';
                    } else {
                        hoverTemplateToUse = '%{x}, %{y}'; // normal plotly default with trace
                    }
                    break;
            }

            const mainTrace: any = {
                x: finalX,
                y: finalY,
                xaxis: xAxisBase,
                yaxis: yAxisBase,
                mode: mode,
                type: finalX.length > 50000 ? 'scattergl' : 'scatter',
                name: finalName,
                legendgroup: finalName,
                customdata: absorbedCounts, // inject it into Plotly for the hover template
                hovertemplate: hoverTemplateToUse === '%{x}, %{y}' ? undefined : hoverTemplateToUse,
                line: {
                    color: Array.isArray(finalMarkerColor) ? finalMarkerColor[0] : finalMarkerColor,
                },
                marker: {
                    ...marker,
                    color: finalMarkerColor,
                    symbol: finalMarkerSymbol,
                    size: finalMarkerSize,
                    line: finalMarkerLine
                }
            };

            return glowTrace ? [glowTrace, mainTrace] : [mainTrace];
        });
    });

    const layout: Partial<Layout> = {
        width: undefined,
        height: undefined,
        title: { text: plotTitle || (plotType === 'histogram' ? `Histogram: ${yAxis.join(', ')}` : `Plot: ${yAxis.join(', ')} vs ${xAxis || 'Row Number'}`) },
        xaxis: {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : (xAxis || 'Row Number')) },
            type: enableLogAxis ? 'log' : (isXAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (xRange || undefined),
            autorange: plotType === 'histogram' ? true : !xRange
        },
        yaxis: {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogAxis ? 'log' : (isYAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (yRange || undefined),
            autorange: plotType === 'histogram' ? true : !yRange
        },
        autosize: true,
        margin: { l: 50, r: 50, b: 50, t: 50 },
        showlegend: legendOrientation === 'hidden' ? false : (legendOrientation === 'auto' ? processedTraces.length > 1 : true),
        legend: legendOrientation === 'bottom' ? { orientation: 'h', yanchor: 'bottom', y: -0.2, xanchor: 'center', x: 0.5 } : undefined,
        barmode: plotType === 'histogram' ? (histogramBarmode || 'overlay') : undefined
    };

    // Subplots integration: if rows * cols > 1, inject grid configuration
    const totalSubplots = rows * cols;
    if (totalSubplots > 1) {
        layout.grid = { rows, columns: cols, pattern: 'independent' };

        // Construct standard axis configs
        const baseTargetXAxis = {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : (xAxis || 'Row Number')) },
            type: enableLogAxis ? 'log' : (isXAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (xRange || undefined),
            autorange: plotType === 'histogram' ? true : !xRange
        };
        const baseTargetYAxis = {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogAxis ? 'log' : (isYAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (yRange || undefined),
            autorange: plotType === 'histogram' ? true : !yRange
        };

        // Assign axes dynamically to Layout
        for (let i = 1; i <= totalSubplots; i++) {
            const xKey = i === 1 ? 'xaxis' : `xaxis${i}`;
            const yKey = i === 1 ? 'yaxis' : `yaxis${i}`;
            (layout as any)[xKey] = { ...baseTargetXAxis };
            (layout as any)[yKey] = { ...baseTargetYAxis };
        }
    }

    // Generate Receipt
    let receipt = `// Generated Plotly Code\n\n`;

    // Config variables
    if (plotType !== 'histogram') {
        receipt += `var xAxisName = '${xAxis || 'Row Number'}';\n`;
    }
    receipt += `var yAxisNames = [${yAxis.map((y: string) => `'${y}'`).join(', ')}];\n`;
    if (groupAxis) {
        receipt += `var groupAxisName = '${groupAxis}';\n`;
    }
    receipt += `\n`;

    let receiptTraces: string[] = [];
    let receiptTraceCount = 0;

    // Traces for receipt
    processedTraces.forEach((traceInfo, index) => {
        const { fullTraceName, yCol, groupName } = traceInfo;

        const getColor = (idx: number) => {
            if (!currentPaletteColors || currentPaletteColors.length === 0) return '#000000';
            return currentPaletteColors[idx % currentPaletteColors.length];
        };

        const isSinglePlot = (rows * cols) <= 1;
        let assignedSubplots = traceToSubplots[fullTraceName];
        if (isSinglePlot || assignedSubplots === undefined) {
            assignedSubplots = [1];
        }

        assignedSubplots.forEach(subplotIndex => {
            receiptTraceCount++;
            const traceVar = `trace${receiptTraceCount}`;
            const xAxisBase = subplotIndex === 1 ? 'x' : `x${subplotIndex}`;
            const yAxisBase = subplotIndex === 1 ? 'y' : `y${subplotIndex}`;

            const colCustomization = traceCustomizations?.[yCol] || {};
            const exactCustomization = traceCustomizations?.[fullTraceName] || {};
            const customization = { ...colCustomization, ...exactCustomization };
            customization.color = exactCustomization.color || undefined;

            let finalName = exactCustomization.displayName || fullTraceName;
            if (!exactCustomization.displayName && colCustomization.displayName && groupName) {
                finalName = `${colCustomization.displayName} (${groupName})`;
            }

            const baseColor = getColor(index);
            const finalColor = customization.color || baseColor;
            const finalSize = customization.size || 8;

            let mode = customization.mode || 'markers';
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
  opacity: ${processedTraces.length > 1 ? 0.7 : 1},
  marker: { color: '${finalColor}' },
  xaxis: '${xAxisBase}',
  yaxis: '${yAxisBase}'`;
                const traceBins = customization.histogramBins;
                if (traceBins) {
                    histCode += `,\n  autobinx: false,
  xbins: { start: ${traceBins.start}, end: ${traceBins.end}, size: ${traceBins.size} }`;
                }
                histCode += `\n};`;
                receiptTraces.push(histCode);
                return;
            }

            receiptTraces.push(`var ${traceVar} = {
  // x: ..., // Filtered data
  // y: ..., // Filtered data
  mode: '${mode}',
  type: 'scatter',
  name: '${finalName}',
  xaxis: '${xAxisBase}',
  yaxis: '${yAxisBase}',
  line: { color: '${finalColor}' }${markerParams}
};`);
        });
    });

    receipt += receiptTraces.join('\n\n') + '\n\n';

    receipt += `var data = [ ${Array.from({ length: receiptTraceCount }, (_, i) => `trace${i + 1}`).join(', ')} ];\n\n`;

    // Layout
    receipt += `var layout = {
  title: { text: '${layout.title?.text}' },
  autosize: true,`;

    if (totalSubplots > 1) {
        receipt += `\n  grid: { rows: ${rows}, columns: ${cols}, pattern: 'independent' },`;
        for (let i = 1; i <= totalSubplots; i++) {
            const xKey = i === 1 ? 'xaxis' : `xaxis${i}`;
            const yKey = i === 1 ? 'yaxis' : `yaxis${i}`;

            receipt += `\n  ${xKey}: {
    title: { text: '${layout.xaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : (isXAxisDate ? 'date' : 'linear')}',
    ${xRange ? `range: [${xRange[0]}, ${xRange[1]}]` : '// autorange: true'}
  },`;
            receipt += `\n  ${yKey}: {
    title: { text: '${layout.yaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : (isYAxisDate ? 'date' : 'linear')}',
    ${yRange ? `range: [${yRange[0]}, ${yRange[1]}]` : '// autorange: true'}
  },`;
        }
        receipt += `\n  `;
    } else {
        receipt += `
  xaxis: {
    title: { text: '${layout.xaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : (isXAxisDate ? 'date' : 'linear')}',
    ${xRange ? `range: [${xRange[0]}, ${xRange[1]}]` : '// autorange: true'}
  },
  yaxis: {
    title: { text: '${layout.yaxis?.title?.text}' },
    type: '${enableLogAxis ? 'log' : (isYAxisDate ? 'date' : 'linear')}',
    ${yRange ? `range: [${yRange[0]}, ${yRange[1]}]` : '// autorange: true'}
  },`;
    }

    receipt += `\n  showlegend: ${legendOrientation === 'hidden' ? 'false' : (legendOrientation === 'auto' ? processedTraces.length > 1 : 'true')}${legendOrientation === 'bottom' ? `,\n  legend: { orientation: 'h', yanchor: 'bottom', y: -0.2, xanchor: 'center', x: 0.5 }` : ''}
};\n\n`;

    receipt += `Plotly.newPlot('myDiv', data, layout);`;

    return {
        plotData,
        layout,
        hasData: true,
        stats,
        receipt,
        generatedTraces: processedTraces.map(t => ({
            fullTraceName: t.fullTraceName,
            yCol: t.yCol,
            groupName: t.groupName
        }))
    };
};

