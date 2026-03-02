import type { Layout, Data } from 'plotly.js';
import type { CsvDataStore } from '../store/CsvDataStore';
import type { AxisSideMenuData } from '../store/AxisSideMenuStore';
import type { GroupSideMenuData } from '../store/GroupSideMenuStore';
import type { PlotLayout } from '../store/PlotLayoutStore';
import type { TraceConfig } from '../store/TraceConfigStore';
import type { ColorSideMenuData } from '../store/ColorSideMenuStore';
import type { TraceStats } from '../store/InkRatioStore';

export const generatePlotConfig = (
    data: CsvDataStore[],
    sideMenuData: AxisSideMenuData,
    groupSideMenuData: GroupSideMenuData,
    plotLayout: PlotLayout,
    traceConfig: TraceConfig,
    colorSideMenuData: ColorSideMenuData,
    absorptionMode: 'none' | 'size' | 'glow',
    maxRadiusRatio: number = 3,
    inkRatio: number = 1,
    chartWidth: number = 1280,
    chartHeight: number = 720,
    pointRadius: number = 8,
    useCustomRadius: boolean = false,
    customRadius: number = 20
) => {
    const { plotType, xAxis, yAxis } = sideMenuData;
    const { groupAxis, groupSettings } = groupSideMenuData;
    const { enableLogAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange, histogramBarmode } = plotLayout;

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

    const stats: Record<string, TraceStats> = {};

    // Helper to filter points (mainly for Scatter)
    const filterPoints = (xData: any, yData: any, xType: 'log' | 'linear', yType: 'log' | 'linear', traceRadius?: number) => {
        // Determine effective radius for this trace
        const effectiveRadius = traceRadius || pointRadius;

        const minPixelDist = useCustomRadius
            ? customRadius
            : effectiveRadius * 2 * (1 - inkRatio);

        if (!useCustomRadius && inkRatio >= 1) return { x: xData, y: yData, filteredCount: 0, absorbedCounts: new Array(xData.length).fill(0) };
        if (xData.length === 0) return { x: [], y: [], filteredCount: 0, absorbedCounts: [] };

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

        let validX = numsX;
        let validY = numsY;

        // Determine Min/Max based on VALID numbers
        const validNumsX = numsX.filter((n: number) => !isNaN(n));
        const validNumsY = numsY.filter((n: number) => !isNaN(n));

        if (validNumsX.length === 0 || validNumsY.length === 0) {
            console.warn('[InkRatio] Cannot determine numeric range for filtering. Skipping.');
            return { x: xData, y: yData, filteredCount: 0, absorbedCounts: new Array(xData.length).fill(0) };
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
        const absorbedCounts: number[] = [];
        const points: { px: number, py: number, absorbed: number, originalIndex: number }[] = [];

        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(validX[i]);
            const py = yToPx(validY[i]);

            if (px === -9999 || py === -9999) {
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                absorbedCounts.push(0);
                continue;
            }

            let keptBy = -1;

            // Simple check against all kept points.
            for (let j = 0; j < points.length; j++) {
                const dx = px - points[j].px;
                const dy = py - points[j].py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minPixelDist) {
                    keptBy = j;
                    break;
                }
            }

            if (keptBy === -1) {
                // Keep this point
                points.push({ px, py, absorbed: 0, originalIndex: i });
                filteredX.push(xData[i]);
                filteredY.push(yData[i]);
                absorbedCounts.push(0); // Initialize its count to 0 in our output array
            } else {
                // Absorbed by another point
                points[keptBy].absorbed += 1;
                // Update the count for the point that absorbed this one
                absorbedCounts[points[keptBy].originalIndex] = points[keptBy].absorbed;
            }
        }

        const finalAbsorbedCounts = new Array(filteredX.length).fill(0);

        let pointIdx = 0;
        for (let i = 0; i < xData.length; i++) {
            const px = xToPx(validX[i]);
            const py = yToPx(validY[i]);
            if (px === -9999 || py === -9999) {
                finalAbsorbedCounts[pointIdx++] = 0;
            } else {
                // Is this point in our kept list?
                const keptPoint = points.find(p => p.originalIndex === i);
                if (keptPoint) {
                    finalAbsorbedCounts[pointIdx++] = keptPoint.absorbed;
                }
            }
        }

        return { x: filteredX, y: filteredY, filteredCount: xData.length - filteredX.length, absorbedCounts: finalAbsorbedCounts };
    };

    // Prepare traces
    let generatedTraces: {
        yCol: string;
        groupName: string; // The suffix or group identifier
        fullTraceName: string; // The unique key for customization
        xData: any[];
        yData: any[];
        rowIndices: number[]; // the original indices of these points in the 'data' array for column mapping lookup
    }[] = [];

    if (groupAxis) {
        const settings = groupSettings[groupAxis];
        const isManual = settings && settings.mode === 'manual';

        if (isManual) {
            const bins = settings.bins;

            yAxis.forEach(yCol => {
                // Group indices by bin index
                const binGroups: Record<number, number[]> = {};

                data.forEach((row, idx) => {
                    const val = row[groupAxis];
                    const numVal = typeof val === 'number' ? val : parseFloat(String(val));


                    for (let i = 0; i < bins.length; i++) {
                        const bin = bins[i];
                        let match = false;

                        // Handle numeric comparisons
                        if (!isNaN(numVal)) {
                            switch (bin.operator) {
                                case '>': match = numVal > bin.value; break;
                                case '>=': match = numVal >= bin.value; break;
                                case '<': match = numVal < bin.value; break;
                                case '<=': match = numVal <= bin.value; break;
                                case '==': match = numVal == bin.value; break;
                                case '!=': match = numVal != bin.value; break;
                            }
                        } else {
                            // Non-numeric fallback (only == and !=)
                            if (bin.operator === '==') match = String(val) === String(bin.value);
                            if (bin.operator === '!=') match = String(val) !== String(bin.value);
                        }

                        if (match) {
                            if (!binGroups[i]) binGroups[i] = [];
                            binGroups[i].push(idx);
                            break;
                        }
                    }
                });

                // Create traces for matched bins
                bins.forEach((bin: any, binIdx: number) => {
                    const indices = binGroups[binIdx];
                    if (!indices || indices.length === 0) return;

                    generatedTraces.push({
                        yCol: yCol,
                        groupName: bin.label,
                        fullTraceName: `${yCol} (${bin.label})`,
                        xData: indices.map(i => data[i][xAxis]),
                        yData: indices.map(i => data[i][yCol]),
                        rowIndices: indices
                    });
                });
            });

        } else {
            // 1. Find unique values for the group axis
            const groupValues = Array.from(new Set(data.map(row => row[groupAxis]))).filter(v => v !== null && v !== undefined);
            // Sort for consistency
            groupValues.sort();

            // 2. For each Y-axis, create traces for each group
            yAxis.forEach(yCol => {
                groupValues.forEach(groupVal => {
                    const groupValStr = String(groupVal);
                    // Filter data for this group
                    const indices = data.map((row, idx) => row[groupAxis] == groupVal ? idx : -1).filter(idx => idx !== -1);

                    if (indices.length === 0) return;

                    generatedTraces.push({
                        yCol: yCol,
                        groupName: `${groupAxis}=${groupValStr}`,
                        fullTraceName: `${yCol} (${groupAxis}=${groupValStr})`,
                        xData: indices.map(i => data[i][xAxis]),
                        yData: indices.map(i => data[i][yCol]),
                        rowIndices: indices
                    });
                });
            });
        }

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
                yData: data.map(row => row[yCol]),
                rowIndices: data.map((_, i) => i) // Full dataset map
            });
        });
    }

    // Enforce 8 trace limit
    if (generatedTraces.length > 8) {
        console.warn(`[Plot] Too many traces (${generatedTraces.length}). Truncating to 8.`);
        generatedTraces = generatedTraces.slice(0, 8);
    }

    // Create Plotly traces
    const plotData: Data[] = generatedTraces.flatMap((traceInfo, index) => {
        const { fullTraceName, yCol, groupName, xData, yData, rowIndices } = traceInfo;

        // Inherit configurations: exact name overrides > parent column overrides > defaults
        const colCustomization = traceCustomizations?.[yCol] || {};
        const exactCustomization = traceCustomizations?.[fullTraceName] || {};

        // Merge settings
        const customization = { ...colCustomization, ...exactCustomization };

        const { hue, saturation, lightness, shape } = colorSideMenuData;

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
                return outMin + pct * (outMax - outMin);
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
        const hueColMap = hue.source === 'column' ? getColumnMapRule(String(hue.value), 0, 360) : null;
        const satColMap = saturation.source === 'column' ? getColumnMapRule(String(saturation.value), 0, 100) : null;
        const litColMap = lightness.source === 'column' ? getColumnMapRule(String(lightness.value), 0, 100) : null;

        const SHAPE_OPTS = ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'pentagon', 'hexagram', 'star'];
        const shapeColMap = shape.source === 'column' ? getColumnCategoryRule(String(shape.value), SHAPE_OPTS) : null;

        // Compute aesthetics arrays
        const computedColors: string[] = [];
        const computedShapes: string[] = [];

        rowIndices.forEach(dataIndex => {
            const row = data[dataIndex];

            // HUE
            let h = 0;
            if (hue.source === 'manual') h = Number(hue.value);
            else if (hue.source === 'group') h = (index * 137.5) % 360; // Golden angle spread
            else if (hue.source === 'column' && hueColMap) h = hueColMap(row[String(hue.value)]);

            // SATURATION
            let s = 80;
            if (saturation.source === 'manual') s = Number(saturation.value);
            else if (saturation.source === 'group') s = 50 + ((index * 30) % 50);
            else if (saturation.source === 'column' && satColMap) s = satColMap(row[String(saturation.value)]);

            // LIGHTNESS
            let l = 50;
            if (lightness.source === 'manual') l = Number(lightness.value);
            else if (lightness.source === 'group') l = 40 + ((index * 20) % 40);
            else if (lightness.source === 'column' && litColMap) l = litColMap(row[String(lightness.value)]);

            computedColors.push(`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`);

            // SHAPE
            let sh = 'circle';
            if (shape.source === 'manual') sh = String(shape.value);
            else if (shape.source === 'group') sh = SHAPE_OPTS[index % SHAPE_OPTS.length];
            else if (shape.source === 'column' && shapeColMap) sh = shapeColMap(row[String(shape.value)]);

            computedShapes.push(sh);
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
        marker.size = customization.size || 8;

        if (plotType === 'histogram') {
            let processedYData = yData;
            const traceBins = customization.histogramBins;
            if (traceBins) {
                const { start, end, underflow, overflow } = traceBins;
                const EPSILON = 1e-6; // Ensure values fall nicely into start/end bins
                processedYData = yData.map(v => {
                    let num = parseFloat(String(v));
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
                opacity: generatedTraces.length > 1 ? 0.7 : 1,
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

            return [histTrace];
        }

        // Apply filtering for Scatter
        const { x: finalX, y: finalY, filteredCount, absorbedCounts } = filterPoints(
            xData,
            yData,
            enableLogAxis ? 'log' : 'linear',
            enableLogAxis ? 'log' : 'linear',
            marker.size
        );

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

        if (filteredCount > 0 && Array.isArray(marker.color)) {
            // Decalibrate custom color mappings if they've been stripped by filtering
            finalMarkerColor = computedColors[0];
            finalMarkerSymbol = computedShapes[0];
        }

        // Apply visual tweaks based on absorptionMode!
        /*
          - If glow mode is selected, set max radius (or glow multiplier) to 3 based on absorbed ratio
          - If grow mode is selected, set max radius (size multiplier) to 2
        */

        let glowTrace: any = null;

        if (absorptionMode !== 'none' && absorbedCounts.length > 0 && maxAbsorbed > 0) {
            const baseSize = marker.size || 8;
            const baseColor = Array.isArray(finalMarkerColor) ? finalMarkerColor[0] : finalMarkerColor;

            if (absorptionMode === 'size') {
                // Scale from baseSize to baseSize * maxRadiusRatio linearly based on (absorbed / maxAbsorbed)
                finalMarkerSize = absorbedCounts.map(count => {
                    const ratio = count / maxAbsorbed;
                    return baseSize + (baseSize * (maxRadiusRatio - 1) * ratio);
                });
            } else if (absorptionMode === 'glow') {
                // Add a separate semi-transparent background trace for glow
                const glowMarkerSize = absorbedCounts.map(count => {
                    const ratio = count / maxAbsorbed;
                    return baseSize + (baseSize * (maxRadiusRatio - 1) * ratio);
                });

                glowTrace = {
                    x: finalX,
                    y: finalY,
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

        const mainTrace: any = {
            x: finalX,
            y: finalY,
            mode: mode,
            type: 'scatter',
            name: finalName,
            legendgroup: finalName,
            customdata: absorbedCounts, // inject it into Plotly for the hover template
            hovertemplate: '%{x}, %{y}, Absorbed points: %{customdata}<extra></extra>',
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

    const layout: Partial<Layout> = {
        width: undefined,
        height: undefined,
        title: { text: plotTitle || (plotType === 'histogram' ? `Histogram: ${yAxis.join(', ')}` : `Plot: ${yAxis.join(', ')} vs ${xAxis}`) },
        xaxis: {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : xAxis) },
            type: enableLogAxis ? 'log' : 'linear',
            range: plotType === 'histogram' ? undefined : (xRange || undefined),
            autorange: plotType === 'histogram' ? true : !xRange
        },
        yaxis: {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogAxis ? 'log' : 'linear',
            range: plotType === 'histogram' ? undefined : (yRange || undefined),
            autorange: plotType === 'histogram' ? true : !yRange
        },
        autosize: true,
        margin: { l: 50, r: 50, b: 50, t: 50 },
        showlegend: generatedTraces.length > 1,
        barmode: plotType === 'histogram' ? (histogramBarmode || 'overlay') : undefined
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
        const { fullTraceName, yCol, groupName } = traceInfo;
        const traceVar = `trace${index + 1}`;

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
  opacity: ${generatedTraces.length > 1 ? 0.7 : 1},
  marker: { color: '${finalColor}' }`;
            const traceBins = customization.histogramBins;
            if (traceBins) {
                histCode += `,\n  autobinx: false,
  xbins: { start: ${traceBins.start}, end: ${traceBins.end}, size: ${traceBins.size} }`;
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
        receipt,
        generatedTraces: generatedTraces.map(t => ({
            fullTraceName: t.fullTraceName,
            yCol: t.yCol,
            groupName: t.groupName
        }))
    };
};
