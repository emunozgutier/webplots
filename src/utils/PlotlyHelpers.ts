import type { Layout, Data } from 'plotly.js';
import type { CsvDataStore } from '../store/useCsvDataStore';
import type { AxisSideMenuData } from '../store/SideMenu/useAxisSideMenuStore';
import type { PlotLayout } from '../store/PlotTable/usePlotLayoutStore';
import type { TraceConfig } from '../store/PlotTable/useTraceConfigStore';
import type { StyleSideMenuData } from '../store/SideMenu/useStyleSideMenuStore';
import type { SubplotSideMenuState } from '../store/SideMenu/useSubplotSideMenuStore';
import type { TraceStats } from '../store/SideMenu/useInkRatioStore';
import type { AnimationSideMenuData } from '../store/SideMenu/useAnimationSideMenuStore';
import type { AnnotationConfig } from '../store/SideMenu/useAnnotationSideMenuStore';
import { parseToNumeric, calculateLogBase } from './TableMathLib';
import type { TraceData } from './DataFrameLib';

const ensurePlotlyCompatibleData = (data: any[]): { processedData: any[], isDate: boolean } => {
    if (!data || data.length === 0) return { processedData: data, isDate: false };

    let detectedDate = false;
    const datePattern = /^\d{4}-\d{2}-\d{2}/;
    const timePattern = /^\d{1,2}:\d{2}(:\d{2})?$/;

    const processedData = data.map(v => {
        const numV = parseToNumeric(v);
        if (numV !== null) {
            if (typeof v === 'string' && (datePattern.test(v.trim()) || timePattern.test(v.trim()))) {
                detectedDate = true;
            }
            return numV;
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
    absorptionMode: 'none' | 'size' | 'glow' | 'glass',
    maxRadiusRatio: number = 3,
    groupAxis: string | null = null,
    animationData?: AnimationSideMenuData,
    annotationData?: AnnotationConfig[]
) => {
    const { plotType, xAxis, yAxis } = sideMenuData;
    const { enableLogXAxis, enableLogYAxis, plotTitle, xAxisTitle, yAxisTitle, xRange, yRange, histogramBarmode, legendOrientation, pointTip, customHoverConfig } = plotLayout;

    const { traceCustomizations, currentPaletteColors } = traceConfig;
    const getColor = (idx: number) => {
        if (!currentPaletteColors || currentPaletteColors.length === 0) return '#000000';
        return currentPaletteColors[idx % currentPaletteColors.length];
    };
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

    let globalXMin = Infinity, globalXMax = -Infinity;
    let globalYMin = Infinity, globalYMax = -Infinity;

    if (animationData && animationData.animationColumn) {
        processedTraces.forEach(t => {
            t.xData.forEach(v => {
                const num = parseToNumeric(v);
                if (num !== null && !isNaN(num)) {
                    if (num < globalXMin) globalXMin = num;
                    if (num > globalXMax) globalXMax = num;
                }
            });
            t.yData.forEach(v => {
                const num = parseToNumeric(v);
                if (num !== null && !isNaN(num)) {
                    if (num < globalYMin) globalYMin = num;
                    if (num > globalYMax) globalYMax = num;
                }
            });
        });

        if (globalXMin !== Infinity) {
            const span = globalXMax - globalXMin || Math.abs(globalXMax) * 0.1 || 1;
            globalXMin -= span * 0.05;
            globalXMax += span * 0.05;
        }
        if (globalYMin !== Infinity) {
            const span = globalYMax - globalYMin || Math.abs(globalYMax) * 0.1 || 1;
            globalYMin -= span * 0.05;
            globalYMax += span * 0.05;
        }
    }

    // Create Plotly traces
    const plotData: Data[] = processedTraces.flatMap((origTraceInfo, index) => {
        let traceInfo = origTraceInfo;

        if (animationData && animationData.animationColumn && animationData.animationValue !== null) {
            const animCol = animationData.animationColumn;
            const animVal = animationData.animationValue;

            const baseSurviving = origTraceInfo.survivingIndices || origTraceInfo.rowIndices.map((_, i) => i);
            const baseAbsorbed = origTraceInfo.absorbedCounts || [];

            const newX: any[] = [];
            const newY: any[] = [];
            const newSurviving: number[] = [];
            const newAbsorbed: number[] = [];

            for (let i = 0; i < baseSurviving.length; i++) {
                const survivingIdx = baseSurviving[i];
                const dataIndex = origTraceInfo.rowIndices[survivingIdx];
                const row = data[dataIndex];
                if (row && row[animCol] === animVal) {
                    newSurviving.push(survivingIdx);
                    newX.push(origTraceInfo.xData[i]);
                    newY.push(origTraceInfo.yData[i]);
                    if (baseAbsorbed.length > i) newAbsorbed.push(baseAbsorbed[i]);
                }
            }

            traceInfo = {
                ...origTraceInfo,
                xData: newX,
                yData: newY,
                survivingIndices: newSurviving,
                absorbedCounts: newAbsorbed
            };
        }

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
            const getColumnMapRule = (colName: string, outMin: number, outMax: number, mappingType?: string, midPoint?: [number, number]) => {
                let min = Infinity;
                let max = -Infinity;
                for (let i = 0; i < data.length; i++) {
                    const v = data[i][colName];
                    const num = typeof v === 'number' ? v : parseFloat(String(v));
                    if (!isNaN(num)) {
                        if (num < min) min = num;
                        if (num > max) max = num;
                    }
                }
                if (min === Infinity) {
                    min = 0;
                    max = 1;
                }
                const range = (max - min) || 1;

                return (val: any) => {
                    const num = typeof val === 'number' ? val : parseFloat(String(val));
                    if (isNaN(num)) return outMin;
                    
                    let x = (num - min) / range;
                    x = Math.max(0, Math.min(1, x)); // clip to 0-1 range

                    let pct = x;
                    if ((mappingType === 'curve' || mappingType === 'exponential' || mappingType === 'logarithmic') && midPoint) {
                        const cx = Math.max(0.001, Math.min(0.999, midPoint[0]));
                        const cy = Math.max(0.001, Math.min(0.999, midPoint[1]));
                        const isExp = cy <= cx || mappingType === 'exponential';
                        
                        if (isExp) {
                            const kRaw = Math.log(cy) / Math.log(cx);
                            const k = Math.max(1, Math.min(30, kRaw));
                            pct = Math.pow(x, k);
                        } else {
                            const B = calculateLogBase(cx, cy);
                            pct = Math.log(1 + (B - 1) * x) / Math.log(B);
                        }
                    }

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
                const uniqueValsSet = new Set<string>();
                for (let i = 0; i < data.length; i++) {
                    uniqueValsSet.add(String(data[i][colName]));
                }
                const uniqueVals = Array.from(uniqueValsSet).sort();
                return (val: any) => {
                    const idx = uniqueVals.indexOf(String(val));
                    return categories[Math.max(0, idx) % categories.length];
                };
            };

            // Pre-compute lookup functions for column mappings
            const hueColMap = hue.source === 'column' ? getColumnMapRule(String(hue.value), hue.range ? hue.range[0] : 0, hue.range ? hue.range[1] : 360, hue.mappingType, hue.midPoint) : null;
            const satColMap = saturation.source === 'column' ? getColumnMapRule(String(saturation.value), saturation.range ? saturation.range[0] : 0, saturation.range ? saturation.range[1] : 100, saturation.mappingType, saturation.midPoint) : null;
            const litColMap = lightness.source === 'column' ? getColumnMapRule(String(lightness.value), lightness.range ? lightness.range[0] : 0, lightness.range ? lightness.range[1] : 100, lightness.mappingType, lightness.midPoint) : null;
            const sizeColMap = size.source === 'column' ? getColumnMapRule(String(size.value), size.range ? size.range[0] : 2, size.range ? size.range[1] : 20, size.mappingType, size.midPoint) : null;

            const SHAPE_OPTS = ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'pentagon', 'hexagram', 'star'];
            const shapeColMap = shape.source === 'column' ? getColumnCategoryRule(String(shape.value), SHAPE_OPTS) : null;

            // Compute aesthetics arrays
            const computedColors: string[] = [];
            const computedShapes: string[] = [];
            const computedSizes: number[] = [];
            const computedHoverTexts: string[] = [];

            const safeSurvivingIndices = traceInfo.survivingIndices || rowIndices.map((_, i) => i);
            const absorbedCounts = traceInfo.absorbedCounts || [];

            safeSurvivingIndices.forEach((survivingIdx, loopIdx) => {
                const dataIndex = rowIndices[survivingIdx];
                const row = data[dataIndex];

                // HUE
                let h = 200; // Default when disabled
                if (hue.enabled !== false) {
                    if (hue.source === 'manual') h = Number(hue.value);
                    else if (hue.source === 'group') h = (index * 137.5) % 360; // Golden angle spread
                    else if (hue.source === 'column' && hueColMap) {
                        const rawH = hueColMap(row[String(hue.value)]);
                        h = ((rawH + (hue.offset || 0)) % 360 + 360) % 360;
                    }
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

                let finalColorStr = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
                if (hue.enabled !== false && hue.source === 'column') {
                    const colVal = String(row[String(hue.value)]);
                    if (colorSideMenuData.groupColorOverrides && colorSideMenuData.groupColorOverrides[colVal]) {
                        finalColorStr = colorSideMenuData.groupColorOverrides[colVal];
                    }
                }
                computedColors.push(finalColorStr);

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

                let hoverStr = '';
                
                if (pointTip === 'custom' && customHoverConfig) {
                    const { showLabels, selectedColumns, showX, showY } = customHoverConfig;
                    const lines: string[] = [];
                    selectedColumns.forEach(col => {
                        const val = row[col] !== undefined ? row[col] : 'N/A';
                        if (showLabels) {
                            lines.push(`${col}: ${val}`);
                        } else {
                            lines.push(`${val}`);
                        }
                    });
                    if (lines.length > 0) {
                        const hasXY = showX || showY;
                        hoverStr = (hasXY ? '<br>' : '') + lines.join('<br>');
                    }
                } else {
                    if (groupAxis && row[groupAxis] !== undefined) {
                        hoverStr += `<br>${groupAxis}: ${row[groupAxis]}`;
                    } else if (groupName) {
                        hoverStr += `<br>Group: ${groupName}`;
                    }

                    if (hue.enabled !== false && hue.source === 'column') hoverStr += `<br>${hue.value} (Hue): ${row[String(hue.value)]}`;
                    if (saturation.enabled !== false && saturation.source === 'column') hoverStr += `<br>${saturation.value} (Sat): ${row[String(saturation.value)]}`;
                    if (lightness.enabled !== false && lightness.source === 'column') hoverStr += `<br>${lightness.value} (Light): ${row[String(lightness.value)]}`;
                    if (shape.enabled !== false && shape.source === 'column') hoverStr += `<br>${shape.value} (Shape): ${row[String(shape.value)]}`;
                    if (size.enabled !== false && size.source === 'column') hoverStr += `<br>${size.value} (Size): ${row[String(size.value)]}`;
                    
                    if (absorptionMode !== 'none') {
                        hoverStr += `<br>Absorbed: ${absorbedCounts[loopIdx] || 0}`;
                    }
                }

                computedHoverTexts.push(hoverStr);
            });

            // Resolve final display name
            let finalName = exactCustomization.displayName || fullTraceName;
            if (!exactCustomization.displayName && colCustomization.displayName && groupName) {
                finalName = `${colCustomization.displayName} (${groupName})`;
            }

            // Trace level overrides (if a user explicitly forces a color/symbol from TraceConfig Menu, it kills dynamic behavior)
            const traceColorOverlay = customization.color;
            const traceSymbolOverlay = customization.symbol;
            
            // Group level overrides
            const rawGrp = traceInfo.rawGroupName || '';
            const groupColorOverlay = colorSideMenuData.groupColorOverrides?.[rawGrp] || traceInfo.groupColor;
            const groupSymbolOverlay = colorSideMenuData.groupSymbolOverrides?.[rawGrp] || traceInfo.groupSymbol;

            // Default mode is 'markers' unless specified
            let mode: 'lines' | 'markers' | 'lines+markers' = customization.mode || 'markers';
            const marker: any = {};

            const activeSizeMode = size.sizeMode || 'diameter';
            const traceSizeref = activeSizeMode === 'area' ? Math.PI : 0.5;

            const baseColor = getColor(index);
            const finalColor = traceColorOverlay || groupColorOverlay || baseColor;

            const useComputedColors = hue.enabled !== false || saturation.enabled !== false || lightness.enabled !== false;
            const useComputedShapes = shape.enabled !== false;
            const useComputedSizes = size.enabled !== false;

            // Apply arrays or overlay (Trace > Group > Computed arrays)
            marker.color = traceColorOverlay || groupColorOverlay || (useComputedColors ? computedColors : finalColor);
            marker.symbol = traceSymbolOverlay || groupSymbolOverlay || (useComputedShapes ? computedShapes : undefined);
            marker.size = customization.size || (useComputedSizes ? computedSizes : undefined);

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
            // absorbedCounts already retrieved above
            // Calculate max absorbed in this trace
            let maxAbsorbed = 0;
            let minAbsorbed = 0;
            let totalAbsorbed = 0;

            if (absorbedCounts.length > 0) {
                maxAbsorbed = -Infinity;
                minAbsorbed = Infinity;
                for (let i = 0; i < absorbedCounts.length; i++) {
                    const val = absorbedCounts[i];
                    if (val > maxAbsorbed) maxAbsorbed = val;
                    if (val < minAbsorbed) minAbsorbed = val;
                    totalAbsorbed += val;
                }
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
            let finalMarkerOpacity: any = 0.7; // default transparency to see overlaps

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
                            sizemode: activeSizeMode,
                            sizeref: traceSizeref,
                            line: { width: 0 }
                        }
                    };
                } else if (absorptionMode === 'glass') {
                    const minOpacity = 0.15;
                    finalMarkerOpacity = absorbedCounts.map((count) => {
                        const ratio = count / maxAbsorbed;
                        return minOpacity + (1 - minOpacity) * ratio;
                    });
                    finalMarkerLine = { ...finalMarkerLine, width: 0 };
                }
            }

            // Determine Hover Template
            let hoverTemplateToUse = '';
            let effectiveHoverMode = pointTip || 'default';

            if (effectiveHoverMode === 'default' && legendOrientation === 'hidden') {
                effectiveHoverMode = 'xy_trace';
            }

            switch (effectiveHoverMode) {
                case 'custom':
                    if (customHoverConfig) {
                        const { showX, showY, showLabels } = customHoverConfig;
                        let customTemplate = '';
                        if (showX && showY) {
                            customTemplate = showLabels ? `X: %{x}<br>Y: %{y}` : `%{x}, %{y}`;
                        } else if (showX) {
                            customTemplate = showLabels ? `X: %{x}` : `%{x}`;
                        } else if (showY) {
                            customTemplate = showLabels ? `Y: %{y}` : `%{y}`;
                        }
                        hoverTemplateToUse = customTemplate ? `${customTemplate}%{hovertext}<extra></extra>` : `%{hovertext}<extra></extra>`;
                    } else {
                        hoverTemplateToUse = '%{x}, %{y}%{hovertext}<extra></extra>';
                    }
                    break;
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
                    hoverTemplateToUse = '%{x}, %{y}%{hovertext}<extra></extra>';
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
                hovertext: computedHoverTexts,
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
                    sizemode: activeSizeMode,
                    sizeref: traceSizeref,
                    line: { color: finalMarkerColor, ...finalMarkerLine },
                    ...(finalMarkerOpacity !== undefined && { opacity: finalMarkerOpacity })
                }
            };

            return glowTrace ? [glowTrace, mainTrace] : [mainTrace];
        });
    });

    let finalPlotTitle = plotTitle || (plotType === 'histogram' ? `Histogram: ${yAxis.join(', ')}` : `Plot: ${yAxis.join(', ')} vs ${xAxis || 'Row Number'}`);
    
    if (animationData && animationData.displayMode === 'subtitle' && animationData.animationValue !== null) {
        finalPlotTitle += `<br><sub>${animationData.animationColumn}: ${animationData.animationValue}</sub>`;
    }

    const layout: Partial<Layout> = {
        width: undefined,
        height: undefined,
        title: { text: finalPlotTitle },
        xaxis: {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : (xAxis || 'Row Number')) },
            type: enableLogXAxis ? 'log' : (isXAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (
                xRange ? (enableLogXAxis ? [Math.log10(Math.max(xRange[0], 1e-15)), Math.log10(Math.max(xRange[1], 1e-15))] : xRange) :
                (animationData && animationData.animationColumn && globalXMin !== Infinity ? 
                    (enableLogXAxis ? [Math.log10(Math.max(globalXMin, 1e-15)), Math.log10(Math.max(globalXMax, 1e-15))] : [globalXMin, globalXMax]) 
                : undefined)
            ),
            autorange: plotType === 'histogram' ? true : (!xRange && !(animationData && animationData.animationColumn && globalXMin !== Infinity))
        },
        yaxis: {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogYAxis ? 'log' : (isYAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (
                yRange ? (enableLogYAxis ? [Math.log10(Math.max(yRange[0], 1e-15)), Math.log10(Math.max(yRange[1], 1e-15))] : yRange) :
                (animationData && animationData.animationColumn && globalYMin !== Infinity ? 
                    (enableLogYAxis ? [Math.log10(Math.max(globalYMin, 1e-15)), Math.log10(Math.max(globalYMax, 1e-15))] : [globalYMin, globalYMax]) 
                : undefined)
            ),
            autorange: plotType === 'histogram' ? true : (!yRange && !(animationData && animationData.animationColumn && globalYMin !== Infinity))
        },
        autosize: true,
        margin: { l: 50, r: 50, b: 50, t: 50 },
        showlegend: processedTraces.length > 8 ? false : (legendOrientation === 'hidden' ? false : (legendOrientation === 'auto' ? processedTraces.length > 1 : true)),
        legend: {
            itemsizing: 'constant',
            ...(legendOrientation === 'bottom' ? { orientation: 'h', yanchor: 'bottom', y: -0.2, xanchor: 'center', x: 0.5 } : {})
        },
        barmode: plotType === 'histogram' ? (histogramBarmode || 'overlay') : undefined
    };

    if (animationData && animationData.displayMode === 'background' && animationData.animationValue !== null) {
        if (!layout.annotations) layout.annotations = [];
        layout.annotations.push({
            text: String(animationData.animationValue),
            font: {
                size: 150,
                color: 'rgba(200, 200, 200, 0.2)',
                family: 'Arial, sans-serif',
            },
            xref: 'paper',
            yref: 'paper',
            x: 0.5,
            y: 0.5,
            showarrow: false,
            xanchor: 'center',
            yanchor: 'middle',
            textangle: 0
        } as any);
    }

    if (annotationData && annotationData.length > 0) {
        if (!layout.annotations) layout.annotations = [];
        if (!layout.shapes) layout.shapes = [];

        annotationData.forEach(anno => {
            let targetX: any = 0;
            let targetY: any = 0;
            let found = false;

            if (anno.trackColumn && anno.trackValue) {
                // Find the point in the CURRENT frame's data
                const row = data.find(r => String(r[anno.trackColumn]) === String(anno.trackValue));
                if (row) {
                    targetX = xAxis ? row[xAxis] : 0;
                    targetY = yAxis.length > 0 ? row[yAxis[0]] : 0;
                    found = true;
                }
            }

            // Only draw if we found the tracking point OR it's a fixed annotation (no tracking)
            if (found || !anno.trackColumn) {
                if (anno.type === 'text') {
                    layout.annotations!.push({
                        text: anno.text,
                        x: found ? targetX : 0.5,
                        y: found ? targetY : 0.5,
                        xref: found ? 'x' : 'paper',
                        yref: found ? 'y' : 'paper',
                        showarrow: false,
                        xshift: anno.offsetX,
                        yshift: -anno.offsetY,
                        font: {
                            size: anno.fontSize,
                            color: anno.fontColor
                        }
                    } as any);
                } else if (anno.type === 'highlight') {
                    layout.shapes!.push({
                        type: 'rect',
                        xref: found ? 'x' : 'paper',
                        yref: found ? 'y' : 'paper',
                        x0: -anno.highlightSize / 2 + anno.offsetX,
                        y0: -anno.highlightSize / 2 - anno.offsetY,
                        x1: anno.highlightSize / 2 + anno.offsetX,
                        y1: anno.highlightSize / 2 - anno.offsetY,
                        xsizemode: 'pixel',
                        ysizemode: 'pixel',
                        xanchor: found ? targetX : 0.5,
                        yanchor: found ? targetY : 0.5,
                        line: {
                            color: anno.highlightColor,
                            width: 2
                        }
                    } as any);
                }
            }
        });
    }

    // Subplots integration: if rows * cols > 1, inject grid configuration
    const totalSubplots = rows * cols;
    if (totalSubplots > 1) {
        layout.grid = { rows, columns: cols, pattern: 'independent' };

        // Construct standard axis configs
        const baseTargetXAxis = {
            title: { text: xAxisTitle || (plotType === 'histogram' ? 'Value' : (xAxis || 'Row Number')) },
            type: enableLogXAxis ? 'log' : (isXAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (
                xRange ? (enableLogXAxis ? [Math.log10(Math.max(xRange[0], 1e-15)), Math.log10(Math.max(xRange[1], 1e-15))] : xRange) :
                (animationData && animationData.animationColumn && globalXMin !== Infinity ? 
                    (enableLogXAxis ? [Math.log10(Math.max(globalXMin, 1e-15)), Math.log10(Math.max(globalXMax, 1e-15))] : [globalXMin, globalXMax]) 
                : undefined)
            ),
            autorange: plotType === 'histogram' ? true : (!xRange && !(animationData && animationData.animationColumn && globalXMin !== Infinity))
        };
        const baseTargetYAxis = {
            title: { text: yAxisTitle || (yAxis.length === 1 ? yAxis[0] : 'Values') },
            type: enableLogYAxis ? 'log' : (isYAxisDate ? 'date' : 'linear'),
            range: plotType === 'histogram' ? undefined : (
                yRange ? (enableLogYAxis ? [Math.log10(Math.max(yRange[0], 1e-15)), Math.log10(Math.max(yRange[1], 1e-15))] : yRange) :
                (animationData && animationData.animationColumn && globalYMin !== Infinity ? 
                    (enableLogYAxis ? [Math.log10(Math.max(globalYMin, 1e-15)), Math.log10(Math.max(globalYMax, 1e-15))] : [globalYMin, globalYMax]) 
                : undefined)
            ),
            autorange: plotType === 'histogram' ? true : (!yRange && !(animationData && animationData.animationColumn && globalYMin !== Infinity))
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
    receipt += `var plt = {};\n\n`;

    // Config variables
    if (plotType !== 'histogram') {
        receipt += `plt.xAxisName = '${xAxis || 'Row Number'}';\n`;
    }
    receipt += `plt.yAxisNames = [${yAxis.map((y: string) => `'${y}'`).join(', ')}];\n`;
    if (groupAxis) {
        receipt += `plt.groupAxisName = '${groupAxis}';\n`;
    }
    receipt += `\n`;

    let receiptTraces: string[] = [];
    let receiptTraceCount = 0;

    // Traces for receipt
    processedTraces.forEach((traceInfo, index) => {
        const { fullTraceName, yCol, groupName } = traceInfo;

        const isSinglePlot = (rows * cols) <= 1;
        let assignedSubplots = traceToSubplots[fullTraceName];
        if (isSinglePlot || assignedSubplots === undefined) {
            assignedSubplots = [1];
        }

        assignedSubplots.forEach(subplotIndex => {
            receiptTraceCount++;
            const traceVar = `plt.trace${receiptTraceCount}`;
            const xAxisBase = subplotIndex === 1 ? 'x' : `x${subplotIndex}`;
            const yAxisBase = subplotIndex === 1 ? 'y' : `y${subplotIndex}`;

            const colCustomization = traceCustomizations?.[yCol] || {};
            const exactCustomization = traceCustomizations?.[fullTraceName] || {};
            const customization = { ...colCustomization, ...exactCustomization };
            customization.color = exactCustomization.color || undefined;
            const { size } = colorSideMenuData;

            let finalName = exactCustomization.displayName || fullTraceName;
            if (!exactCustomization.displayName && colCustomization.displayName && groupName) {
                finalName = `${colCustomization.displayName} (${groupName})`;
            }

            const baseColor = getColor(index);
            const finalColor = customization.color || traceInfo.groupColor || baseColor;
            const finalSize = customization.size || 8;

            let mode = customization.mode || 'markers';
            let markerParamsCode = '';

            const activeSymbol = customization.symbol || traceInfo.groupSymbol;

            if (activeSymbol) {
                if (mode === 'lines') mode = 'lines+markers';
                markerParamsCode = `\n${traceVar}.marker = { symbol: '${activeSymbol}', size: ${finalSize} };`;
            }

            if (customization.mode === 'markers') {
                mode = 'markers';
                const activeSizeModeReceipt = size.sizeMode || 'diameter';
                const sizeModeStr = activeSizeModeReceipt === 'area' ? `, sizemode: 'area', sizeref: Math.PI` : `, sizemode: 'diameter', sizeref: 0.5`;
                if (!activeSymbol) {
                    markerParamsCode = `\n${traceVar}.marker = { symbol: 'circle', size: ${finalSize}${sizeModeStr} };`;
                } else {
                    markerParamsCode = `\n${traceVar}.marker = { symbol: '${activeSymbol}', size: ${finalSize}${sizeModeStr} };`;
                }
            }

            if (plotType === 'histogram') {
                let histCode = `${traceVar} = {};
// ${traceVar}.x = ... // Histogram data mapped from yAxis
${traceVar}.type = 'histogram';
${traceVar}.name = '${finalName}';
${traceVar}.opacity = ${processedTraces.length > 1 ? 0.7 : 1};
${traceVar}.marker = { color: '${finalColor}' };
${traceVar}.xaxis = '${xAxisBase}';
${traceVar}.yaxis = '${yAxisBase}';`;
                const traceBins = customization.histogramBins;
                if (traceBins) {
                    histCode += `\n${traceVar}.autobinx = false;
${traceVar}.xbins = { start: ${traceBins.start}, end: ${traceBins.end}, size: ${traceBins.size} };`;
                }
                receiptTraces.push(histCode);
                return;
            }

            receiptTraces.push(`${traceVar} = {};
// ${traceVar}.x = ... // Filtered data
// ${traceVar}.y = ... // Filtered data
${traceVar}.mode = '${mode}';
${traceVar}.type = 'scatter';
${traceVar}.name = '${finalName}';
${traceVar}.xaxis = '${xAxisBase}';
${traceVar}.yaxis = '${yAxisBase}';
${traceVar}.line = { color: '${finalColor}' };${markerParamsCode}`);
        });
    });

    receipt += receiptTraces.join('\n\n') + '\n\n';

    receipt += `plt.data = [ ${Array.from({ length: receiptTraceCount }, (_, i) => `plt.trace${i + 1}`).join(', ')} ];\n\n`;

    // Layout
    receipt += `plt.layout = {
  title: { text: '${layout.title?.text}' },
  autosize: true,`;

    if (totalSubplots > 1) {
        receipt += `\n  grid: { rows: ${rows}, columns: ${cols}, pattern: 'independent' },`;
        for (let i = 1; i <= totalSubplots; i++) {
            const xKey = i === 1 ? 'xaxis' : `xaxis${i}`;
            const yKey = i === 1 ? 'yaxis' : `yaxis${i}`;

            receipt += `\n  ${xKey}: {
    title: { text: '${layout.xaxis?.title?.text}' },
    type: '${enableLogXAxis ? 'log' : (isXAxisDate ? 'date' : 'linear')}',
    ${xRange ? `range: [${enableLogXAxis ? Math.log10(Math.max(xRange[0], 1e-15)) : xRange[0]}, ${enableLogXAxis ? Math.log10(Math.max(xRange[1], 1e-15)) : xRange[1]}]` : '// autorange: true'}
  },`;
            receipt += `\n  ${yKey}: {
    title: { text: '${layout.yaxis?.title?.text}' },
    type: '${enableLogYAxis ? 'log' : (isYAxisDate ? 'date' : 'linear')}',
    ${yRange ? `range: [${enableLogYAxis ? Math.log10(Math.max(yRange[0], 1e-15)) : yRange[0]}, ${enableLogYAxis ? Math.log10(Math.max(yRange[1], 1e-15)) : yRange[1]}]` : '// autorange: true'}
  },`;
        }
        receipt += `\n  `;
    } else {
        receipt += `
  xaxis: {
    title: { text: '${layout.xaxis?.title?.text}' },
    type: '${enableLogXAxis ? 'log' : (isXAxisDate ? 'date' : 'linear')}',
    ${xRange ? `range: [${enableLogXAxis ? Math.log10(Math.max(xRange[0], 1e-15)) : xRange[0]}, ${enableLogXAxis ? Math.log10(Math.max(xRange[1], 1e-15)) : xRange[1]}]` : '// autorange: true'}
  },
  yaxis: {
    title: { text: '${layout.yaxis?.title?.text}' },
    type: '${enableLogYAxis ? 'log' : (isYAxisDate ? 'date' : 'linear')}',
    ${yRange ? `range: [${enableLogYAxis ? Math.log10(Math.max(yRange[0], 1e-15)) : yRange[0]}, ${enableLogYAxis ? Math.log10(Math.max(yRange[1], 1e-15)) : yRange[1]}]` : '// autorange: true'}
  },`;
    }

    receipt += `\n  showlegend: ${processedTraces.length > 8 ? 'false' : (legendOrientation === 'hidden' ? 'false' : (legendOrientation === 'auto' ? (processedTraces.length > 1 ? 'true' : 'false') : 'true'))}${legendOrientation === 'bottom' ? `,\n  legend: { orientation: 'h', yanchor: 'bottom', y: -0.2, xanchor: 'center', x: 0.5 }` : ''}
};\n\n`;

    receipt += `Plotly.newPlot('myDiv', plt.data, plt.layout);`;
    receipt += `\nconsole.log(plt);`;

    // Expose plt to the window so the user can easily inspect it in their console
    (window as any).plt = {
        xAxisName: plotType !== 'histogram' ? (xAxis || 'Row Number') : undefined,
        yAxisNames: yAxis,
        groupAxisName: groupAxis,
        data: plotData,
        layout: layout
    };

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

